"use client";

import React, { useRef, useState, useEffect } from "react";
import { Eraser, Check, ShieldCheck, PenTool } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";

export interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
}

export function SignatureCanvas({ onSave, onClear }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a"; // Encre bleu nuit/noire
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onClear) onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3 bg-[var(--neu-surface)] p-4 rounded-2xl border border-[var(--neu-border)] shadow-md">
      <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-2">
        <div className="flex items-center gap-2">
          <PenTool size={16} className="text-[var(--neu-accent)]" />
          <span className="text-xs font-bold text-[var(--neu-text)]">Signature Électronique Interactive</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
          <ShieldCheck size={14} />
          <span>Horodatage & SHA-256</span>
        </div>
      </div>

      <div className="relative flex justify-center bg-white rounded-xl overflow-hidden border border-slate-300 shadow-inner">
        <canvas
          ref={canvasRef}
          width={450}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
            Signez ici (Souris ou Écran Tactile)
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <NeuButton onClick={handleClear} size="sm" variant="ghost" type="button">
          <Eraser size={14} />
          <span>Effacer</span>
        </NeuButton>

        <NeuButton onClick={handleSave} size="sm" variant="accent" type="button" disabled={!hasSignature}>
          <Check size={14} />
          <span>Apposer la Signature</span>
        </NeuButton>
      </div>
    </div>
  );
}
