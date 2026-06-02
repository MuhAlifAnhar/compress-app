import os
import time
import shutil
from pathlib import Path
from pydub import AudioSegment
from groq import Groq
from dotenv import load_dotenv
from services.storage_service import storage_service

# Load environment variables
load_dotenv()

# --- FFmpeg Auto-Detection for Windows ---
def _find_ffmpeg():
    """Try to find ffmpeg executable, checking common Windows paths."""
    # 1. Check if user specified a path in .env
    env_path = os.getenv("FFMPEG_PATH")
    if env_path and os.path.isfile(env_path):
        return env_path

    # 2. Check if ffmpeg is already on the system PATH
    ffmpeg_on_path = shutil.which("ffmpeg")
    if ffmpeg_on_path:
        return ffmpeg_on_path

    # 3. Check common Windows install locations
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\ffmpeg\bin\ffmpeg.exe"),
        os.path.expandvars(r"%USERPROFILE%\ffmpeg\bin\ffmpeg.exe"),
        os.path.expandvars(r"%USERPROFILE%\Downloads\ffmpeg\bin\ffmpeg.exe"),
    ]
    for p in common_paths:
        if os.path.isfile(p):
            return p

    return None

_ffmpeg_path = _find_ffmpeg()
if _ffmpeg_path:
    # Tell pydub exactly where ffmpeg lives
    AudioSegment.converter = _ffmpeg_path
    # Also set ffprobe if it's in the same directory
    ffprobe_path = os.path.join(os.path.dirname(_ffmpeg_path), "ffprobe.exe")
    if os.path.isfile(ffprobe_path):
        AudioSegment.ffprobe = ffprobe_path
    print(f"[transcription_service] ffmpeg found at: {_ffmpeg_path}")
else:
    print("[transcription_service] WARNING: ffmpeg not found! Audio chunking may fail.")
    print("[transcription_service] TIP: Set FFMPEG_PATH=C:\\path\\to\\ffmpeg.exe in your .env file")


class TranscriptionService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    def process_audio(self, task_id: str, input_path: str):
        try:
            if not self.client:
                raise ValueError("GROQ_API_KEY is not set in the .env file")

            storage_service.update_task(task_id, "processing")

            # Load the audio file
            audio = AudioSegment.from_file(input_path)

            # Groq API has a 25MB limit. A 10-minute MP3 is generally well under 10MB.
            # We chunk the audio into 10-minute segments.
            chunk_length_ms = 10 * 60 * 1000
            chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]

            full_text = ""
            segments_list = []

            temp_dir = Path("storage/processed/temp_chunks")
            temp_dir.mkdir(parents=True, exist_ok=True)

            current_time_offset = 0.0
            last_language = "unknown"

            for idx, chunk in enumerate(chunks):
                chunk_file = temp_dir / f"{task_id}_chunk_{idx}.mp3"
                chunk.export(str(chunk_file), format="mp3")

                with open(chunk_file, "rb") as file:
                    transcription = self.client.audio.transcriptions.create(
                        file=(chunk_file.name, file.read()),
                        model="whisper-large-v3",
                        response_format="verbose_json"
                    )

                full_text += transcription.text + " "

                if hasattr(transcription, 'language'):
                    last_language = transcription.language

                # If segments exist, adjust their timestamps by the offset
                if hasattr(transcription, 'segments') and transcription.segments:
                    for seg in transcription.segments:
                        start = seg.get('start', 0) if isinstance(seg, dict) else getattr(seg, 'start', 0)
                        end = seg.get('end', 0) if isinstance(seg, dict) else getattr(seg, 'end', 0)
                        text = seg.get('text', '') if isinstance(seg, dict) else getattr(seg, 'text', '')

                        segments_list.append({
                            "start": start + current_time_offset,
                            "end": end + current_time_offset,
                            "text": text.strip()
                        })

                current_time_offset += len(chunk) / 1000.0

                # Clean up chunk file immediately to save space
                try:
                    if chunk_file.exists():
                        chunk_file.unlink()
                except Exception as e:
                    print(f"Error deleting temp chunk: {e}")

            full_text = full_text.strip()

            result_data = {
                "text": full_text,
                "segments": segments_list,
                "duration": len(audio) / 1000.0,
                "language": last_language
            }

            storage_service.update_task(task_id, "completed", {"result": result_data})

        except Exception as e:
            print(f"Transcription error: {e}")
            storage_service.update_task(task_id, "failed", {"error": str(e)})

transcription_service = TranscriptionService()
