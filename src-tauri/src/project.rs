// Folder browsing and text-file IO for opened projects.
use serde::Serialize;
use std::fs;
use std::io::ErrorKind;
use std::process::Command;

/// Never worth showing in a project tree.
const SKIP: &[&str] = &[".git", "node_modules", "target", ".DS_Store"];
const MAX_FILE_BYTES: u64 = 2 * 1024 * 1024;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
}

/// Immediate children of a directory, folders first, then A–Z.
#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let mut out = Vec::new();
    for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if SKIP.contains(&name.as_str()) {
            continue;
        }
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        out.push(DirEntry {
            name,
            path: entry.path().to_string_lossy().into_owned(),
            is_dir,
        });
    }
    out.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(out)
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if size > MAX_FILE_BYTES {
        return Err("file is larger than 2 MB".into());
    }
    fs::read_to_string(&path).map_err(|_| "not a UTF-8 text file".into())
}

/// Reads any file as bytes, for files in other encodings and TI files. Up to 16 MB (OS files are about 3 MB).
#[tauri::command]
pub fn read_binary_file(path: String) -> Result<tauri::ipc::Response, String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if size > 16 * 1024 * 1024 {
        return Err("file is larger than 16 MB".into());
    }
    fs::read(&path).map(tauri::ipc::Response::new).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), String> {
    // Creates missing folders, such as a project's .tide folder.
    if let Some(parent) = std::path::Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, contents).map_err(|e| e.to_string())
}

/// Deletes a file or folder: to the Recycle Bin (Trash on macOS) unless `permanent`, which can't be undone.
#[tauri::command(async)]
pub fn delete_path(path: String, permanent: bool) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Err(format!("{path} doesn't exist."));
    }
    if !permanent {
        return trash::delete(p).map_err(|e| format!("Couldn't move it to the Recycle Bin: {e}"));
    }
    if p.is_dir() { fs::remove_dir_all(p) } else { fs::remove_file(p) }.map_err(|e| e.to_string())
}

/// Creates a folder (and any missing parents), for New folder in the Explorer.
#[tauri::command]
pub fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

/// Binary output for exported calculator files (.8xp and friends).
#[tauri::command]
pub fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, bytes).map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct MakeResult {
    ok: bool,
    output: String,
}

/// Runs `make` in a project folder. Async so a long build doesn't freeze the window.
#[tauri::command(async)]
pub fn run_make(dir: String) -> Result<MakeResult, String> {
    let mut command = Command::new("make");
    command.current_dir(&dir);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let out = command.output().map_err(|e| match e.kind() {
        ErrorKind::NotFound => "make was not found. Install the CE toolchain and add it to PATH.".to_string(),
        _ => e.to_string(),
    })?;
    let mut output = String::from_utf8_lossy(&out.stdout).into_owned();
    output.push_str(&String::from_utf8_lossy(&out.stderr));
    Ok(MakeResult { ok: out.status.success(), output })
}

/// Runs a build or task command from a project's .tide/project.json. Async so it doesn't freeze the window.
#[tauri::command(async)]
pub fn run_command(dir: String, command: String, args: Vec<String>) -> Result<MakeResult, String> {
    let lower = command.to_ascii_lowercase();
    // Batch files only run through cmd.
    let mut cmd = if cfg!(windows) && (lower.ends_with(".bat") || lower.ends_with(".cmd")) {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&command);
        c
    } else {
        Command::new(&command)
    };
    cmd.args(&args).current_dir(&dir);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let out = cmd.output().map_err(|e| match e.kind() {
        ErrorKind::NotFound => format!("{command} was not found. Check the command, or add it to PATH."),
        _ => e.to_string(),
    })?;
    let mut output = String::from_utf8_lossy(&out.stdout).into_owned();
    output.push_str(&String::from_utf8_lossy(&out.stderr));
    Ok(MakeResult { ok: out.status.success(), output })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_in(name: &str, makefile: &str) -> MakeResult {
        let dir = std::env::temp_dir().join(format!("tide-make-{name}-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("Makefile"), makefile).unwrap();
        let result = run_make(dir.to_string_lossy().into_owned()).unwrap();
        fs::remove_dir_all(&dir).unwrap();
        result
    }

    #[test]
    fn runs_a_configured_command() {
        let dir = std::env::temp_dir().to_string_lossy().into_owned();
        let (program, args): (&str, Vec<String>) = if cfg!(windows) {
            ("cmd", vec!["/C".into(), "echo".into(), "configured".into()])
        } else {
            ("sh", vec!["-c".into(), "echo configured".into()])
        };
        let result = run_command(dir, program.into(), args).unwrap();
        assert!(result.ok && result.output.contains("configured"));
        assert!(run_command(std::env::temp_dir().to_string_lossy().into_owned(), "no-such-program-tide".into(), vec![]).is_err());
    }

    #[test]
    fn reports_success_and_output() {
        let result = make_in("ok", "all:\n\t@echo built\n");
        assert!(result.ok);
        assert!(result.output.contains("built"));
    }

    #[test]
    fn reports_failure_and_stderr() {
        let result = make_in("bad", "all:\n\t@exit 3\n");
        assert!(!result.ok);
        assert!(!result.output.is_empty());
    }
}