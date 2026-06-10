"use client";

import React, { useState, useCallback } from "react";
import { Upload, File as FileIcon, X, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  showReorder?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, showReorder = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const addFiles = (newFiles: File[]) => {
    setSelectedFiles(prev => {
      const next = [...prev, ...newFiles].slice(0, 10);
      // Immediately notify parent with exact state
      setTimeout(() => onFilesSelected(next), 0);
      return next;
    });
  };

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
      addFiles(files);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      setTimeout(() => onFilesSelected(next), 0);
      return next;
    });
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    setSelectedFiles(prev => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      setTimeout(() => onFilesSelected(next), 0);
      return next;
    });
  };

  const handleReorder = (newOrder: File[]) => {
    setSelectedFiles(newOrder);
    setTimeout(() => onFilesSelected(newOrder), 0);
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
          <Reorder.Group
            axis="y"
            values={selectedFiles}
            onReorder={handleReorder}
            className="mt-6 space-y-3"
          >
            {showReorder && selectedFiles.length > 1 && (
              <p className="text-xs text-white/40 text-center mb-2">
                Drag and drop files to reorder, or use the arrows
              </p>
            )}

            {selectedFiles.map((file, idx) => (
              <Reorder.Item
                key={`${file.name}-${file.size}-${idx}`}
                value={file}
                className="glass-card p-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-3">
                  {showReorder && (
                    <div className="flex items-center text-white/30 mr-1">
                      <GripVertical className="w-4 h-4 mr-1" />
                      <span className="font-mono text-sm w-4 text-center">
                        {idx + 1}
                      </span>
                    </div>
                  )}
                  <div className="p-2 rounded bg-white/5">
                    <FileIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {showReorder && selectedFiles.length > 1 && (
                    <>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => moveFile(idx, "up")}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-md transition-colors ${idx === 0 ? "text-white/10 cursor-not-allowed" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => moveFile(idx, "down")}
                        disabled={idx === selectedFiles.length - 1}
                        className={`p-1.5 rounded-md transition-colors ${idx === selectedFiles.length - 1 ? "text-white/10 cursor-not-allowed" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => removeFile(idx)}
                    className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-white/60 hover:text-red-400"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </AnimatePresence>
    </div>
  );
};
