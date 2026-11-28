// Files for the calculator panel: three emulator cores compiled to WebAssembly and built into
// TIde (see emulator/: each has its build.sh and SOURCE.txt). CEmu's (WebCEmu, GPLv3) runs the
// TI-84 Plus CE, TilEm's (TilEm, GPLv3+) the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and
// 86, and Firebird's (firebird, GPLv3) the TI-Nspire CX. Then the user's own images: any number of
// CE ROMs in ce/ (a TI-84 Plus CE's, a TI-83 Premium CE's...), any number of other ROMs in roms/, and the Nspire's boot1.img and flash.img in nspire/, all kept in
// TIde's data folder. The page reads them all as bytes and runs the cores itself.
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// The emulator cores, built into TIde, by the names the page asks for.
const CORES: [(&str, &[u8]); 6] = [
    (
        "WebCEmu.js",
        include_bytes!("../../emulator/cemu/dist/WebCEmu.js"),
    ),
    (
        "WebCEmu.wasm",
        include_bytes!("../../emulator/cemu/dist/WebCEmu.wasm"),
    ),
    (
        "TilEm.js",
        include_bytes!("../../emulator/tilem/dist/TilEm.js"),
    ),
    (
        "TilEm.wasm",
        include_bytes!("../../emulator/tilem/dist/TilEm.wasm"),
    ),
    (
        "firebird.js",
        include_bytes!("../../emulator/firebird/dist/firebird.js"),
    ),
    (
        "firebird.wasm",
        include_bytes!("../../emulator/firebird/dist/firebird.wasm"),
    ),
];

fn home(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("calculator"))
}

#[derive(Serialize)]
pub struct CalcFiles {
    /// The CE-family ROMs (TI-84 Plus CE, TI-83 Premium CE, TI-82 AEP), by file name.
    ces: Vec<String>,
    /// Other models' ROMs, by file name.
    roms: Vec<String>,
    /// The Nspire's boot1 and flash images.
    nspire: NspireFiles,
}

#[derive(Serialize)]
pub struct NspireFiles {
    boot1: bool,
    flash: bool,
    /// The stored images' sizes in bytes, for the setup panel to show.
    boot1_size: Option<u64>,
    flash_size: Option<u64>,
}

/// The Nspire images' folder in TIde's data folder.
fn nspire_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(home(app)?.join("nspire"))
}

/// A ROM's file name in roms/, if it is a plain name (no folders).
fn rom_name(name: &str) -> Result<&str, String> {
    let ok = !name.is_empty()
        && name.len() <= 120
        && !name.starts_with('.')
        && name
            .chars()
            .all(|c| c.is_alphanumeric() || " ._-+()[]".contains(c));
    if ok {
        Ok(name)
    } else {
        Err(format!("\"{name}\" isn't a ROM name."))
    }
}

/// The ROMs in a folder, by name.
fn list_roms(dir: &std::path::Path) -> Vec<String> {
    let mut roms: Vec<String> = fs::read_dir(dir)
        .map(|entries| {
            entries
                .flatten()
                .filter(|e| e.path().is_file())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .filter(|n| rom_name(n).is_ok())
                .collect()
        })
        .unwrap_or_default();
    roms.sort_by_key(|n| n.to_lowercase());
    roms
}

/// A name for a ROM in `dir`: its own, unless a different ROM already has it, then "name (2).rom"
/// and on, so several ROMs of the same calculator (often all named alike) are kept side by side.
/// The same ROM again keeps its name.
fn stored_name(dir: &std::path::Path, name: &str, bytes: &[u8]) -> String {
    let (stem, ext) = match name.rfind('.') {
        Some(i) if i > 0 => (&name[..i], &name[i..]),
        _ => (name, ""),
    };
    let mut n = 1;
    loop {
        let candidate = if n == 1 {
            name.to_string()
        } else {
            format!("{stem} ({n}){ext}")
        };
        match fs::read(dir.join(&candidate)) {
            Ok(existing) if existing != bytes => n += 1,
            _ => return candidate,
        }
    }
}

/// A file's name made safe for a ROM folder.
fn clean_name(path: &str) -> Result<String, String> {
    let file = std::path::Path::new(path)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let clean: String = file
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || " ._-+()[]".contains(c) {
                c
            } else {
                '_'
            }
        })
        .collect();
    Ok(rom_name(clean.trim_start_matches('.'))?.to_string())
}

