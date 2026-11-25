// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn pick_folder(title: Option<String>, default_path: Option<String>) -> Option<String> {
    let mut dialog = rfd::AsyncFileDialog::new();
    if let Some(t) = title {
        if !t.trim().is_empty() {
            dialog = dialog.set_title(&t);
        }
    }
    if let Some(p) = default_path {
        let p_trimmed = p.trim();
        if !p_trimmed.is_empty() {
            let path = std::path::PathBuf::from(p_trimmed);
            if path.exists() {
                dialog = dialog.set_directory(&path);
            }
        }
    }
    let folder = dialog.pick_folder().await?;
    Some(folder.path().to_string_lossy().to_string())
}

#[tauri::command]
async fn pick_save_file(
    title: Option<String>,
    default_name: Option<String>,
    default_path: Option<String>,
    filter_name: Option<String>,
    filter_exts: Option<Vec<String>>,
) -> Option<String> {
    let mut dialog = rfd::AsyncFileDialog::new();
    if let Some(t) = title {
        if !t.trim().is_empty() {
            dialog = dialog.set_title(&t);
        }
    }
    if let Some(f) = default_name {
        if !f.trim().is_empty() {
            dialog = dialog.set_file_name(&f);
        }
    }
    if let Some(p) = default_path {
        let p_trimmed = p.trim();
        if !p_trimmed.is_empty() {
            let path = std::path::PathBuf::from(p_trimmed);
            if path.exists() {
                if path.is_dir() {
                    dialog = dialog.set_directory(&path);
                } else if let Some(parent) = path.parent() {
                    dialog = dialog.set_directory(parent);
                }
            }
        }
    }
    if let (Some(name), Some(exts)) = (filter_name, filter_exts) {
        let exts_ref: Vec<&str> = exts.iter().map(|s| s.as_str()).collect();
        dialog = dialog.add_filter(&name, &exts_ref);
    }
    let file = dialog.save_file().await?;
    Some(file.path().to_string_lossy().to_string())
}

#[tauri::command]
fn write_text_file(file_path: String, content: String) -> Result<String, String> {
    let path = std::path::PathBuf::from(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Gagal membuat folder direktori: {e}"))?;
        }
    }
    std::fs::write(&path, content.as_bytes()).map_err(|e| format!("Gagal menulis berkas: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn write_binary_file(file_path: String, bytes: Vec<u8>) -> Result<String, String> {
    let path = std::path::PathBuf::from(&file_path);
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Gagal membuat folder direktori: {e}"))?;
        }
    }
    std::fs::write(&path, &bytes).map_err(|e| format!("Gagal menulis berkas: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct DraftFileInfo {
    filename: String,
    full_path: String,
    modified_time: u64,
    size_bytes: u64,
    entity_type: String,
    entity_name: String,
    akta_nomor: String,
    akta_tanggal: String,
}

#[tauri::command]
fn get_downloads_dir() -> String {
    if let Ok(profile) = std::env::var("USERPROFILE") {
        let p = std::path::PathBuf::from(profile).join("Downloads");
        if p.exists() {
            return p.to_string_lossy().to_string();
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        let p = std::path::PathBuf::from(home).join("Downloads");
        if p.exists() {
            return p.to_string_lossy().to_string();
        }
    }
    "C:\\Downloads".to_string()
}

#[tauri::command]
fn save_text_file(folder_path: String, filename: String, content: String) -> Result<String, String> {
    let dir = std::path::PathBuf::from(&folder_path);
    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| format!("Gagal membuat direktori folder: {e}"))?;
    }
    let file_path = dir.join(&filename);
    std::fs::write(&file_path, content.as_bytes()).map_err(|e| format!("Gagal menulis berkas: {e}"))?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_binary_file(folder_path: String, filename: String, bytes: Vec<u8>) -> Result<String, String> {
    let dir = std::path::PathBuf::from(&folder_path);
    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| format!("Gagal membuat direktori folder: {e}"))?;
    }
    let file_path = dir.join(&filename);
    std::fs::write(&file_path, &bytes).map_err(|e| format!("Gagal menulis berkas Word: {e}"))?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn read_text_file(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path).map_err(|e| format!("Gagal membaca berkas: {e}"))
}

