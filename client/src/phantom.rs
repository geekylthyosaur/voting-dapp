use std::str::FromStr;

use solana_sdk::{pubkey::Pubkey, transaction::Transaction};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{
    js_sys::{Object, Promise, Reflect, JSON},
    JsFuture,
};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(thread_local_v2, js_namespace = window, js_name = solana)]
    pub static SOLANA: Solana;

    #[wasm_bindgen]
    pub type Solana;

    #[wasm_bindgen(method, js_name = accountChanged)]
    pub fn account_changed(this: &Solana, listener: &JsValue);

    #[wasm_bindgen(method)]
    pub fn connect(this: &Solana, options: &JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn disconnect(this: &Solana) -> Promise;

    #[wasm_bindgen(method, getter)]
    pub fn publicKey(this: &Solana) -> JsValue;

    #[wasm_bindgen(method, js_name = handleNotification)]
    pub fn handle_notification(this: &Solana, notification: &JsValue);

    #[wasm_bindgen(method, js_name = removeAllListeners)]
    pub fn remove_all_listeners(this: &Solana, event: &JsValue);

    #[wasm_bindgen(method)]
    pub fn request(this: &Solana, options: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = signAllTransactions)]
    pub fn sign_all_transactions(this: &Solana, transactions: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = signAndSendTransaction)]
    pub fn sign_and_send_transaction(
        this: &Solana,
        transaction: &JsValue,
        options: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = signAndSendAllTransactions)]
    pub fn sign_and_send_all_transactions(
        this: &Solana,
        transactions: &JsValue,
        options: &JsValue,
    ) -> Promise;

    #[wasm_bindgen(method, js_name = signIn)]
    pub fn sign_in(this: &Solana, options: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = signMessage)]
    pub fn sign_message(this: &Solana, message: &JsValue) -> Promise;

    #[wasm_bindgen(method, js_name = signTransaction)]
    pub fn sign_transaction(this: &Solana, transaction: &JsValue) -> Promise;
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

        let promise = SOLANA.with(|s| s.sign_in(&options));
        let _response = JsFuture::from(promise).await.unwrap();

        let pubkey = {
            let value = SOLANA.with(|s| s.publicKey());
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

        let promise = SOLANA.with(|s| s.request(&options));
        let _result = JsFuture::from(promise).await;

        Ok(())
    }
}
