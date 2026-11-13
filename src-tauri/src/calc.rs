// Files for the calculator panel: two emulator cores compiled to WebAssembly and built into TIde
// (see emulator/: each has its build.sh and SOURCE.txt). CEmu's (WebCEmu, GPLv3) runs the TI-84
// Plus CE, and Wabbitemu's (WabbitEmu, GPLv2+) the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and 86.
// Then the user's own ROMs: CE.rom, and any number of others in roms/, kept in TIde's data folder.
// The page reads them all as bytes and runs the cores itself.
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// The emulator cores, built into TIde, by the names the page asks for.
const CORES: [(&str, &[u8]); 4] = [
    ("WebCEmu.js", include_bytes!("../../emulator/cemu/dist/WebCEmu.js")),
    ("WebCEmu.wasm", include_bytes!("../../emulator/cemu/dist/WebCEmu.wasm")),
    ("WabbitEmu.js", include_bytes!("../../emulator/wabbit/dist/WabbitEmu.js")),
    ("WabbitEmu.wasm", include_bytes!("../../emulator/wabbit/dist/WabbitEmu.wasm")),
];

fn home(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("calculator"))
}

#[derive(Serialize)]
pub struct CalcFiles {
    /// The TI-84 Plus CE ROM.
    rom: bool,
    /// Other models' ROMs, by file name.
    roms: Vec<String>,
}

/// A ROM's file name in roms/, if it is a plain name (no folders).
fn rom_name(name: &str) -> Result<&str, String> {
    let ok = !name.is_empty() && name.len() <= 120 && !name.starts_with('.')
        && name.chars().all(|c| c.is_alphanumeric() || " ._-+()[]".contains(c));
    if ok { Ok(name) } else { Err(format!("\"{name}\" isn't a ROM name.")) }
}

/// Which ROMs are in place.
#[tauri::command]
pub fn calc_files(app: tauri::AppHandle) -> Result<CalcFiles, String> {
    let dir = home(&app)?;
    let mut roms: Vec<String> = fs::read_dir(dir.join("roms")).map(|entries| {
        entries.flatten().filter(|e| e.path().is_file()).map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| rom_name(n).is_ok()).collect()
    }).unwrap_or_default();
    roms.sort_by_key(|n| n.to_lowercase());
    Ok(CalcFiles {
        rom: dir.join("CE.rom").is_file(),
        roms,
    })
}

/// Copies the user's ROM into TIde's data folder. A 4 MB ROM is a TI-84 Plus CE's and becomes
/// CE.rom; anything else (16 KB to 4 MB: a TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 or 86 ROM, or a
/// Wabbitemu .sav) goes in roms/ under its own name. Returns "ce", or "rom:" and the stored name.
#[tauri::command]
pub fn calc_set_rom(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    let dir = home(&app)?;
    if (0x40_0000..=0x40_0100).contains(&size) {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        fs::copy(&path, dir.join("CE.rom")).map_err(|e| e.to_string())?;
        return Ok("ce".into());
    }
    if !(0x4000..0x40_0000).contains(&size) {
        return Err(format!("That file is {size} bytes, which isn't the size of a calculator ROM."));
    }
    let file = std::path::Path::new(&path).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let clean: String = file.chars().map(|c| if c.is_alphanumeric() || " ._-+()[]".contains(c) { c } else { '_' }).collect();
    let name = rom_name(clean.trim_start_matches('.'))?.to_string();
    fs::create_dir_all(dir.join("roms")).map_err(|e| e.to_string())?;
    fs::copy(&path, dir.join("roms").join(&name)).map_err(|e| e.to_string())?;
    Ok(format!("rom:{name}"))
}

/// Removes a stored ROM from roms/.
#[tauri::command]
pub fn calc_remove_rom(app: tauri::AppHandle, name: String) -> Result<(), String> {
    fs::remove_file(home(&app)?.join("roms").join(rom_name(&name)?)).map_err(|e| e.to_string())
}

/// TI files the calculator can receive (the same list as SEND_TYPES in calc.ts).
const SEND_TYPES: [&str; 54] = ["8xp", "8xv", "8xl", "8xn", "8xm", "8xy", "8xg", "8xs", "8xd", "8xw", "8xc", "8xz", "8xt",
    "8ca", "8cg", "8ci", "8ek", "8xk", "8eu", "8pu", "8yu", "b84", "b83",
    "73p", "73l", "73n", "73g", "73k", "82p", "82l", "82n", "82m", "82g", "83p", "83l", "83n", "83m", "83g",
    "85p", "85s", "85l", "85n", "85m", "85g", "86p", "86s", "86l", "86n", "86m", "86g", "85b", "86b", "82b", "83b"];

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

/// Reads one of the stored files for the page: a core's script or WebAssembly, CE.rom, or
/// "roms/" and a stored ROM's name.
#[tauri::command]
pub fn calc_read(app: tauri::AppHandle, name: String) -> Result<tauri::ipc::Response, String> {
    if let Some((_, bytes)) = CORES.iter().find(|(file, _)| *file == name) {
        return Ok(tauri::ipc::Response::new(bytes.to_vec()));
    }
    let dir = home(&app)?;
    let path = if let Some(rom) = name.strip_prefix("roms/") {
        dir.join("roms").join(rom_name(rom)?)
    } else if name == "CE.rom" {
        dir.join(&name)
    } else {
        return Err(format!("{name} isn't a calculator file."));
    };
    let bytes = fs::read(path).map_err(|e| format!("Could not read {name}: {e}"))?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn emulators_are_built_in() {
        for (file, bytes) in CORES {
            if file.ends_with(".wasm") {
                assert_eq!(&bytes[..4], b"\0asm", "{file}");
            } else {
                assert!(String::from_utf8_lossy(bytes).contains(file.trim_end_matches(".js")), "{file}");
            }
        }
    }

    #[test]
    fn rom_names_stay_in_the_roms_folder() {
        assert!(rom_name("TI-PLUS.rom").is_ok());
        assert!(rom_name("ti83 (v1.10).rom").is_ok());
        for bad in ["", "../CE.rom", "a/b.rom", "a\\b.rom", ".hidden", "x:y.rom"] {
            assert!(rom_name(bad).is_err(), "{bad} should be refused");
        }
    }

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
