"use client";

import { useState, useEffect } from "react";
import { ArticleItem, DocumentPreviewModalProps } from "../core/types";
import { fmtNum } from "../utils/formatters";

export function useDocumentEditor(props: DocumentPreviewModalProps) {
  const [companyName, setCompanyName] = useState("LOGIPAIE RH 21 (SARL)");
  const [companyAddress, setCompanyAddress] = useState("ABIDJAN COCODY, 01 BP 5115 ABIDJAN 01");
  const [companyRepresentative, setCompanyRepresentative] = useState("la Direction Générale");

  const [name, setName] = useState(props.defaultName || "");
  const [jobTitle, setJobTitle] = useState(props.defaultJobTitle || "Collaborateur");
  const [department, setDepartment] = useState(props.defaultDepartment || "Général");
  const [salary, setSalary] = useState(props.defaultSalary || 0);
  const [sursalaire, setSursalaire] = useState(props.defaultSursalaire || 0);
  const [transport, setTransport] = useState(props.defaultTransport || 30000);
  const [category, setCategory] = useState(props.defaultCategory || "1A");

  const [employeeBirth, setEmployeeBirth] = useState("01/01/2000 à Abidjan");
  const [employeeCni, setEmployeeCni] = useState("C005574354");
  const [employeeNationality, setEmployeeNationality] = useState("Ivoirienne");
  const [employeeAddress, setEmployeeAddress] = useState("Abidjan, Côte d'Ivoire");

  const [leaveStart, setLeaveStart] = useState(props.startDate || "");
  const [leaveEnd, setLeaveEnd] = useState(props.endDate || "");
  const [leaveReturn, setLeaveReturn] = useState(props.returnDate || "");

  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [bodyText, setBodyText] = useState("");

  const handleAddArticle = () => {
    const nextNum = articles.length + 1;
    setArticles((prev) => [
      ...prev,
      {
        id: `art-${Date.now()}`,
        title: nextNum === 1 ? "Article 1er" : `Article ${nextNum}`,
        content: "Entrez le texte de l'article...",
      },
    ]);
  };

  const handleUpdateArticle = (id: string, field: "title" | "content", val: string) => {
    setArticles((prev) => prev.map((art) => (art.id === id ? { ...art, [field]: val } : art)));
  };

  const handleDeleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((art) => art.id !== id));
  };

  const handleMoveArticle = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= articles.length) return;
    const updated = [...articles];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setArticles(updated);
  };

  useEffect(() => {
    setName(props.defaultName || "");
    setJobTitle(props.defaultJobTitle || "Collaborateur");
    setDepartment(props.defaultDepartment || "Général");
    setSalary(props.defaultSalary || 0);
    setSursalaire(props.defaultSursalaire || 0);
    setTransport(props.defaultTransport || 30000);
    setCategory(props.defaultCategory || "1A");
    setLeaveStart(props.startDate || "");
    setLeaveEnd(props.endDate || "");
    setLeaveReturn(props.returnDate || "");

    const formattedDate = props.defaultJoiningDate
      ? new Date(props.defaultJoiningDate).toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");
    const totalSalaryVal = (props.defaultSalary || 0) + (props.defaultSursalaire || 0);

    if (props.docType === "attestation_conge") {
      setBodyText(
        `Attestons que ${props.defaultName || ""}, employé(e) dans notre société en qualité de ${props.defaultJobTitle || ""}, est en Congés annuels du ${props.startDate || formattedDate} au ${props.endDate || new Date().toLocaleDateString("fr-FR")} inclus.\n\nLa reprise du travail est fixée au ${props.returnDate || new Date().toLocaleDateString("fr-FR")} à 08 heures 00.\n\nEn foi de quoi, nous lui délivrons le présent certificat, pour servir et valoir ce que de droit.`
      );
    } else if (props.docType === "attestation") {
      setBodyText(
        `Attestons que ${props.defaultName || ""}, est employé(e) dans notre société en qualité de ${props.defaultJobTitle || ""}, catégorie ${props.defaultCategory || ""}, depuis le ${formattedDate}.\n\nEn foi de quoi, nous lui délivrons la présente attestation, pour servir et valoir ce que de droit.`
      );
    } else if (props.docType === "certificat") {
      setBodyText(
        `Certifions que M. / Mme ${props.defaultName || ""} a été employé(e) dans notre société du ${formattedDate} au ${new Date().toLocaleDateString("fr-FR")} en qualité de ${props.defaultJobTitle || ""}, libre de tout engagement à compter de ce jour.`
      );
    } else if (props.docType === "contract") {
      if (props.defaultContractType === "CDD") {
        setArticles([
          { id: "1", title: "Article 1er", content: `${props.defaultName || ""} est engagé(e) pour une période de ${props.defaultCddMonths || 6} mois, allant du ${formattedDate}, au poste de ${props.defaultJobTitle || ""}, correspondant à la catégorie professionnelle ${props.defaultCategory || ""}, conformément à la Convention Collective Interprofessionnelle (CCI).` },
          { id: "2", title: "Article 2", content: `Le présent contrat prend fin à l'échéance du terme convenu. Il ne peut être rompu avant terme que pour force majeure, accord commun ou faute lourde de l'une des parties.` },
          { id: "3", title: "Article 3", content: `${props.defaultName || ""} percevra une rémunération mensuelle brute de ${fmtNum(totalSalaryVal)} FCFA et une prime de transport de ${fmtNum(props.defaultTransport || 30000)} FCFA.` },
          { id: "4", title: "Article 4", content: `Le salarié aura droit à un congé payé et une gratification déterminés suivant les dispositions légales en vigueur.` },
          { id: "5", title: "Article 5", content: `Dans leurs relations de travail, les parties se déclarent liées par la loi n°2015-532 portant Code du travail.` },
          { id: "6", title: "Article 6", content: `L'employeur est affilié à la CNPS sous le numéro 123456. Le salarié déclare se soumettre à l'obligation légale d'y adhérer.` },
          { id: "7", title: "Article 7", content: `${props.defaultName || ""} affirme qu'il est, à la date de son entrée en fonction, libre de tout engagement envers d'autres employeurs.` },
        ]);
      } else {
        setArticles([
          { id: "1", title: "Article 1er", content: `${props.defaultName || ""} est engagé(e) à la date du ${formattedDate}, au poste de ${props.defaultJobTitle || ""}, correspondant à la catégorie professionnelle ${props.defaultCategory || ""}, conformément à l'annexe à la Convention Collective Interprofessionnelle (CCI) du 20/07/1977.` },
          { id: "2", title: "Article 2", content: `Le présent contrat prend fin sur décision unilatérale de l'une ou l'autre des parties au contrat. Cependant, conformément à l'article 16.3 du Code du Travail, l'employeur ne peut mettre fin au contrat que si et seulement si, il dispose d'un motif légitime.` },
          { id: "3", title: "Article 3", content: `${props.defaultName || ""} percevra une rémunération mensuelle brute de ${fmtNum(totalSalaryVal)} FCFA et une prime de transport de ${fmtNum(props.defaultTransport || 30000)} FCFA.` },
          { id: "4", title: "Article 4", content: `Le salarié aura droit à un congé payé et une gratification déterminés suivant les dispositions légales en vigueur.` },
          { id: "5", title: "Article 5", content: `Dans leurs relations de travail, les parties se déclarent liées par la loi n°2015-532 du 20 juillet 2015 portant Code du travail et ses décrets d'application.` },
          { id: "6", title: "Article 6", content: `L'employeur est affilié à la CNPS sous le numéro 123456. Le salarié déclare se soumettre à l'obligation légale qu'il a d'adhérer à ladite caisse.` },
          { id: "7", title: "Article 7", content: `${props.defaultName || ""} affirme qu'il est, à la date de son entrée en fonction dans notre entité, libre de tout engagement envers d'autres employeurs.` },
        ]);
      }
    } else if (props.docType === "payslip") {
      setBodyText(`Bulletin de paie individuel calculé selon le barème officiel LOGIPAIE RH.`);
    }
  }, [
    props.defaultName, props.defaultJobTitle, props.defaultDepartment, props.defaultSalary,
    props.defaultSursalaire, props.defaultTransport, props.defaultCategory, props.defaultJoiningDate,
    props.defaultContractType, props.defaultCddMonths, props.startDate, props.endDate, props.returnDate,
    props.docType, props.isOpen
  ]);

  return {
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyRepresentative, setCompanyRepresentative,
    name, setName,
    jobTitle, setJobTitle,
    department, setDepartment,
    salary, setSalary,
    sursalaire, setSursalaire,
    transport, setTransport,
    category, setCategory,
    employeeBirth, setEmployeeBirth,
    employeeCni, setEmployeeCni,
    employeeNationality, setEmployeeNationality,
    employeeAddress, setEmployeeAddress,
    leaveStart, setLeaveStart,
    leaveEnd, setLeaveEnd,
    leaveReturn, setLeaveReturn,
    articles, setArticles,
    bodyText, setBodyText,
    handleAddArticle,
    handleUpdateArticle,
    handleDeleteArticle,
    handleMoveArticle,
  };
}
