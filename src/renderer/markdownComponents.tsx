import type { Components } from 'react-markdown';
import { toMarkdownResourceUrl } from './resourceUrls';

export const markdownComponents: Components = {
  a: ({ href, children, ...props }) => (
    <a
      {...props}
      href={toMarkdownResourceUrl(href)}
      rel="noreferrer"
      target={href?.startsWith('#') ? undefined : '_blank'}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => <img {...props} alt={alt ?? ''} loading="lazy" src={toMarkdownResourceUrl(src)} />,
};
