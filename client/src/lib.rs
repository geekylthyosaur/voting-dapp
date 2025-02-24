use std::{str::FromStr, sync::OnceLock};

use backpack::{ConnectedWallet, Wallet};
use borsh::BorshDeserialize;
use common::{state::Poll, ProgramInstruction};
use solana_client_wasm::WasmClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Keypair,
    signer::Signer,
    system_program,
    transaction::Transaction,
};
use wasm_bindgen::prelude::*;

mod backpack;
mod phantom;

static PROGRAM_ID: OnceLock<Pubkey> = OnceLock::new();
static CLIENT: OnceLock<WasmClient> = OnceLock::new();
static WALLET: OnceLock<ConnectedWallet> = OnceLock::new();

#[wasm_bindgen(start)]
pub async fn start() {
    console_error_panic_hook::set_once();

    let str = include_str!("../../program/program-id.json");
    let bytes: Vec<u8> = serde_json::from_str(str).unwrap();
    let key = Keypair::from_bytes(&bytes).unwrap();
    PROGRAM_ID.set(key.pubkey()).unwrap();

    let wallet = Wallet::connect().await.unwrap();
    WALLET.set(wallet).unwrap();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub async fn get_poll(poll_id: &str) -> Poll {
    let client = CLIENT.get_or_init(|| WasmClient::new("http://127.0.0.1:8899"));
    let poll_id = Pubkey::from_str(poll_id).unwrap();
    let poll = client.get_account(&poll_id).await.unwrap();
    Poll::try_from_slice(&poll.data).unwrap()
}

#[wasm_bindgen]
pub async fn vote(poll_id: &str, vote: u8) {
    let poll_id = Pubkey::from_str(poll_id).unwrap();
    let accounts = vec![AccountMeta::new(poll_id, false)];
    let ix = ProgramInstruction::Vote(vote.into());
    let ix = Instruction::new_with_borsh(*PROGRAM_ID.get().unwrap(), &ix, accounts);
    let payer = WALLET.get().unwrap().pubkey;
    let tx = Transaction::new_with_payer(&[ix], Some(&payer));
    WALLET
        .get()
        .unwrap()
        .sign_and_send_transaction(&tx)
        .await
        .unwrap();
}

#[wasm_bindgen]
pub async fn create_poll(title: String, options: Vec<String>) {
    let client = CLIENT.get_or_init(|| WasmClient::new("http://127.0.0.1:8899"));
    let new_poll = Poll::new().with_title(title).with_options(options);
    let poll = Keypair::new();
    let rent = client
        .get_minimum_balance_for_rent_exemption(new_poll.size() as usize)
        .await
        .unwrap();
    let ix = ProgramInstruction::CreatePoll {
        poll: new_poll,
        rent,
    };
    let payer = WALLET.get().unwrap().pubkey;
    let accounts = vec![
        AccountMeta::new_readonly(payer, true),
        AccountMeta::new(poll.pubkey(), true),
        AccountMeta::new_readonly(system_program::ID, false),
    ];
    let ix = Instruction::new_with_borsh(*PROGRAM_ID.get().unwrap(), &ix, accounts);
    let tx = Transaction::new_with_payer(&[ix], Some(&payer));
    let balance = client.get_balance(&payer).await.unwrap();
    log(&format!("{} balance: {} lamport", payer, balance));
    WALLET
        .get()
        .unwrap()
        .sign_and_send_transaction(&tx)
        .await
        .unwrap();
    log(&format!("{}", poll.pubkey()));
}