/// Which ROMs and images are in place. A CE.rom from before TIde kept several moves into ce/.
#[tauri::command]
pub fn calc_files(app: tauri::AppHandle) -> Result<CalcFiles, String> {
    let dir = home(&app)?;
    if dir.join("CE.rom").is_file() && !dir.join("ce").join("CE.rom").exists() {
        fs::create_dir_all(dir.join("ce")).map_err(|e| e.to_string())?;
        fs::rename(dir.join("CE.rom"), dir.join("ce").join("CE.rom")).map_err(|e| e.to_string())?;
    }
    let nspire = nspire_dir(&app)?;
    Ok(CalcFiles {
        ces: list_roms(&dir.join("ce")),
        roms: list_roms(&dir.join("roms")),
        nspire: NspireFiles {
            boot1: nspire.join("boot1.img").is_file(),
            flash: nspire.join("flash.img").is_file(),
            boot1_size: fs::metadata(nspire.join("boot1.img")).ok().map(|m| m.len()),
            flash_size: fs::metadata(nspire.join("flash.img")).ok().map(|m| m.len()),
        },
    })
}

/// The flash image sizes Firebird accepts: 33 MB (Nspire CX) or 132 MB (CX II).
fn is_nspire_flash(size: u64) -> bool {
    size == 33 * 1024 * 1024 || size == 132 * 1024 * 1024
}

/// Copies the user's ROM into TIde's data folder. A 4 MB ROM is a CE's (TI-84 Plus CE, TI-83
/// Premium CE or TI-82 AEP) and goes in ce/ under its own name; a 33 or 132 MB image is a Nspire flash and becomes nspire/flash.img; a 512 KB file
/// named like a boot1 is the Nspire's boot image and becomes nspire/boot1.img; anything else
/// (16 KB to 4 MB: a TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 or 86 ROM) goes
/// in roms/ under its own name. A different ROM with the same name gets "name (2)" and on.
/// Returns "ce:" or "rom:" and the stored name, or "nspire".
#[tauri::command]
pub fn calc_set_rom(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    let dir = home(&app)?;
    if (0x40_0000..=0x40_0100).contains(&size) {
        let bytes = fs::read(&path).map_err(|e| e.to_string())?;
        let ce = dir.join("ce");
        fs::create_dir_all(&ce).map_err(|e| e.to_string())?;
        let name = stored_name(&ce, &clean_name(&path)?, &bytes);
        fs::write(ce.join(&name), &bytes).map_err(|e| e.to_string())?;
        return Ok(format!("ce:{name}"));
    }
    let file = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    if is_nspire_flash(size) {
        let nspire = nspire_dir(&app)?;
        fs::create_dir_all(&nspire).map_err(|e| e.to_string())?;
        fs::copy(&path, nspire.join("flash.img")).map_err(|e| e.to_string())?;
        return Ok("nspire".into());
    }
    if size == 0x8_0000 && file.to_ascii_lowercase().contains("boot1") {
        let nspire = nspire_dir(&app)?;
        fs::create_dir_all(&nspire).map_err(|e| e.to_string())?;
        fs::copy(&path, nspire.join("boot1.img")).map_err(|e| e.to_string())?;
        return Ok("nspire".into());
    }
    if !(0x4000..0x40_0000).contains(&size) {
        return Err(format!(
            "That file is {size} bytes, which isn't the size of a calculator ROM or Nspire image."
        ));
    }
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let roms = dir.join("roms");
    fs::create_dir_all(&roms).map_err(|e| e.to_string())?;
    let name = stored_name(&roms, &clean_name(&path)?, &bytes);
    fs::write(roms.join(&name), &bytes).map_err(|e| e.to_string())?;
    Ok(format!("rom:{name}"))
}

/// Stores one of the Nspire's images in nspire/, after checking its size: "boot1" (512 KB) or "flash"
/// (33 or 132 MB). Returns its size. The setup panel adds them one at a time.
#[tauri::command]
pub fn calc_set_nspire_image(app: tauri::AppHandle, part: String, path: String) -> Result<u64, String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    let target = match part.as_str() {
        "boot1" if size == 0x8_0000 => "boot1.img",
        "boot1" => {
            return Err(format!(
                "That file is {size} bytes; a TI-Nspire boot1 image is 524,288 bytes (512 KB)."
            ))
        }
        "flash" if is_nspire_flash(size) => "flash.img",
        "flash" => {
            return Err(format!(
                "That file is {size} bytes; a TI-Nspire flash image is 138,412,032 (132 MB, CX and CX II) or 34,603,008 (33 MB, older models). An OS file (.tcc, .tco, .tcc2) isn't a flash image."
            ))
        }
        _ => return Err(format!("\"{part}\" isn't boot1 or flash.")),
    };
    let dir = nspire_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::copy(&path, dir.join(target)).map_err(|e| e.to_string())?;
    Ok(size)
}

