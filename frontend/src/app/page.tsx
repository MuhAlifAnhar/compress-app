"use client";

import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Image as ImageIcon, FileText, Download, Loader2, CheckCircle } from "lucide-react";

interface ProcessResult {
  filename: string;
  download_url: string;
  metrics: {
    original_size: number;
    compressed_size: number;
    psnr?: number;
  };
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (files.length === 0) return;
    
    setProcessing(true);
    setError(null);
    setResults([]);
    
    try {
      const newResults: ProcessResult[] = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        // let endpoint = "";
        // if (file.type.includes("image") || file.name.match(/\.(jpg|jpeg|png)$/i)) {
        //   endpoint = "http://localhost:8000/compress/image";
        //   formData.append("quality", "70");
        // } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        //   endpoint = "http://localhost:8000/compress/pdf";
        //   formData.append("power", "recommended");
        // } else {
        //   continue; // Skip unsupported for now
        // }

        let endpoint = "";
        // Ambil alamat dari environment variable Vercel, jika tidak ada pakai cadangan Hugging Face
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://muhalifanhar-backend-kompres.hf.space";

        if (file.type.includes("image") || file.name.match(/\.(jpg|jpeg|png)$/i)) {
          endpoint = `${baseUrl}/compress/image`;
          formData.append("quality", "70");
        } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          endpoint = `${baseUrl}/compress/pdf`;
          formData.append("power", "recommended");
        } else {
          continue; // Skip unsupported for now
        }
        
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) throw new Error(`Failed to process ${file.name}`);
        
        const data = await response.json();
        newResults.push(data);
      }
      
      setResults(newResults);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
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
          <span>Powered by Advanced Compression Algorithms</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6"
        >
          File<span className="gradient-text">Compress</span> & Convert
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-white/60 max-w-2xl mx-auto"
        >
          Reduce file size by up to 80% without losing quality.
          Secure, fast, and completely private.
        </motion.p>
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
                : "bg-blue-600 hover:bg-blue-50 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] text-white"
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              "Compress Now"
            )}
          </button>
        </div>

        {/* Results Section */}
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
                      // href={`http://localhost:8000${res.download_url}`}
                      // href={`${process.env.NEXT_PUBLIC_API_URL}${res.download_url}`}
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

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
            <Shield className="w-5 h-5" />
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
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Privacy First</h3>
          <p className="text-white/50">
            Files are automatically deleted from our servers after 1 hour.
          </p>
        </div>
        <div className="glass-card p-8">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 text-green-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-4">Batch Processing</h3>
          <p className="text-white/50">
            Process up to 10 files simultaneously for maximum efficiency.
          </p>
        </div>
      </div>
    </main>
  );
}
