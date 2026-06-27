const absoluteUrlPattern = /^[a-z][a-z\d+.-]*:/i;

const splitUrl = (url: string) => {
  const [pathAndQuery = '', hash] = url.split('#', 2);
  const [pathname = '', query] = pathAndQuery.split('?', 2);

  return { hash, pathname, query };
};

const encodePathname = (pathname: string) =>
  pathname
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const toMarkdownResourceUrl = (url: string | undefined) => {
  if (!url || url.startsWith('#') || url.startsWith('//') || absoluteUrlPattern.test(url)) {
    return url;
  }

  const { hash, pathname, query } = splitUrl(url);
  const encodedPathname = encodePathname(pathname);
  const queryPart = query ? `?${query}` : '';
  const hashPart = hash ? `#${hash}` : '';

  return `mdview-asset://local/${encodedPathname}${queryPart}${hashPart}`;
};
