use std::str::FromStr;

use borsh::BorshDeserialize;
use common::state::Poll;
use solana_client_wasm::WasmClient;
use solana_sdk::pubkey::Pubkey;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub async fn get_poll(pubkey: &str) -> Poll {
    let client = WasmClient::new("http://localhost:8899");
    let pubkey = Pubkey::from_str(pubkey).unwrap();
    let poll = client.get_account(&pubkey).await.unwrap();
    Poll::try_from_slice(&poll.data).unwrap()
}
