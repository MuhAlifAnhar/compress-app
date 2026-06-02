import os
import shutil
import uuid
import time
import json
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("storage/uploads")
PROCESSED_DIR = Path("storage/processed")
TASKS_FILE = PROCESSED_DIR / "tasks.json"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

class StorageService:
    @staticmethod
    def save_upload(file_content: bytes, filename: str) -> str:
        unique_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{unique_id}_{filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        return str(file_path)

    @staticmethod
    def get_processed_path(filename: str) -> str:
        unique_id = str(uuid.uuid4())
        return str(PROCESSED_DIR / f"{unique_id}_{filename}")

    @staticmethod
    def _read_tasks():
        if not TASKS_FILE.exists():
            return {}
        try:
            with open(TASKS_FILE, "r") as f:
                return json.load(f)
        except:
            return {}

    @staticmethod
    def _write_tasks(tasks):
        with open(TASKS_FILE, "w") as f:
            json.dump(tasks, f)

    @staticmethod
    def create_task(task_id: str, status: str = "processing", data: dict = None):
        tasks = StorageService._read_tasks()
        tasks[task_id] = {
            "status": status,
            "data": data or {},
            "timestamp": time.time()
        }
        StorageService._write_tasks(tasks)

    @staticmethod
    def update_task(task_id: str, status: str, data: dict = None):
        tasks = StorageService._read_tasks()
        if task_id in tasks:
            tasks[task_id]["status"] = status
            if data:
                tasks[task_id]["data"].update(data)
            StorageService._write_tasks(tasks)

    @staticmethod
    def get_task(task_id: str) -> Optional[dict]:
        tasks = StorageService._read_tasks()
        return tasks.get(task_id)

    @staticmethod
    def cleanup_old_files(max_age_seconds: int = 3600):
        """Delete files older than max_age_seconds (default 1 hour)."""
        now = time.time()
        for directory in [UPLOAD_DIR, PROCESSED_DIR]:
            for file_path in directory.glob("*"):
                if file_path.is_file() and file_path.name != "tasks.json":
                    file_age = now - file_path.stat().st_mtime
                    if file_age > max_age_seconds:
                        try:
                            file_path.unlink()
                        except Exception as e:
                            print(f"Error deleting {file_path}: {e}")
                            
        # Cleanup old tasks
        tasks = StorageService._read_tasks()
        cleaned_tasks = {
            k: v for k, v in tasks.items()
            if now - v.get("timestamp", 0) <= max_age_seconds
        }
        if len(tasks) != len(cleaned_tasks):
            StorageService._write_tasks(cleaned_tasks)

storage_service = StorageService()
