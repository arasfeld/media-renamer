// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaFile {
    path: String,
    filename: String,
    extension: String,
    size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RenameOperation {
    from: String,
    to: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RenameResult {
    success: bool,
    error: Option<String>,
}

#[tauri::command]
async fn scan_folder(folder_path: String) -> Result<Vec<MediaFile>, String> {
    let video_extensions = ["mp4", "mkv", "avi", "mov", "wmv", "m4v"];
    let mut results = Vec::new();

    for entry in WalkDir::new(folder_path)
        .into_iter()
        .filter_entry(|e| !e.file_name().to_str().map(|s| s.starts_with('.')).unwrap_or(false))
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if video_extensions.contains(&ext.to_lowercase().as_str()) {
                    if let Ok(metadata) = fs::metadata(path) {
                        results.push(MediaFile {
                            path: path.to_string_lossy().to_string(),
                            filename: entry.file_name().to_string_lossy().to_string(),
                            extension: ext.to_string(),
                            size: metadata.len(),
                        });
                    }
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
async fn rename_files(renames: Vec<RenameOperation>) -> Result<RenameResult, String> {
    for op in renames {
        let from_path = Path::new(&op.from);
        let to_path = Path::new(&op.to);

        // Ensure parent directory exists
        if let Some(parent) = to_path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                return Ok(RenameResult {
                    success: false,
                    error: Some(format!("Failed to create directory: {}", e)),
                });
            }
        }

        if let Err(e) = fs::rename(from_path, to_path) {
            return Ok(RenameResult {
                success: false,
                error: Some(format!("Failed to rename {}: {}", op.from, e)),
            });
        }
    }

    Ok(RenameResult {
        success: true,
        error: None,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::init())
        .invoke_handler(tauri::generate_handler![scan_folder, rename_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
