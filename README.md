### Run

- Install Rust
- Install Solana
- Run `cargo build-sbf --force-tools-install`
- Run `solana config set --keypair $XDG_CONFIG_HOME/solana/id.json`
- Run `solana config set --url localhost`
- Run `solana-test-validator`
- Put address from `solana address` into `.cargo/config.toml`
- Run `just run`
