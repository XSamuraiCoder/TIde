// Files for the calculator panel: CEmu's core compiled to WebAssembly (WebCEmu, GPLv3, built by
// TIde's release workflow from CEmu's source and downloaded on first use), and the user's own ROM.
// Both are stored in TIde's data folder; the page reads them back as bytes and runs the core itself.
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

const CORE_FILES: [&str; 2] = ["WebCEmu.js", "WebCEmu.wasm"];
const CORE_URL: &str = "https://github.com/XSamuraiCoder/TIde/releases/download/latest";

fn home(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("calculator"))
}

#[derive(Serialize)]
pub struct CalcFiles {
    core: bool,
    rom: bool,
}

/// Which of the emulator core and the ROM are in place.
#[tauri::command]
pub fn calc_files(app: tauri::AppHandle) -> Result<CalcFiles, String> {
    let dir = home(&app)?;
    Ok(CalcFiles {
        core: CORE_FILES.iter().all(|f| dir.join(f).is_file()),
        rom: dir.join("CE.rom").is_file(),
    })
}

/// Downloads the WebAssembly emulator core from TIde's latest release.
#[tauri::command(async)]
pub fn calc_install_core(app: tauri::AppHandle) -> Result<(), String> {
    let dir = home(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    for file in CORE_FILES {
        let part = dir.join(format!("{file}.part"));
        let mut cmd = Command::new("curl");
        cmd.args(["--location", "--fail", "--silent", "--show-error", "--output"]).arg(&part).arg(format!("{CORE_URL}/{file}"));
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        }
        let out = cmd.output().map_err(|e| format!("Could not run curl: {e}"))?;
        if !out.status.success() {
            let _ = fs::remove_file(&part);
            return Err(format!("Downloading {file} failed: {}", String::from_utf8_lossy(&out.stderr).trim()));
        }
        // Only replace the old file once the new one is complete.
        fs::rename(&part, dir.join(file)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Copies the user's ROM into TIde's data folder. Checks the size first: CE ROMs are 4 MB.
#[tauri::command]
pub fn calc_set_rom(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if !(0x40_0000..=0x40_0100).contains(&size) {
        return Err(format!("That file is {size} bytes. A TI-84 Plus CE ROM is 4 MB."));
    }
    let dir = home(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::copy(&path, dir.join("CE.rom")).map(|_| ()).map_err(|e| e.to_string())
}

/// TI files the calculator can receive (the same list as SEND_TYPES in calc.ts).
const SEND_TYPES: [&str; 23] = ["8xp", "8xv", "8xl", "8xn", "8xm", "8xy", "8xg", "8xs", "8xd", "8xw", "8xc", "8xz", "8xt",
    "8ca", "8cg", "8ci", "8ek", "8xk", "8eu", "8pu", "8yu", "b84", "b83"];

/// Reads a TI file (a program, app, appvar, group, image, bundle…) for the calculator panel.
#[tauri::command]
pub fn calc_read_program(path: String) -> Result<tauri::ipc::Response, String> {
    let ext = std::path::Path::new(&path).extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default();
    if !SEND_TYPES.contains(&ext.as_str()) {
        return Err(format!("{path} isn't a TI file the calculator can receive."));
    }
    fs::read(&path).map(tauri::ipc::Response::new).map_err(|e| format!("Could not read {path}: {e}"))
}

/// Finds the CE C libraries (clibs.8xg, a separate download from the CE toolchain's releases).
/// Looks in the project (its root, bin/ and lib/), then $CEDEV and the default toolchain folder.
#[tauri::command]
pub fn find_clibs(project_root: Option<String>) -> Option<String> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    if let Some(root) = project_root.map(PathBuf::from) {
        dirs.extend([root.clone(), root.join("bin"), root.join("lib")]);
    }
    let mut toolchains: Vec<PathBuf> = std::env::var_os("CEDEV").map(PathBuf::from).into_iter().collect();
    if cfg!(windows) {
        toolchains.push(PathBuf::from(r"C:\CEdev"));
    } else if let Some(home) = std::env::var_os("HOME") {
        toolchains.push(PathBuf::from(home).join("CEdev"));
    }
    for dir in toolchains {
        dirs.extend([dir.clone(), dir.join("lib"), dir.join("bin")]);
    }
    dirs.iter().find_map(|dir| {
        fs::read_dir(dir).ok()?.flatten().map(|e| e.path())
            .find(|p| p.is_file() && p.file_name().is_some_and(|n| n.to_string_lossy().eq_ignore_ascii_case("clibs.8xg")))
            .map(|p| p.to_string_lossy().into_owned())
    })
}

/// Reads one of the stored files for the page: the core's script, its WebAssembly, or the ROM.
#[tauri::command]
pub fn calc_read(app: tauri::AppHandle, name: String) -> Result<tauri::ipc::Response, String> {
    if !(CORE_FILES.contains(&name.as_str()) || name == "CE.rom") {
        return Err(format!("{name} isn't a calculator file."));
    }
    let bytes = fs::read(home(&app)?.join(&name)).map_err(|e| format!("Could not read {name}: {e}"))?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_clibs_in_a_project_bin_folder() {
        let root = std::env::temp_dir().join(format!("tide-clibs-{}", std::process::id()));
        fs::create_dir_all(root.join("bin")).unwrap();
        fs::write(root.join("bin").join("CLIBS.8xg"), b"x").unwrap();
        let found = find_clibs(Some(root.to_string_lossy().into_owned()));
        fs::remove_dir_all(&root).unwrap();
        assert!(found.is_some_and(|p| p.ends_with("CLIBS.8xg")));
    }
}
