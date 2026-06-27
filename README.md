# mdview

`mdview` opens a desktop window that renders a markdown file and live-updates when that file changes.

## Development

```sh
nix develop
pnpm install
pnpm dev README.md
```

## Build And Run

```sh
nix develop
pnpm install
pnpm build
pnpm start README.md
```

## Nix Run

From the repository root:

```sh
nix run . -- README.md
```

From another directory:

```sh
nix run path:/home/warren/source/mdview -- /absolute/path/to/file.md
```

After linking or installing the package, the CLI shape is:

```sh
mdview README.md
```

The renderer uses `react-markdown` with `remark-gfm`, which gives a React-native rendering path with support for common README features like tables, task lists, autolinks, footnotes, and strikethrough.
