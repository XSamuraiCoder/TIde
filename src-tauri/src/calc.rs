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

/// Reads a built program (.8xp or .8xv) for the calculator panel.
#[tauri::command]
pub fn calc_read_program(path: String) -> Result<tauri::ipc::Response, String> {
    let lower = path.to_ascii_lowercase();
    if !(lower.ends_with(".8xp") || lower.ends_with(".8xv")) {
        return Err(format!("{path} isn't a calculator program."));
    }
    fs::read(&path).map(tauri::ipc::Response::new).map_err(|e| format!("Could not read {path}: {e}"))
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
