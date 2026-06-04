import os
from pathlib import Path
from pydub import AudioSegment
from groq import Groq
from dotenv import load_dotenv
from services.storage_service import storage_service

# Load environment variables
load_dotenv()

# Di Docker/Linux, pydub akan otomatis menemukan ffmpeg yang kita instal lewat Dockerfile.
# Jadi kita tidak perlu lagi kode tambahan untuk mencari path.

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
                raise ValueError("GROQ_API_KEY belum diisi di Settings/Secret")

            storage_service.update_task(task_id, "processing")

            # Load audio file
            audio = AudioSegment.from_file(input_path)

            # Chunking 10 menit agar tidak melebihi limit Groq (25MB)
            chunk_length_ms = 10 * 60 * 1000
            chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]

            full_text = ""
            segments_list = []
            temp_dir = Path("storage/processed/temp_chunks")
            temp_dir.mkdir(parents=True, exist_ok=True)

            current_time_offset = 0.0
            last_language = "id"

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

                if chunk_file.exists():
                    chunk_file.unlink()

            result_data = {
                "text": full_text.strip(),
                "segments": segments_list,
                "duration": len(audio) / 1000.0,
                "language": last_language
            }

            storage_service.update_task(task_id, "completed", {"result": result_data})

        except Exception as e:
            print(f"Transcription error: {e}")
            storage_service.update_task(task_id, "failed", {"error": str(e)})

transcription_service = TranscriptionService()