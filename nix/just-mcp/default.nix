{
  fetchFromGitHub,
  rustPlatform,
}:

rustPlatform.buildRustPackage (finalAttrs: {
  pname = "just-mcp";
  version = "0.1.5";

  srcHash = "sha256-OX4UrwXcMwSx1UKQSbh0pwZgnJ7n5HBsOioz7uoE8Kk=";
  cargoHash = "sha256-Jl+AvjrfOuYMOHt5GYE6s+PVzKsegL59a1S5rqHXvO0=";

  src = fetchFromGitHub {
    owner = "PromptExecution";
    repo = "just-mcp";
    rev = "v${finalAttrs.version}";
    hash = finalAttrs.srcHash;
  };
})
