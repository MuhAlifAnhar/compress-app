"use client";

import React, { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
      onFilesSelected(files.slice(0, 10));
    }
  }, [onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files].slice(0, 10));
      onFilesSelected(files.slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative glass-card p-12 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-500/10" : "border-white/20 hover:border-white/40"
        }`}
      >
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept=".pdf,.jpg,.jpeg,.png,.docx,.mp3,.wav,.m4a,.ogg"
        />
        
        <motion.div
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          className="p-4 rounded-full bg-blue-500/10 mb-4"
        >
          <Upload className="w-12 h-12 text-blue-400" />
        </motion.div>
        
        <h3 className="text-xl font-semibold mb-2">Drag & Drop Files</h3>
        <p className="text-white/50 text-center">
          Support PDF, JPG, PNG, DOCX, MP3, WAV, M4A, OGG (Max 10 files)

        </p>
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 space-y-3"
          >
            {selectedFiles.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                className="glass-card p-4 flex items-center justify-between"
                layout
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-white/5">
                    <File className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(idx)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
