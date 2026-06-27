import { useEffect, useState } from 'react';
import type { MarkdownDocumentState } from '../shared/markdown';

export const useMarkdownDocument = () => {
  const [document, setDocument] = useState<MarkdownDocumentState | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    void window.markdownView.getInitialDocument().then((initialDocument) => {
      if (isSubscribed) {
        setDocument(initialDocument);
      }
    });

    const unsubscribe = window.markdownView.onDocumentChange((nextDocument) => {
      if (isSubscribed) {
        setDocument(nextDocument);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  return document;
};
