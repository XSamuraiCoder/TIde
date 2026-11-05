use std::fs;
use std::path::PathBuf;
use tauri::Manager;

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
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_program,
            load_program,
            delete_program,
            list_programs,
            project::list_dir,
            project::read_text_file,
            project::write_text_file,
            project::write_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}