use std::str::FromStr;

use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::Instruction,
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
    transaction::Transaction,
};

fn main() {
    let program_id = Pubkey::from_str("B3pBndkF5cN36QZ1EqoRigRayVKRx5Dz1XMj6xXSFxBZ").unwrap();

    let connection =
        RpcClient::new_with_commitment("http://localhost:8899", CommitmentConfig::confirmed());

    let keypair = read_keypair_file("/home/dmytro/.config/solana/id.json").unwrap();

    let blockhash_info = connection.get_latest_blockhash().unwrap();

    let mut transaction = Transaction::new_with_payer(
        &[Instruction::new_with_bytes(program_id, &[], vec![])],
        Some(&keypair.pubkey()),
    );

    transaction.try_sign(&[&keypair], blockhash_info).unwrap();

    let tx_hash = connection
        .send_and_confirm_transaction(&transaction)
        .unwrap();

    println!("Transaction sent with hash: {}", tx_hash);

    println!(
        "Congratulations! Look at your ‘Hello World’ transaction in the Solana Explorer: https://explorer.solana.com/tx/{}?cluster=custom",
        tx_hash
    );
}
