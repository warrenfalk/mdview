export type MarkdownDocumentReady = {
  readonly byteLength: number;
  readonly fileName: string;
  readonly filePath: string;
  readonly markdown: string;
  readonly status: 'ready';
  readonly updatedAt: string;
};

export type MarkdownDocumentError = {
  readonly fileName: string;
  readonly filePath: string;
  readonly message: string;
  readonly status: 'error';
  readonly updatedAt: string;
};

export type MarkdownDocumentState = MarkdownDocumentError | MarkdownDocumentReady;

export type MarkdownViewApi = {
  readonly getInitialDocument: () => Promise<MarkdownDocumentState>;
  readonly onDocumentChange: (callback: (document: MarkdownDocumentState) => void) => () => void;
};
