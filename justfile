check-signer:
  solana address

deploy: check-signer
  cd program && \
  cargo build-sbf && \
  solana program deploy ./target/deploy/dapp.so --program-id ./program-id.json

run: deploy
  cd web && \
  wasm-pack build --target web && \
  python -m http.server -b 127.0.0.1 3400 & \
  PID=$! && \
  xdg-open http://127.0.0.1:3400 && \
  trap "kill $PID" EXIT && \
  wait $PID

