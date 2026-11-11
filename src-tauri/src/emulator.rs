// Runs programs in CEmu, the TI-84 Plus CE emulator (https://github.com/CE-Programming/CEmu).
// CEmu is a separate GPLv3 program: TIde downloads the official release once, keeps it in its data
// folder, and starts it with command-line options. CEmu asks for the user's own calculator ROM itself.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

const VERSION: &str = "v2.0";

/// The release file for this platform, and the program to run once it is unpacked.
fn asset() -> Result<&'static str, String> {
    if cfg!(target_os = "windows") {
        Ok("CEmu-v2.0_win64_Qt6.exe")
    } else if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        Ok("CEmu-v2.0_macOS_Qt6_arm.dmg")
    } else if cfg!(target_os = "macos") {
        Ok("CEmu-v2.0_macOS_Qt6_intel.dmg")
    } else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
        Ok("CEmu-v2.0_linux_Qt6-static.zip")
    } else {
        Err("CEmu has no download for this platform. Install it yourself from https://ce-programming.github.io/CEmu".into())
    }
}

fn home(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("cemu"))
}

/// Quiet child processes: no console window flashes up on Windows.
fn command(program: impl AsRef<std::ffi::OsStr>) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    cmd
}

fn run(cmd: &mut Command, what: &str) -> Result<(), String> {
    let out = cmd.output().map_err(|e| format!("Could not run {what}: {e}"))?;
    if out.status.success() { return Ok(()); }
    let err = String::from_utf8_lossy(&out.stderr);
    Err(format!("{what} failed: {}", err.trim()))
}

/// The CEmu program inside the install folder, if it is there.
fn executable(dir: &Path) -> Option<PathBuf> {
    let path = if cfg!(target_os = "windows") {
        dir.join("CEmu.exe")
    } else if cfg!(target_os = "macos") {
        dir.join("CEmu.app/Contents/MacOS/CEmu")
    } else {
        dir.join("CEmu")
    };
    path.is_file().then_some(path)
}

/// Finds a file or folder by name anywhere under `dir` (the Linux zip and the Mac disk image nest it).
fn find(dir: &Path, test: &dyn Fn(&Path) -> bool) -> Option<PathBuf> {
    for entry in fs::read_dir(dir).ok()?.flatten() {
        let path = entry.path();
        if test(&path) { return Some(path); }
        if path.is_dir() && path.extension().is_none_or(|e| e != "app") {
            if let Some(hit) = find(&path, test) { return Some(hit); }
        }
    }
    None
}

/// Where CEmu is installed, or null if it hasn't been downloaded yet.
#[tauri::command]
pub fn emulator_status(app: tauri::AppHandle) -> Result<Option<String>, String> {
    Ok(executable(&home(&app)?).map(|p| p.to_string_lossy().into_owned()))
}

/// Downloads the official CEmu release for this platform into TIde's data folder.
#[tauri::command(async)]
pub fn emulator_install(app: tauri::AppHandle) -> Result<String, String> {
    let dir = home(&app)?;
    if let Some(path) = executable(&dir) { return Ok(path.to_string_lossy().into_owned()); }
    let name = asset()?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let download = dir.join(name);
    let url = format!("https://github.com/CE-Programming/CEmu/releases/download/{VERSION}/{name}");
    // curl ships with Windows 10+, macOS and Linux, and follows GitHub's redirect to the file.
    run(command("curl").args(["--location", "--fail", "--silent", "--show-error", "--output"]).arg(&download).arg(&url), "Downloading CEmu")?;

    if cfg!(target_os = "windows") {
        fs::rename(&download, dir.join("CEmu.exe")).map_err(|e| e.to_string())?;
    } else if cfg!(target_os = "macos") {
        let mount = dir.join("mount");
        run(command("hdiutil").args(["attach", "-nobrowse", "-readonly", "-mountpoint"]).arg(&mount).arg(&download), "Opening the CEmu disk image")?;
        let copied = find(&mount, &|p: &Path| p.extension().is_some_and(|e| e == "app"))
            .ok_or_else(|| "The CEmu disk image has no app in it.".to_string())
            .and_then(|app_dir| run(command("cp").arg("-R").arg(&app_dir).arg(dir.join("CEmu.app")), "Copying CEmu"));
        let _ = command("hdiutil").args(["detach", "-quiet"]).arg(&mount).output();
        copied?;
        let _ = fs::remove_file(&download);
    } else {
        let unpacked = dir.join("unpacked");
        let unzip = run(command("unzip").args(["-o", "-q"]).arg(&download).arg("-d").arg(&unpacked), "Unzipping CEmu");
        if unzip.is_err() {
            run(command("python3").args(["-m", "zipfile", "-e"]).arg(&download).arg(&unpacked), "Unzipping CEmu (install unzip)")?;
        }
        let binary = find(&unpacked, &|p: &Path| p.is_file() && p.file_name().is_some_and(|n| n.eq_ignore_ascii_case("cemu")))
            .ok_or_else(|| "The CEmu download has no CEmu program in it.".to_string())?;
        fs::rename(&binary, dir.join("CEmu")).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(dir.join("CEmu"), fs::Permissions::from_mode(0o755)).map_err(|e| e.to_string())?;
        }
        let _ = fs::remove_dir_all(&unpacked);
        let _ = fs::remove_file(&download);
    }
    executable(&dir)
        .map(|p| p.to_string_lossy().into_owned())
        .ok_or_else(|| "CEmu was downloaded but couldn't be found afterwards.".into())
}

/// Writes a program for the emulator into TIde's data folder and returns its path.
#[tauri::command]
pub fn emulator_stage(app: tauri::AppHandle, name: String, bytes: Vec<u8>) -> Result<String, String> {
    let dir = home(&app)?.join("programs");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let safe: String = name.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
    let path = dir.join(format!("{}.8xp", if safe.is_empty() { "PROGRAM" } else { &safe }));
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

/// Sends files to CEmu and launches a program. "--id tide" reuses the emulator TIde started before,
/// so each run lands in the same window instead of opening another.
#[tauri::command]
pub fn emulator_run(app: tauri::AppHandle, files: Vec<String>, launch: Option<String>) -> Result<(), String> {
    let exe = executable(&home(&app)?).ok_or_else(|| "CEmu isn't installed yet.".to_string())?;
    let mut cmd = Command::new(exe);
    cmd.args(["--id", "tide"]);
    for file in &files { cmd.arg("--send").arg(file); }
    if let Some(name) = launch.filter(|n| !n.is_empty()) { cmd.arg("--launch").arg(name); }
    cmd.spawn().map(|_| ()).map_err(|e| format!("Could not start CEmu: {e}"))
}
