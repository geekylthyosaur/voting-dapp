use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn inc(n: i32) -> i32 {
    n + 1
}
