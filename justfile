deploy:
    cargo build-sbf && solana program deploy ./target/deploy/dapp.so

run: deploy
    cargo run
