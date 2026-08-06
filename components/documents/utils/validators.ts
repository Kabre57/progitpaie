/**
 * Utilitaires de validation pour les formulaires de documents
 */

export function validateDocumentInput(name: string, jobTitle: string): { isValid: boolean; error?: string } {
  if (!name.trim()) {
    return { isValid: false, error: "Le nom du salarié est obligatoire" };
  }
  if (!jobTitle.trim()) {
    return { isValid: false, error: "Le poste du salarié est obligatoire" };
  }
  return { isValid: true };
}
