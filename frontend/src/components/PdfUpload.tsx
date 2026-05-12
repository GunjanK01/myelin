"use client";
import { useState, useRef } from "react";
import { ArrowUp, UploadCloud, FileText } from "lucide-react";

export default function PdfUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);  //When sending files over HTTP, you cannot use standard JSON ({ file: file }). You must use FormData, which breaks the file down into a multipart/form-data stream that FastAPI's UploadFile can understand.

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) onUploadComplete();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-20">
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-12 flex flex-col items-center justify-center transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <UploadCloud className="w-12 h-12 text-zinc-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload a Document</h3>
        <p className="text-zinc-500 mb-6">Drag and drop your PDF here, or click to browse</p>
        
        <input 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-full font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
        >
          Browse Files
        </button>

        {file && (
          <div className="mt-8 flex items-center gap-4 bg-white dark:bg-zinc-950 p-3 pr-4 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
            
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className="ml-auto bg-black dark:bg-white text-white dark:text-black p-2 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}