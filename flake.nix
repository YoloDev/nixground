{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    yoloproj = {
      url = "github:yolodev/yoloproj";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    geni = {
      url = "github:emilpriver/geni";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ yoloproj, ... }:
    yoloproj.lib.mkFlake inputs (
      { inputs, ... }:
      {
        perSystem =
          { system, pkgs, ... }:
          let
            geni = inputs.geni.packages.${system}.geni;
            just-mcp = pkgs.callPackage ./nix/just-mcp { };
          in
          {
            packages.just-mcp = just-mcp;

            devshells.default =
              { pkgs, ... }:
              {
                packages = [
                  pkgs.codex
                  pkgs.bun
                  pkgs.turso-cli
                  pkgs.jq
                  pkgs.opencode
                  pkgs.oxlint
                  pkgs.oxfmt
                  pkgs.sqlfluff
                  pkgs.typescript-go
                  pkgs.tini
                  geni
                  just-mcp
                ];
              };

            pre-commit.settings.hooks =
              let
                mkHookScript =
                  opts:
                  let
                    pkg = pkgs.writeShellApplication opts;
                  in
                  "${pkg}/bin/${opts.name}";
              in
              {
                flake-checker.priority = 0;
                nixfmt.priority = 0;

                bun-test = {
                  enable = true;
                  name = "bun-test";
                  files = "src\/.*?\.(ts|tsx|mts)$";
                  pass_filenames = false;
                  entry = mkHookScript {
                    name = "bun-test";
                    runtimeInputs = [ pkgs.bun ];
                    text = "bun test";
                  };
                };

                oxlint = {
                  enable = true;
                  name = "oxlint";
                  files = "src\/.*?\.(ts|tsx|mts)$";
                  pass_filenames = true;
                  entry = "${pkgs.oxlint}/bin/oxlint --type-aware --type-check";
                };

                stylelint = {
                  enable = true;
                  name = "stylelint";
                  files = "src\/.*?\.(css|scss|sass)$";
                  pass_filenames = true;
                  entry = "${pkgs.bun}/bin/bun --bun stylelint";
                };

                oxfmt = {
                  enable = true;
                  priority = 1;
                  name = "oxfmt";
                  files = "\.(ts|tsx|mts|json|md|jsonc|yaml|yml|toml|html)$";
                  pass_filenames = true;
                  entry = "${pkgs.oxfmt}/bin/oxfmt";
                  require_serial = true;
                };

                sqlfluff = {
                  enable = true;
                  name = "sqlfluff";
                  files = "migrations\/.*?\.(up|down)\.(sql)$";
                  pass_filenames = true;
                  entry = "${pkgs.sqlfluff}/bin/sqlfluff lint";
                  require_serial = true;
                };
              };
          };
      }
    );
}
