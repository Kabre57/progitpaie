"use client";

import { useState, useEffect } from "react";
import type {
  DocType,
  PayslipAppearanceConfig,
  PayslipLegalConfig,
  PayslipRatesConfig,
} from "../core/types";

export function usePayslipSettings(docType: DocType, isOpen: boolean) {
  const [payslipAppearance, setPayslipAppearance] = useState<PayslipAppearanceConfig | null>(null);
  const [payslipLegal, setPayslipLegal] = useState<PayslipLegalConfig | null>(null);
  const [ratesConfig, setRatesConfig] = useState<PayslipRatesConfig | null>(null);

  useEffect(() => {
    if (docType === "payslip" && isOpen) {
      fetch("/api/settings/payslip")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setPayslipAppearance(json.data.appearance);
            setPayslipLegal(json.data.legal);
          }
        })
        .catch((err) => console.error("Error loading payslip settings for preview:", err));

      fetch("/api/settings/rates")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setRatesConfig(json.data);
          }
        })
        .catch((err) => console.error("Error loading rates for preview:", err));
    }
  }, [docType, isOpen]);

  return { payslipAppearance, payslipLegal, ratesConfig };
}
