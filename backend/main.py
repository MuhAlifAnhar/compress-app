from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import uuid
from services.compress_service import compress_service
from services.storage_service import storage_service
from services.transcription_service import transcription_service

app = FastAPI(title="FileCompress & Convert API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe/audio")
async def transcribe_audio_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    content = await file.read()
    input_path = storage_service.save_upload(content, file.filename)
    
    task_id = str(uuid.uuid4())
    storage_service.create_task(task_id, status="processing", data={"filename": file.filename})
    
    # Run the transcription as a background task
    background_tasks.add_task(transcription_service.process_audio, task_id, input_path)
    
    # Schedule cleanup
    background_tasks.add_task(storage_service.cleanup_old_files)
    
    return {
        "status": "success",
        "task_id": task_id,
        "message": "Transcription started in background"
    }

@app.get("/transcribe/status/{task_id}")
async def transcription_status(task_id: str):
    task = storage_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return task

@app.post("/compress/image")
async def compress_image_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: int = Form(80)
):
    # Save upload
    content = await file.read()
    input_path = storage_service.save_upload(content, file.filename)
    output_path = storage_service.get_processed_path(file.filename)
    
    try:
        result = compress_service.compress_image(input_path, output_path, quality)
        
        # Schedule cleanup
        background_tasks.add_task(storage_service.cleanup_old_files)
        
        return {
            "status": "success",
            "filename": file.filename,
            "download_url": f"/download/{os.path.basename(output_path)}",
            "metrics": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compress/pdf")
async def compress_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    power: str = Form("recommended")
):
    # Save upload
    content = await file.read()
    input_path = storage_service.save_upload(content, file.filename)
    output_path = storage_service.get_processed_path(file.filename)
    
    try:
        result = compress_service.compress_pdf(input_path, output_path, power)
        
        # Schedule cleanup
        background_tasks.add_task(storage_service.cleanup_old_files)
        
        return {
            "status": "success",
            "filename": file.filename,
            "download_url": f"/download/{os.path.basename(output_path)}",
            "metrics": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join("storage/processed", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or expired")
    
    return FileResponse(
        path=file_path,
        filename=filename.split("_", 1)[-1],  # Remove UUID prefix for user
        media_type='application/octet-stream'
    )

if __name__ == "__main__":

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
