import { contextBridge, ipcRenderer } from 'electron';
import type { MarkdownDocumentState, MarkdownViewApi } from '../shared/markdown';

const markdownViewApi: MarkdownViewApi = {
  getInitialDocument: () => ipcRenderer.invoke('markdown:get-initial') as Promise<MarkdownDocumentState>,
  onDocumentChange: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, document: MarkdownDocumentState) => callback(document);

    ipcRenderer.on('markdown:changed', listener);

    return () => ipcRenderer.off('markdown:changed', listener);
  },
};

contextBridge.exposeInMainWorld('markdownView', markdownViewApi);
