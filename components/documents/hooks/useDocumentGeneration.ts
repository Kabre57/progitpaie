"use client";

import { useState } from "react";
import type { ArticleItem, DocumentPreviewModalProps } from "../core/types";
import { downloadDocumentPDF } from "../utils/pdfGenerator";

export interface DocumentEditorState {
  name?: string;
  jobTitle?: string;
  department?: string;
  salary?: number;
  sursalaire?: number;
  bodyText?: string;
  leaveStart?: string;
  leaveEnd?: string;
  leaveReturn?: string;
  companyName?: string;
  companyAddress?: string;
  companyRepresentative?: string;
  employeeBirth?: string;
  employeeCni?: string;
  employeeNationality?: string;
  employeeAddress?: string;
  articles: ArticleItem[];
}

export function useDocumentGeneration(props: DocumentPreviewModalProps, editorState: DocumentEditorState) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const payload: Record<string, unknown> = {
        userId: props.userId,
        docType: props.docType,
        customName: editorState.name,
        customJobTitle: editorState.jobTitle,
        customDepartment: editorState.department,
        customSalary: editorState.salary,
        customSursalaire: editorState.sursalaire,
        customBodyText: editorState.bodyText,
        startDate: editorState.leaveStart,
        endDate: editorState.leaveEnd,
        returnDate: editorState.leaveReturn,
        companyName: editorState.companyName,
        companyAddress: editorState.companyAddress,
        companyRepresentative: editorState.companyRepresentative,
        employeeBirth: editorState.employeeBirth,
        employeeCni: editorState.employeeCni,
        employeeNationality: editorState.employeeNationality,
        employeeAddress: editorState.employeeAddress,
        articles: editorState.articles.map((article) => ({ title: article.title, content: article.content })),
      };

      if (props.docType === "ordre_virement") {
        payload.bankName = props.bankName;
        payload.totalAmount = props.totalAmount;
        payload.month = props.month;
        payload.year = props.year;
      }
      if (props.docType.startsWith("declaration_")) {
        payload.month = props.month;
        payload.year = props.year;
        payload.itsData = props.itsData;
        payload.cnpsData = props.cnpsData;
      }

      const success = await downloadDocumentPDF(payload, props.docType);
      if (success) {
        props.onClose();
      }
    } finally {
      setGenerating(false);
    }
  };

  return { generating, handleDownload };
}
