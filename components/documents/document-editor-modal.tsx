import { DocumentPreviewModal } from "./core/DocumentPreviewModal";
import { DocumentPreviewModalProps } from "./core/types";

export function DocumentEditorModal(props: DocumentPreviewModalProps) {
  return <DocumentPreviewModal {...props} />;
}

export type { ArticleItem, DocumentPreviewModalProps as DocumentEditorModalProps } from "./core/types";
