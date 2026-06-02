import React from "react";
import { CheckCircle, Copy, Download, FileAudio } from "lucide-react";
import { motion } from "framer-motion";

interface TranscriptionResultProps {
  filename: string;
  text: string;
  duration?: number;
  language?: string;
}

export const TranscriptionResult: React.FC<TranscriptionResultProps> = ({
  filename,
  text,
  duration,
  language,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}_transcription.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-card p-6 flex flex-col mt-4"
    >
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold truncate max-w-[200px] sm:max-w-xs">{filename}</h4>
            <p className="text-xs text-white/50">
              {language && <span className="uppercase mr-2">{language}</span>}
              {duration && <span>{Math.round(duration)}s audio</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-2"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="text-sm hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white flex items-center gap-2"
            title="Download TXT"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">TXT</span>
          </button>
        </div>
      </div>
      
      <div className="bg-black/20 p-4 rounded-xl max-h-96 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/80">
        {text || <span className="text-white/30 italic">No speech detected.</span>}
      </div>
    </motion.div>
  );
};
