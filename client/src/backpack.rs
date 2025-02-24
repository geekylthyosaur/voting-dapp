use std::str::FromStr;

use solana_sdk::{pubkey::Pubkey, transaction::Transaction};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{
    js_sys::{Object, Promise, Reflect, Uint8Array, JSON},
    JsFuture,
};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(thread_local_v2, js_namespace = xnft, js_name = solana)]
    pub static BACKPACK: Backpack;

    #[wasm_bindgen(thread_local_v2, js_namespace = window, js_name = xnft)]
    pub static XNFT: Backpack;

    #[wasm_bindgen(extends = Object)]
    pub type Backpack;

    #[wasm_bindgen(method)]
    pub fn connect(this: &Backpack, options: &JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn disconnect(this: &Backpack) -> Promise;

    #[wasm_bindgen(method, js_name = openXnft)]
    pub fn open_xnft(this: &Backpack, xnft: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = _backpackGetAccounts)]
    pub fn backpack_get_accounts(this: &Backpack) -> Promise;

    #[wasm_bindgen(method, js_name = signIn)]
    pub fn sign_in(this: &Backpack, options: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = sendAndConfirm)]
    pub fn send_and_confirm(
        this: &Backpack,
        tx: &JsValue,
        signers: &JsValue,
        options: &JsValue,
        custom_connection: &JsValue,
        uuid: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = signAndSendTransaction)]
    pub fn sign_and_send_transaction(this: &Backpack, tx: &JsValue, options: &JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn send(
        this: &Backpack,
        tx: &JsValue,
        signers: &JsValue,
        options: &JsValue,
        custom_connection: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = sendAll)]
    pub fn send_all(
        this: &Backpack,
        txs: &JsValue,
        signers: &JsValue,
        options: &JsValue,
        custom_connection: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method)]
    pub fn simulate(
        this: &Backpack,
        tx: &JsValue,
        signers: &JsValue,
        commitment: &JsValue,
        custom_connection: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = signTransaction)]
    pub fn sign_transaction(
        this: &Backpack,
        tx: &JsValue,
        public_key: &JsValue,
        custom_connection: &JsValue,
        uuid: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = signAllTransactions)]
    pub fn sign_all_transactions(
        this: &Backpack,
        txs: &JsValue,
        public_key: &JsValue,
        custom_connection: &JsValue,
        uuid: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = prepareSolanaOffchainMessage)]
    pub fn prepare_solana_offchain_message(this: &Backpack, message: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = signMessage)]
    pub fn sign_message(
        this: &Backpack,
        message: &JsValue,
        public_key: &JsValue,
        uuid: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, getter, js_name = isBackpack)]
    pub fn is_backpack(this: &Backpack) -> bool;

    #[wasm_bindgen(method, getter, js_name = isConnected)]
    pub fn is_connected(this: &Backpack) -> bool;

    #[wasm_bindgen(method, getter, js_name = isXnft)]
    pub fn is_xnft(this: &Backpack) -> bool;

    #[wasm_bindgen(method, getter)]
    pub fn publicKey(this: &Backpack) -> JsValue;

    #[wasm_bindgen(method, getter)]
    pub fn connection(this: &Backpack) -> JsValue;
}

pub struct Wallet;

impl Wallet {
    pub async fn connect() -> Result<ConnectedWallet, ()> {
        let options = Object::new();
        Reflect::set(
            &options,
            &serde_wasm_bindgen::to_value("onlyIfTrusted").unwrap(),
            &serde_wasm_bindgen::to_value(&true).unwrap(),
        )
        .unwrap();

        let promise = BACKPACK.with(|b| b.sign_in(&options));
        let _response = JsFuture::from(promise).await.unwrap();

        let pubkey = {
            let value = BACKPACK.with(|b| b.publicKey());
            let js_str = JSON::stringify(&value).unwrap();
            let js_str = js_str.as_string().unwrap();
            let str: String = serde_json::from_str(&js_str).unwrap();
            Pubkey::from_str(&str).unwrap()
        };

        Ok(ConnectedWallet { pubkey })
    }
}

#[derive(Debug)]
pub struct ConnectedWallet {
    pub pubkey: Pubkey,
}

impl ConnectedWallet {
    pub async fn sign_and_send_transaction(&self, tx: &Transaction) -> Result<(), ()> {
        let tx_bytes = bincode::serialize(&tx).unwrap();
        let transaction_js_array = Uint8Array::from(&tx_bytes[..]);
        let tx_bs58 = bs58::encode(tx_bytes).into_string();

        let options = Object::new();
        Reflect::set(
            &options,
            &serde_wasm_bindgen::to_value("method").unwrap(),
            &serde_wasm_bindgen::to_value("signTransaction").unwrap(),
        )
        .unwrap();

        let params = Object::new();
        Reflect::set(
            &params,
            &serde_wasm_bindgen::to_value("message").unwrap(),
            &serde_wasm_bindgen::to_value(&tx_bs58).unwrap(),
        )
        .unwrap();

        Reflect::set(
            &options,
            &serde_wasm_bindgen::to_value("params").unwrap(),
            &JsValue::from(&params),
        )
        .unwrap();

        let promise =
            BACKPACK.with(|b| b.sign_and_send_transaction(&transaction_js_array, &options));
        let _result = JsFuture::from(promise).await;

        Ok(())
    }
}