#[tauri::command]
async fn pick_open_file(
    default_dir: Option<String>,
    filter_name: String,
    extensions: Vec<String>,
) -> Result<Option<String>, String> {
    let mut dialog = rfd::AsyncFileDialog::new().set_title("Buka Berkas");
    if let Some(dir) = default_dir {
        if !dir.is_empty() {
            let p = std::path::PathBuf::from(&dir);
            if p.exists() {
                dialog = dialog.set_directory(p);
            }
        }
    }
    let exts_ref: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
    if !exts_ref.is_empty() {
        dialog = dialog.add_filter(&filter_name, &exts_ref);
    }
    let picked = dialog.pick_file().await;
    Ok(picked.map(|handle| handle.path().to_string_lossy().to_string()))
}

#[tauri::command]
fn open_folder(folder_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&folder_path);
    if !path.exists() {
        return Err(format!("Folder tidak ditemukan: {}", folder_path));
    }
    let target_dir = if path.is_dir() {
        path
    } else {
        path.parent()
            .map(|p| p.to_path_buf())
            .ok_or_else(|| "Folder induk tidak valid.".to_string())?
    };

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&target_dir)
            .spawn()
            .map_err(|e| format!("Gagal membuka Explorer: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&target_dir)
            .spawn()
            .map_err(|e| format!("Gagal membuka Finder: {e}"))?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&target_dir)
            .spawn()
            .map_err(|e| format!("Gagal membuka file manager: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&file_path);
    if path.exists() {
        std::fs::remove_file(path).map_err(|e| format!("Gagal menghapus berkas: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
fn list_draft_files(folder_path: String) -> Vec<DraftFileInfo> {
    let mut results = Vec::new();
    let dir = std::path::PathBuf::from(&folder_path);
    if !dir.exists() || !dir.is_dir() {
        return results;
    }

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let is_akta = path.extension()
                    .and_then(|s| s.to_str())
                    .map(|ext| ext.eq_ignore_ascii_case("akta") || ext.eq_ignore_ascii_case("json"))
                    .unwrap_or(false);

                if is_akta {
                    let filename = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                    let full_path = path.to_string_lossy().to_string();
                    let metadata = entry.metadata().ok();
                    let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                    let modified_time = metadata.and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    let mut entity_type = "PT".to_string();
                    let mut entity_name = "-".to_string();
                    let mut akta_nomor = "-".to_string();
                    let mut akta_tanggal = "-".to_string();

                    if let Ok(content) = std::fs::read_to_string(&path) {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(t) = val.get("badanUsaha").and_then(|b| b.get("tipe")).and_then(|s| s.as_str()) {
                                entity_type = t.to_uppercase();
                            }
                            if let Some(n) = val.get("akta").and_then(|a| a.get("nomor")).and_then(|s| s.as_str()) {
                                if !n.trim().is_empty() {
                                    akta_nomor = n.to_string();
                                }
                            }
                            if let Some(tg) = val.get("akta").and_then(|a| a.get("tanggal")).and_then(|s| s.as_str()) {
                                if !tg.trim().is_empty() {
                                    akta_tanggal = tg.to_string();
                                }
                            }

                            let name_opt = val.get("pt").and_then(|p| p.get("nama")).and_then(|s| s.as_str())
                                .or_else(|| val.get("cv").and_then(|p| p.get("nama")).and_then(|s| s.as_str()))
                                .or_else(|| val.get("firma").and_then(|p| p.get("nama")).and_then(|s| s.as_str()))
                                .or_else(|| val.get("ud").and_then(|p| p.get("nama")).and_then(|s| s.as_str()));
                            if let Some(nm) = name_opt {
                                if !nm.trim().is_empty() {
                                    entity_name = nm.to_string();
                                }
                            }
                        }
                    }

                    results.push(DraftFileInfo {
                        filename,
                        full_path,
                        modified_time,
                        size_bytes,
                        entity_type,
                        entity_name,
                        akta_nomor,
                        akta_tanggal,
                    });
                }
            }
        }
    }

    results.sort_by(|a, b| b.modified_time.cmp(&a.modified_time));
    results
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::panic::set_hook(Box::new(|info| {
        let msg = format!("PANIC OCCURRED:\n{info}\n");
        let _ = std::fs::write("crash_error.log", &msg);
    }));

    if let Err(err) = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            pick_folder,
            pick_open_file,
            pick_save_file,
            open_folder,
            write_text_file,
            write_binary_file,
            get_downloads_dir,
            save_text_file,
            save_binary_file,
            read_text_file,
            delete_file,
            list_draft_files
        ])
        .run(tauri::generate_context!())
    {
        let msg = format!("TAURI RUN ERROR:\n{err:?}\n");
        let _ = std::fs::write("crash_error.log", &msg);
    }
}

