use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

mod calc;
mod emulator;
mod git;
mod project;

const EXTENSION: &str = ".tide.txt";

/// TI-OS program names: 1–8 chars, A–Z/0–9, first char a letter.
fn valid_name(name: &str) -> Result<String, String> {
    let name = name.to_ascii_uppercase();
    let ok = (1..=8).contains(&name.len())
        && name.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
        && name.chars().next().is_some_and(|c| c.is_ascii_uppercase());
    if ok { Ok(name) } else { Err(format!("\"{name}\" is not a valid program name")) }
}

fn programs_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("programs");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// The folder extensions are installed in, created if needed.
#[tauri::command]
fn extensions_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("extensions");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().into_owned())
}

/// Opens a folder in the system's file manager: the extensions folder, or one inside it.
#[tauri::command]
fn reveal_extension(app: tauri::AppHandle, path: Option<String>) -> Result<(), String> {
    let root = PathBuf::from(extensions_dir(app)?);
    let dir = match path {
        Some(p) => {
            let p = PathBuf::from(p);
            if !p.starts_with(&root) { return Err("That isn't in the extensions folder.".into()); }
            p
        }
        None => root,
    };
    #[cfg(target_os = "windows")]
    let program = "explorer";
    #[cfg(target_os = "macos")]
    let program = "open";
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let program = "xdg-open";
    std::process::Command::new(program).arg(&dir).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// .TIdeex files TIde was opened with (double-clicked, or Open with), until the page takes them.
struct OpenedFiles(Mutex<Vec<String>>);

fn tideex_paths(args: impl Iterator<Item = String>) -> Vec<String> {
    args.filter(|a| a.to_lowercase().ends_with(".tideex")).collect()
}

/// The .TIdeex files TIde was opened with since the page last asked.
#[tauri::command]
fn take_opened_files(state: tauri::State<OpenedFiles>) -> Vec<String> {
    std::mem::take(&mut *state.0.lock().unwrap())
}

fn program_path(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    Ok(programs_dir(app)?.join(format!("{}{EXTENSION}", valid_name(name)?)))
}

#[tauri::command]
fn save_program(app: tauri::AppHandle, name: String, source: String) -> Result<(), String> {
    fs::write(program_path(&app, &name)?, source).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_program(app: tauri::AppHandle, name: String) -> Result<String, String> {
    fs::read_to_string(program_path(&app, &name)?).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_program(app: tauri::AppHandle, name: String) -> Result<(), String> {
    fs::remove_file(program_path(&app, &name)?).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_programs(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut names: Vec<String> = fs::read_dir(programs_dir(&app)?)
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .filter_map(|entry| entry.file_name().to_str()?.strip_suffix(EXTENSION).map(str::to_owned))
        .collect();
    names.sort();
    Ok(names)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Windows and Linux pass a double-clicked file on the command line; macOS sends RunEvent::Opened.
        .manage(OpenedFiles(Mutex::new(tideex_paths(std::env::args().skip(1)))))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            save_program,
            load_program,
            delete_program,
            list_programs,
            project::list_dir,
            project::read_text_file,
            project::write_text_file,
            project::write_binary_file,
            project::run_make,
            project::read_binary_file,
            project::run_command,
            project::create_dir,
            project::delete_path,
            git::git_status,
            git::git_stage,
            git::git_unstage,
            git::git_commit,
            git::git_push,
            git::git_pull,
            git::git_init,
            emulator::emulator_status,
            emulator::emulator_install,
            emulator::emulator_stage,
            emulator::emulator_run,
            calc::calc_files,
            calc::calc_set_rom,
            calc::calc_remove_rom,
            calc::calc_read,
            calc::calc_read_program,
            calc::find_clibs,
            extensions_dir,
            reveal_extension,
            take_opened_files
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            if let tauri::RunEvent::Opened { urls } = &_event {
                use tauri::Emitter;
                let files = tideex_paths(urls.iter().filter_map(|u| u.to_file_path().ok()).map(|p| p.to_string_lossy().into_owned()));
                if !files.is_empty() {
                    _app.state::<OpenedFiles>().0.lock().unwrap().extend(files);
                    let _ = _app.emit("tide://opened-files", ());
                }
            }
        });
}