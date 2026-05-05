import os
import shutil
import uuid
import time
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("storage/uploads")
PROCESSED_DIR = Path("storage/processed")

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
    def cleanup_old_files(max_age_seconds: int = 3600):
        """Delete files older than max_age_seconds (default 1 hour)."""
        now = time.time()
        for directory in [UPLOAD_DIR, PROCESSED_DIR]:
            for file_path in directory.glob("*"):
                if file_path.is_file():
                    file_age = now - file_path.stat().st_mtime
                    if file_age > max_age_seconds:
                        try:
                            file_path.unlink()
                        except Exception as e:
                            print(f"Error deleting {file_path}: {e}")

storage_service = StorageService()
