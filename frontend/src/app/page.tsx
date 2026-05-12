"use client";
import { useState } from "react";
import PdfUpload from "@/components/PdfUpload";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4">
      <header className="max-w-4xl mx-auto py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Myelin Engine</h1>
        {isPdfLoaded && (
          <button 
            onClick={() => setIsPdfLoaded(false)}
            className="text-sm text-zinc-500 hover:text-black dark:hover:text-white transition"
          >
            Upload New Document
          </button>
        )}
      </header>

      {!isPdfLoaded ? (
        <PdfUpload onUploadComplete={() => setIsPdfLoaded(true)} />
      ) : (
        <ChatInterface />
      )}
    </main>
  );
}