check-signer:
  solana address

deploy: check-signer
  cd program && \
  cargo build-sbf && \
  solana program deploy ./target/deploy/dapp.so --program-id ./program-id.json

run: deploy
  cd client && \
  wasm-pack build --target web --dev && \
  python -m http.server -b 127.0.0.1 3400 & \
  PID=$! && \
  trap "kill $PID" EXIT && \
  wait $PID
