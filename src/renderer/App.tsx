import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarkdownDocumentState } from '../shared/markdown';
import { markdownComponents } from './markdownComponents';
import { useMarkdownDocument } from './useMarkdownDocument';

const formatUpdatedAt = (updatedAt: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(updatedAt));

const DocumentChrome = ({ document }: { readonly document: MarkdownDocumentState }) => (
  <div className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1">
      <h1 className="min-w-0 truncate text-sm font-semibold text-zinc-950">{document.fileName}</h1>
      <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">{document.filePath}</p>
      <p
        className={`text-xs font-medium ${document.status === 'ready' ? 'text-emerald-700' : 'text-red-700'}`}
        title={document.updatedAt}
      >
        {document.status === 'ready' ? 'Updated' : 'Error'} {formatUpdatedAt(document.updatedAt)}
      </p>
    </div>
  </div>
);

const LoadingState = () => (
  <main className="grid min-h-dvh place-items-center bg-zinc-50 px-6 text-sm text-zinc-500">Loading markdown...</main>
);

const ErrorState = ({ document }: { readonly document: MarkdownDocumentState & { readonly status: 'error' } }) => (
  <main className="mx-auto max-w-5xl px-4 py-10">
    <div className="border-l-4 border-red-500 bg-red-50 px-5 py-4">
      <h2 className="text-sm font-semibold text-red-950">Could not read markdown file</h2>
      <p className="mt-2 font-mono text-sm text-red-900">{document.message}</p>
    </div>
  </main>
);

export const App = () => {
  const markdownDocument = useMarkdownDocument();

  if (!markdownDocument) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <DocumentChrome document={markdownDocument} />
      {markdownDocument.status === 'error' ? (
        <ErrorState document={markdownDocument} />
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-8">
          <article className="prose prose-zinc max-w-none prose-a:text-blue-700 prose-a:no-underline hover:prose-a:text-blue-900 hover:prose-a:underline prose-pre:bg-zinc-950 prose-pre:text-zinc-50">
            <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {markdownDocument.markdown}
            </Markdown>
          </article>
        </main>
      )}
    </div>
  );
};
