"use client";

import { useFormStatus } from "react-dom";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function SavingOverlay({ message = "Saving changes..." }: { message?: string }) {
  const { pending } = useFormStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pending || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-ocragray-900/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="p-10 flex flex-col items-center justify-center gap-6 w-full mx-4">
        <div className="relative">
          {/* Inner glowing neon circle */}
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-red-500/20 rounded-full blur-xl animate-pulse" />
          
          <Loader2 className="h-12 w-12 text-blue-500 dark:text-red-500 animate-spin relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        </div>
        
        <div className="text-center space-y-1">
          <p className="font-star text-2xl text-white tracking-wide">{message}</p>
          <p className="text-[9px] uppercase tracking-widest text-white font-black animate-pulse">Please wait, do not close this window</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
