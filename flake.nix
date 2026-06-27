{
  description = "mdview Electron markdown viewer";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
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
