### Setup

- Setup Rust
  - Install [Rust](https://www.rust-lang.org/tools/install)
  - Run `cargo install wasm-pack`
- Setup Solana
  - Install [Solana](https://solana.com/docs/intro/installation)
  - Run `cargo build-sbf --force-tools-install`
  - Run `solana config set --keypair $XDG_CONFIG_HOME/solana/id.json`
  - Run `solana config set --url localhost`
  - Run `solana-keygen new --outfile program/program-id.json`
  - Run `solana-test-validator`

  ### Run
Run `just run`
