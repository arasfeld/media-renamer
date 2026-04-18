// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use reqwest;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaMatch {
    #[serde(rename = "tmdbId")]
    tmdb_id: u32,
    title: String,
    year: Option<u32>,
    #[serde(rename = "type")]
    media_type: String,
    #[serde(rename = "posterPath")]
    poster_path: Option<String>,
    #[serde(rename = "seasonNumber")]
    season_number: Option<u32>,
    #[serde(rename = "episodeNumber")]
    episode_number: Option<u32>,
    #[serde(rename = "episodeTitle")]
    episode_title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchParams {
    query: String,
    year: Option<u32>,
    media_type: String,
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

#[tauri::command]
async fn search_media(params: SearchParams) -> Result<Vec<MediaMatch>, String> {
    let api_key = env::var("TMDB_API_KEY").map_err(|_| "TMDB_API_KEY not set")?;
    let base_url = "https://api.themoviedb.org/3";
    let endpoint = if params.media_type == "movie" { "/search/movie" } else { "/search/tv" };
    
    let client = reqwest::Client::new();
    let mut query = vec![("api_key", api_key), ("query", params.query), ("language", "en-US".to_string())];
    
    if let Some(year) = params.year {
        let year_param = if params.media_type == "movie" { "primary_release_year" } else { "first_air_date_year" };
        query.push((year_param, year.to_string()));
    }

    let response = client
        .get(format!("{}{}", base_url, endpoint))
        .query(&query)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;

    let results = response["results"].as_array().unwrap_or(&vec![]).iter().map(|r| {
        MediaMatch {
            tmdb_id: r["id"].as_u64().unwrap_or(0) as u32,
            title: r[if params.media_type == "movie" { "title" } else { "name" }].as_str().unwrap_or("").to_string(),
            year: None, 
            media_type: params.media_type.clone(),
            poster_path: r["poster_path"].as_str().map(|s| format!("https://image.tmdb.org/t/p/w92{}", s)),
            season_number: None,
            episode_number: None,
            episode_title: None,
        }
    }).collect();

    Ok(results)
}

#[tauri::command]
async fn get_episode_details(tv_id: u32, season_number: u32, episode_number: u32) -> Result<serde_json::Value, String> {
    let api_key = env::var("TMDB_API_KEY").map_err(|_| "TMDB_API_KEY not set")?;
    let url = format!("https://api.themoviedb.org/3/tv/{}/season/{}/episode/{}?api_key={}&language=en-US", tv_id, season_number, episode_number, api_key);
    
    let response = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;
        
    Ok(response)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![scan_folder, rename_files, search_media, get_episode_details])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
