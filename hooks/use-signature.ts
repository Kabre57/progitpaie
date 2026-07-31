"use client";

import { useState } from "react";

export function useSignature() {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const saveSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setSignedAt(new Date().toISOString());
  };

  const clearSignature = () => {
    setSignatureDataUrl(null);
    setSignedAt(null);
  };

  return {
    signatureDataUrl,
    signedAt,
    saveSignature,
    clearSignature,
  };
}
