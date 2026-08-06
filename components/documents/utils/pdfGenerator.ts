/**
 * Générateur et téléchargeur de fichiers PDF via l'API backend
 */

export async function downloadDocumentPDF(payload: Record<string, unknown>, defaultFileName: string): Promise<boolean> {
  try {
    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${defaultFileName}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } else {
      const errJson = await res.json().catch(() => ({}));
      alert(errJson.error || "Erreur lors de la génération du document PDF");
      return false;
    }
  } catch (error) {
    console.error("PDF Download error:", error);
    alert("Erreur réseau ou serveur lors de la génération du PDF");
    return false;
  }
}