/// Stores the Nspire's boot1 (512 KB) and flash (33 or 132 MB) images in nspire/.
#[tauri::command]
pub fn calc_set_nspire(app: tauri::AppHandle, boot1: String, flash: String) -> Result<(), String> {
    let boot_size = fs::metadata(&boot1).map_err(|e| e.to_string())?.len();
    let flash_size = fs::metadata(&flash).map_err(|e| e.to_string())?.len();
    if boot_size != 0x8_0000 {
        return Err(format!(
            "The boot1 image is {boot_size} bytes; a TI-Nspire CX boot1 is 524288 (512 KB)."
        ));
    }
    if !is_nspire_flash(flash_size) {
        return Err(format!(
            "The flash image is {flash_size} bytes; a Nspire flash is 33 or 132 MB."
        ));
    }
    let dir = nspire_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::copy(&boot1, dir.join("boot1.img")).map_err(|e| e.to_string())?;
    fs::copy(&flash, dir.join("flash.img")).map_err(|e| e.to_string())?;
    Ok(())
}

/// Removes a stored ROM: "ce/" and a CE ROM's name, or another model's ROM's name in roms/.
#[tauri::command]
pub fn calc_remove_rom(app: tauri::AppHandle, name: String) -> Result<(), String> {
    let path = match name.strip_prefix("ce/") {
        Some(ce) => home(&app)?.join("ce").join(rom_name(ce)?),
        None => home(&app)?.join("roms").join(rom_name(&name)?),
    };
    fs::remove_file(path).map_err(|e| e.to_string())
}

/// Removes the stored Nspire images.
#[tauri::command]
pub fn calc_remove_nspire(app: tauri::AppHandle) -> Result<(), String> {
    fs::remove_dir_all(nspire_dir(&app)?).map_err(|e| e.to_string())
}

