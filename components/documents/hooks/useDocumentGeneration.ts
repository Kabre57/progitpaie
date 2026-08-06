"use client";

import { useState } from "react";
import { DocumentPreviewModalProps } from "../core/types";
import { downloadDocumentPDF } from "../utils/pdfGenerator";

export function useDocumentGeneration(props: DocumentPreviewModalProps, editorState: any) {
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
        articles: editorState.articles.map((a: any) => ({ title: a.title, content: a.content })),
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
