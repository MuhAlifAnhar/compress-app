# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Install ffmpeg langsung ke sistem Linux
RUN apt-get update && apt-get install -y ffmpeg

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# Ghostscript is required for PDF compression
RUN apt-get update && apt-get install -y --no-install-recommends \
    ghostscript \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create storage directories and set permissions
RUN mkdir -p storage/uploads storage/processed && chmod -R 777 /app/storage

# Expose the port Hugging Face expects
EXPOSE 7860

# Command to run the application (Ganti port ke 7860)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]