/// Writes a piece of the Nspire's flash image back into nspire/flash.img after the emulator ran, so
/// files sent to the calculator stay for the next session. The piece is the request's raw body (no
/// JSON), at the offset in its `x-tide-offset` header; `x-tide-total` is the image's whole size, and
/// the file is cut to it, so a smaller image never keeps the end of a bigger one.
#[tauri::command]
pub fn calc_nspire_flash_write(app: tauri::AppHandle, request: tauri::ipc::Request<'_>) -> Result<(), String> {
    use std::io::{Seek, SeekFrom, Write};
    let header = |name: &str| -> Result<u64, String> {
        request.headers().get(name).and_then(|v| v.to_str().ok()).and_then(|v| v.parse().ok()).ok_or(format!("No {name}."))
    };
    let (offset, total) = (header("x-tide-offset")?, header("x-tide-total")?);
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else { return Err("No flash data.".into()) };
    if !is_nspire_flash(total) {
        return Err(format!("A {total}-byte image isn't a TI-Nspire flash image."));
    }
    let path = nspire_dir(&app)?.join("flash.img");
    fs::create_dir_all(path.parent().unwrap()).map_err(|e| e.to_string())?;
    let mut f = fs::OpenOptions::new().create(true).truncate(false).write(true).open(&path).map_err(|e| e.to_string())?;
    f.seek(SeekFrom::Start(offset)).map_err(|e| e.to_string())?;
    f.write_all(bytes).map_err(|e| e.to_string())?;
    if offset + bytes.len() as u64 >= total {
        f.set_len(total).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// TI files the calculator can receive (the same list as SEND_TYPES in calc.ts).
const SEND_TYPES: [&str; 57] = [
    "8xp", "8xv", "8xl", "8xn", "8xm", "8xy", "8xg", "8xs", "8xd", "8xw", "8xc", "8xz", "8xt",
    "8ca", "8cg", "8ci", "8ek", "8xk", "8eu", "8pu", "8yu", "b84", "b83", "73p", "73l", "73n",
    "73g", "73k", "82p", "82l", "82n", "82m", "82g", "83p", "83l", "83n", "83m", "83g", "85p",
    "85s", "85l", "85n", "85m", "85g", "86p", "86s", "86l", "86n", "86m", "86g", "85b", "86b",
    "82b", "83b", "tns", "tno", "tnc",
];

/// Reads a TI file (a program, app, appvar, group, image, bundle…) for the calculator panel.
#[tauri::command]
pub fn calc_read_program(path: String) -> Result<tauri::ipc::Response, String> {
    let ext = std::path::Path::new(&path)
        .extension()
        .map(|e| e.to_string_lossy().to_ascii_lowercase())
        .unwrap_or_default();
    if !SEND_TYPES.contains(&ext.as_str()) {
        return Err(format!(
            "{path} isn't a TI file the calculator can receive."
        ));
    }
    fs::read(&path)
        .map(tauri::ipc::Response::new)
        .map_err(|e| format!("Could not read {path}: {e}"))
}

/// Finds the CE C libraries (clibs.8xg, a separate download from the CE toolchain's releases).
/// Looks in the project (its root, bin/ and lib/), then `cedev` (the CE toolchain folder in Settings),
/// $CEDEV and the default toolchain folder.
#[tauri::command]
pub fn find_clibs(project_root: Option<String>, cedev: Option<String>) -> Option<String> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    if let Some(root) = project_root.map(PathBuf::from) {
        dirs.extend([root.clone(), root.join("bin"), root.join("lib")]);
    }
    let mut toolchains: Vec<PathBuf> = cedev
        .filter(|c| !c.trim().is_empty())
        .map(|c| PathBuf::from(c.trim()))
        .into_iter()
        .chain(std::env::var_os("CEDEV").map(PathBuf::from))
        .collect();
    if cfg!(windows) {
        toolchains.push(PathBuf::from(r"C:\CEdev"));
    } else if let Some(home) = std::env::var_os("HOME") {
        toolchains.push(PathBuf::from(home).join("CEdev"));
    }
    for dir in toolchains {
        dirs.extend([dir.clone(), dir.join("lib"), dir.join("bin")]);
    }
    dirs.iter().find_map(|dir| {
        fs::read_dir(dir)
            .ok()?
            .flatten()
            .map(|e| e.path())
            .find(|p| {
                p.is_file()
                    && p.file_name()
                        .is_some_and(|n| n.to_string_lossy().eq_ignore_ascii_case("clibs.8xg"))
            })
            .map(|p| p.to_string_lossy().into_owned())
    })
}

/// Reads one of the stored files for the page: a core's script or WebAssembly, "ce/" and a CE
/// ROM's name, "roms/" and another stored ROM's name, or "nspire/boot1.img" / "nspire/flash.img".
#[tauri::command]
pub fn calc_read(app: tauri::AppHandle, name: String) -> Result<tauri::ipc::Response, String> {
    if let Some((_, bytes)) = CORES.iter().find(|(file, _)| *file == name) {
        return Ok(tauri::ipc::Response::new(bytes.to_vec()));
    }
    let dir = home(&app)?;
    let path = if let Some(rom) = name.strip_prefix("roms/") {
        dir.join("roms").join(rom_name(rom)?)
    } else if let Some(image) = name.strip_prefix("nspire/") {
        if image != "boot1.img" && image != "flash.img" {
            return Err(format!("{name} isn't a calculator file."));
        }
        nspire_dir(&app)?.join(image)
    } else if let Some(rom) = name.strip_prefix("ce/") {
        dir.join("ce").join(rom_name(rom)?)
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
                assert!(
                    String::from_utf8_lossy(bytes).contains(file.trim_end_matches(".js")),
                    "{file}"
                );
            }
        }
    }

    #[test]
    fn nspire_flash_sizes_are_33_or_132_mb() {
        assert!(is_nspire_flash(33 * 1024 * 1024));
        assert!(is_nspire_flash(132 * 1024 * 1024));
        assert!(!is_nspire_flash(0x8_0000));
        assert!(!is_nspire_flash(0x40_0000));
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
    fn a_different_rom_with_the_same_name_is_kept_beside_it() {
        let dir = std::env::temp_dir().join(format!("tide-roms-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        assert_eq!(stored_name(&dir, "CE.rom", b"a"), "CE.rom");
        fs::write(dir.join("CE.rom"), b"a").unwrap();
        assert_eq!(stored_name(&dir, "CE.rom", b"a"), "CE.rom");
        assert_eq!(stored_name(&dir, "CE.rom", b"b"), "CE (2).rom");
        fs::write(dir.join("CE (2).rom"), b"b").unwrap();
        assert_eq!(stored_name(&dir, "CE.rom", b"c"), "CE (3).rom");
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn finds_clibs_in_a_project_bin_folder() {
        let root = std::env::temp_dir().join(format!("tide-clibs-{}", std::process::id()));
        fs::create_dir_all(root.join("bin")).unwrap();
        fs::write(root.join("bin").join("CLIBS.8xg"), b"x").unwrap();
        let found = find_clibs(Some(root.to_string_lossy().into_owned()), None);
        fs::remove_dir_all(&root).unwrap();
        assert!(found.is_some_and(|p| p.ends_with("CLIBS.8xg")));
    }
}
