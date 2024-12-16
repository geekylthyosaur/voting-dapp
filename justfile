check-signer:
  solana address

deploy: check-signer
  cd program && cargo build-sbf && solana program deploy ./target/deploy/dapp.so

run: deploy
  cd program && cargo run

