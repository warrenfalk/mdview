{
  description = "mdview Electron markdown viewer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
          lib = pkgs.lib;
          src = lib.cleanSourceWith {
            src = ./.;
            filter =
              path: type:
              let
                relPath = lib.removePrefix "${toString ./.}/" (toString path);
                topLevel = builtins.head (lib.splitString "/" relPath);
              in
              !(builtins.elem topLevel [
                ".direnv"
                ".pnpm-store"
                "node_modules"
                "out"
                "result"
              ]);
          };
          mdview = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "mdview";
            version = "0.1.0";

            inherit src;

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (finalAttrs) pname version src;
              pnpm = pkgs.pnpm;
              fetcherVersion = 4;
              hash = "sha256-/+GcsWySKNBzqffZDjv7sk9kQONmV7XSnZ1K38tvRlg=";
              prePnpmInstall = ''
                pnpm config set minimum-release-age 0
              '';
            };

            nativeBuildInputs = [
              pkgs.nodejs_24
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron}/bin";
            ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
            npm_config_electron_skip_binary_download = "true";

            buildPhase = ''
              runHook preBuild

              pnpm run build
              pnpm prune --prod --ignore-scripts
              find node_modules -xtype l -delete

              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall

              appDir="$out/lib/mdview/app"
              mkdir -p "$appDir" "$out/bin"
              cp -r out node_modules package.json "$appDir"/

              cat > "$out/bin/mdview" <<EOF
#!${pkgs.runtimeShell}
set -euo pipefail

if [ "\$#" -ne 1 ]; then
  echo "Usage: mdview <file.md>" >&2
  exit 1
fi

case "\$1" in
  /*) target_file="\$1" ;;
  *) target_file="\$PWD/\$1" ;;
esac

export MDVIEW_FILE="\$target_file"
exec ${lib.getExe pkgs.electron} "$appDir"
EOF

              chmod +x "$out/bin/mdview"

              runHook postInstall
            '';

            meta = {
              description = "Electron markdown viewer that live-updates when a file changes";
              mainProgram = "mdview";
              platforms = lib.platforms.linux ++ lib.platforms.darwin;
            };
          });
        in
        {
          default = mdview;
          mdview = mdview;
        }
      );

      apps = forAllSystems (
        system:
        let
          mdview = self.packages.${system}.default;
        in
        {
          default = {
            type = "app";
            program = "${mdview}/bin/mdview";
            meta.description = "Open a live-updating Electron markdown viewer";
          };
          mdview = {
            type = "app";
            program = "${mdview}/bin/mdview";
            meta.description = "Open a live-updating Electron markdown viewer";
          };
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.electron
              pkgs.nodejs_24
              pkgs.pnpm
            ];

            shellHook = ''
              export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
              export ELECTRON_SKIP_BINARY_DOWNLOAD=1
              export npm_config_electron_skip_binary_download=true
              export npm_config_store_dir="$PWD/.pnpm-store"
              export PATH="$PWD/bin:$PATH"
            '';
          };
        }
      );
    };
}
