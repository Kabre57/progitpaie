"use client";

interface AttestationPreviewProps {
  title: string;
  bodyText: string;
}

export function AttestationPreview({ title, bodyText }: AttestationPreviewProps) {
  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="h-[6px] bg-[#1e3a5f] rounded-t-sm" />
      <div className="px-6 pt-3 pb-1">
        <p className="text-[15px] font-bold text-[#1e3a5f] uppercase tracking-wide">
          LOGIPAIE RH 21 (SARL)
        </p>
        <p className="text-[8px] text-[#646464] mt-0.5">
          LOGIPAIE RH 21 • BP 5115 ABIDJAN 01 - ABIDJAN • Tél: 0709470671
        </p>
      </div>
      <div className="mx-6 border-t border-[#ccc]" />

      <div className="px-6 mt-8">
        <h2 className="text-center text-[16px] font-bold mb-8">{title}</h2>
        <div className="text-[10px] leading-[18px] whitespace-pre-line text-justify">{bodyText}</div>
      </div>

      <div className="px-6 mt-12 text-right">
        <p className="text-[9px]">Fait à ABIDJAN, le {new Date().toLocaleDateString("fr-FR")}</p>
        <p className="text-[9px] font-bold mt-3">LA DIRECTION GÉNÉRALE</p>
      </div>
    </div>
  );
}
