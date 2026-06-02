"use client";

import { useState, useEffect } from "react";
import { Dropzone } from "@/components/Dropzone";
import { TranscriptionResult } from "@/components/TranscriptionResult";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Image as ImageIcon, FileText, Download, Loader2, CheckCircle, AudioLines } from "lucide-react";

interface ProcessResult {
  filename: string;
  download_url: string;
  metrics: {
    original_size: number;
    compressed_size: number;
    psnr?: number;
  };
}

interface TranscriptionTask {
  task_id: string;
  filename: string;
  status: "processing" | "completed" | "failed";
  data?: any;
  result?: {
    text: string;
    duration: number;
    language: string;
  };
  error?: string;
}

export default function Home() {
  const [mode, setMode] = useState<"compress" | "transcribe">("compress");
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [transcriptionTasks, setTranscriptionTasks] = useState<TranscriptionTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Polling for transcription tasks
  useEffect(() => {
    const activeTasks = transcriptionTasks.filter(t => t.status === "processing");
    if (activeTasks.length === 0) return;

    const intervalId = setInterval(async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://muhalifanhar-backend-kompres.hf.space";
      
      const updatedTasks = await Promise.all(
        transcriptionTasks.map(async (task) => {
          if (task.status !== "processing") return task;
          
          try {
            const res = await fetch(`${baseUrl}/transcribe/status/${task.task_id}`);
            if (res.ok) {
              const data = await res.json();
              return { ...task, status: data.status, result: data.data?.result, error: data.data?.error };
            }
          } catch (e) {
            console.error("Polling error", e);
          }
          return task;
        })
      );
      
      setTranscriptionTasks(updatedTasks);
      
      // Stop processing if all tasks are done
      if (!updatedTasks.some(t => t.status === "processing")) {
        setProcessing(false);
      }
      
    }, 3000);

    return () => clearInterval(intervalId);
  }, [transcriptionTasks]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    setError(null);
    
    if (mode === "compress") {
      setResults([]);
    } else {
      setTranscriptionTasks([]);
    }
    
    try {
      const newResults: ProcessResult[] = [];
      const newTasks: TranscriptionTask[] = [];
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://muhalifanhar-backend-kompres.hf.space";
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        let endpoint = "";
        
        if (mode === "transcribe") {
          if (!file.type.includes("audio") && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
             continue; // Skip non-audio files
          }
          endpoint = `${baseUrl}/transcribe/audio`;
        } else {
          if (file.type.includes("image") || file.name.match(/\.(jpg|jpeg|png)$/i)) {
            endpoint = `${baseUrl}/compress/image`;
            formData.append("quality", "70");
          } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            endpoint = `${baseUrl}/compress/pdf`;
            formData.append("power", "recommended");
          } else {
            continue; // Skip unsupported for now
          }
        }
        
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error(`Failed to process ${file.name}`);
        
        const data = await response.json();
        
        if (mode === "transcribe") {
           newTasks.push({
              task_id: data.task_id,
              filename: file.name,
              status: "processing"
           });
        } else {
           newResults.push(data);
        }
      }
      
      if (mode === "compress") {
        setResults(newResults);
        setProcessing(false);
      } else {
        setTranscriptionTasks(newTasks);
        if (newTasks.length === 0) {
           setProcessing(false);
           setError("No supported audio files selected for transcription.");
        }
      }
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setProcessing(false);
    }
  };

  return (
    <main className="px-6 py-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
        >
          <Zap className="w-4 h-4" />
          <span>Powered by Advanced Algorithms</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          File<span className="gradient-text">Studio</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/60 max-w-2xl mx-auto"
        >
          Compress your files without losing quality, or transcribe audio into text in minutes. Secure, fast, and completely private.
        </motion.p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-8">
         <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
               onClick={() => setMode("compress")}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${mode === "compress" ? "bg-blue-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}
            >
               <ImageIcon className="w-4 h-4" /> Compress
            </button>
            <button
               onClick={() => setMode("transcribe")}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${mode === "transcribe" ? "bg-purple-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}
            >
               <AudioLines className="w-4 h-4" /> Transcribe
            </button>
         </div>
      </div>

      {/* Main Action Area */}
      <div className="space-y-12">
        <Dropzone onFilesSelected={(newFiles) => setFiles(newFiles)} />
        
        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={files.length === 0 || processing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 ${
              files.length === 0 || processing
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : mode === "compress"
                ? "bg-blue-600 hover:bg-blue-50 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] text-white"
                : "bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] text-white"
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              mode === "compress" ? "Compress Now" : "Start Transcription"
            )}
          </button>
        </div>

        {/* Results Section */}
        {mode === "compress" ? (
           <AnimatePresence>
             {results.length > 0 && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
               >
                 {results.map((res, i) => {
                   const ratio = ((1 - res.metrics.compressed_size / res.metrics.original_size) * 100).toFixed(0);
                   return (
                     <motion.div
                       key={i}
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ delay: i * 0.1 }}
                       className="glass-card p-6 flex flex-col justify-between"
                     >
                       <div>
                         <div className="flex items-center justify-between mb-4">
                           <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                             <CheckCircle className="w-5 h-5" />
                           </div>
                           <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-full">
                             {ratio}% Saved
                           </span>
                         </div>
                         <h4 className="font-semibold truncate mb-1">{res.filename}</h4>
                         <p className="text-xs text-white/40 mb-4">
                           {(res.metrics.original_size / 1024 / 1024).toFixed(2)} MB → 
                           {(res.metrics.compressed_size / 1024 / 1024).toFixed(2)} MB
                         </p>
                         {res.metrics.psnr && (
                           <div className="mb-4 text-xs">
                             <span className="text-white/40">Visual Quality: </span>
                             <span className="text-blue-400 font-medium">{res.metrics.psnr} dB</span>
                           </div>
                         )}
                       </div>
                       
                       <a
                         href={`${process.env.NEXT_PUBLIC_API_URL || "https://muhalifanhar-backend-kompres.hf.space"}${res.download_url}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10"
                       >
                         <Download className="w-4 h-4" />
                         Download
                       </a>
                     </motion.div>
                   );
                 })}
               </motion.div>
             )}
           </AnimatePresence>
        ) : (
           <AnimatePresence>
             {transcriptionTasks.length > 0 && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col gap-6 max-w-4xl mx-auto w-full"
               >
                 {transcriptionTasks.map((task, i) => (
                    task.status === "processing" ? (
                       <motion.div key={task.task_id} className="glass-card p-6 flex items-center gap-4">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                          <div>
                             <p className="font-medium">Transcribing {task.filename}...</p>
                             <p className="text-xs text-white/50">This may take a few minutes depending on the audio length.</p>
                          </div>
                       </motion.div>
                    ) : task.status === "completed" && task.result ? (
                       <TranscriptionResult
                          key={task.task_id}
                          filename={task.filename}
                          text={task.result.text}
                          duration={task.result.duration}
                          language={task.result.language}
                       />
                    ) : (
                       <motion.div key={task.task_id} className="glass-card p-6 bg-red-500/10 border-red-500/20">
                          <p className="text-red-400 font-medium">Failed to transcribe {task.filename}</p>
                          <p className="text-xs text-red-400/70">{task.error || "Unknown error"}</p>
                       </motion.div>
                    )
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 max-w-2xl mx-auto mt-4">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Smart Compression</h3>
          <p className="text-white/50">
            Advanced algorithms that preserve detail while minimizing file size.
          </p>
        </div>
        <div className="glass-card p-8">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-400">
            <AudioLines className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">AI Transcription</h3>
          <p className="text-white/50">
            Accurate speech-to-text conversion supporting long audio files and multiple languages.
          </p>
        </div>
        <div className="glass-card p-8">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 text-green-400">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Privacy First</h3>
          <p className="text-white/50">
            Files are automatically deleted from our servers after 1 hour.
          </p>
        </div>
      </div>
    </main>
  );
}
