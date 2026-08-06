"use client";

import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";
import { Edit3, Building2, FileText, Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { ArticleItem } from "../core/types";

interface ContractEditorProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  companyRepresentative: string;
  setCompanyRepresentative: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  employeeBirth: string;
  setEmployeeBirth: (v: string) => void;
  employeeNationality: string;
  setEmployeeNationality: (v: string) => void;
  employeeCni: string;
  setEmployeeCni: (v: string) => void;
  articles: ArticleItem[];
  handleAddArticle: () => void;
  handleUpdateArticle: (id: string, field: "title" | "content", val: string) => void;
  handleDeleteArticle: (id: string) => void;
  handleMoveArticle: (index: number, direction: "up" | "down") => void;
}

export function ContractEditor({
  companyName, setCompanyName,
  companyAddress, setCompanyAddress,
  companyRepresentative, setCompanyRepresentative,
  name, setName,
  employeeBirth, setEmployeeBirth,
  employeeNationality, setEmployeeNationality,
  employeeCni, setEmployeeCni,
  articles,
  handleAddArticle,
  handleUpdateArticle,
  handleDeleteArticle,
  handleMoveArticle,
}: ContractEditorProps) {
  return (
    <div className="space-y-4 p-1">
      <div className="p-3 bg-[var(--neu-surface-light)] rounded-lg text-xs text-[var(--neu-text-secondary)] border border-[var(--neu-border)] flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
        Toutes les phrases sont pré-remplies dynamiquement. Vous pouvez tout modifier, ajouter ou supprimer avant d&apos;imprimer.
      </div>

      {/* ENTÊTE SOCIÉTÉ & SALARIÉ */}
      <div className="space-y-3 bg-[var(--neu-surface-light)] p-3.5 rounded-2xl border border-[var(--neu-border)] text-xs">
        <div className="font-bold text-[var(--neu-text)] flex items-center gap-2 text-xs text-[var(--neu-accent)]">
          <Building2 size={15} /> Entête du Contrat & Informations Juridiques
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NeuInput label="Raison Sociale Employeur" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <NeuInput label="Adresse / Siège Social" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
          <NeuInput label="Représenté Par" value={companyRepresentative} onChange={(e) => setCompanyRepresentative(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <NeuInput label="Nom & Prénoms Salarié" value={name} onChange={(e) => setName(e.target.value)} />
          <NeuInput label="Né(e) le / à" value={employeeBirth} onChange={(e) => setEmployeeBirth(e.target.value)} />
          <NeuInput label="Nationalité" value={employeeNationality} onChange={(e) => setEmployeeNationality(e.target.value)} />
          <NeuInput label="N° CNI / Passeport" value={employeeCni} onChange={(e) => setEmployeeCni(e.target.value)} />
        </div>
      </div>

      {/* LISTE DYNAMIQUE DES ARTICLES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[var(--neu-text)] flex items-center gap-2">
            <FileText size={15} className="text-[#72e128]" />
            Articles du Contrat de Travail ({articles.length} articles)
          </span>
          <NeuButton variant="default" size="sm" onClick={handleAddArticle}>
            <Plus size={14} /> Ajouter un Article
          </NeuButton>
        </div>

        {articles.map((art, index) => (
          <div
            key={art.id}
            className="p-3 bg-[var(--neu-surface-light)] rounded-xl border border-[var(--neu-border)] space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={art.title}
                onChange={(e) => handleUpdateArticle(art.id, "title", e.target.value)}
                className="font-bold text-xs bg-transparent text-[var(--neu-text)] border-b border-[var(--neu-border)] focus:border-[var(--neu-accent)] outline-none px-1 py-0.5 w-44"
                placeholder="Ex: Article 1er"
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveArticle(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] disabled:opacity-20"
                  title="Monter"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveArticle(index, "down")}
                  disabled={index === articles.length - 1}
                  className="p-1 text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] disabled:opacity-20"
                  title="Descendre"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteArticle(art.id)}
                  className="p-1 text-[#ff4d49] hover:bg-[#ff4d49]/10 rounded transition ml-2"
                  title="Supprimer cet article"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={art.content}
              onChange={(e) => handleUpdateArticle(art.id, "content", e.target.value)}
              rows={3}
              className="w-full p-2 rounded-lg bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)] leading-relaxed resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
