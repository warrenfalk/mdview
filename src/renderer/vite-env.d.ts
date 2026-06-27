/// <reference types="vite/client" />

import type { MarkdownViewApi } from '../shared/markdown';

declare global {
  interface Window {
    readonly markdownView: MarkdownViewApi;
  }
}
