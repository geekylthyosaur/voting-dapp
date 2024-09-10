use std::str::FromStr;

use borsh::{BorshDeserialize, BorshSerialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_program,
    transaction::Transaction,
};

#[derive(BorshDeserialize, BorshSerialize, Debug)]
#[non_exhaustive]
enum InstructionData {
    CreatePoll(Poll),
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
struct Poll {
    question: String,
}

fn main() {
    let program_id = Pubkey::from_str("B3pBndkF5cN36QZ1EqoRigRayVKRx5Dz1XMj6xXSFxBZ").unwrap();

    let connection =
        RpcClient::new_with_commitment("http://localhost:8899", CommitmentConfig::confirmed());

    let keypair = read_keypair_file("/home/dmytro/.config/solana/id.json").unwrap();

    let blockhash_info = connection.get_latest_blockhash().unwrap();

    let poll = Poll {
        question: "How are you doing?".to_string(),
    };
    let instruction_data = InstructionData::CreatePoll(poll);
    let mut bytes = Vec::new();
    instruction_data.serialize(&mut bytes).unwrap();

    let payer_pubkey = keypair.pubkey();
    let new_account = Keypair::new();
    let system_program_id = system_program::id();

    let accounts = vec![
        AccountMeta::new(payer_pubkey, true),
        AccountMeta::new(new_account.pubkey(), true),
        AccountMeta::new_readonly(system_program_id, false),
    ];

    let mut transaction = Transaction::new_with_payer(
        &[Instruction::new_with_bytes(program_id, &bytes, accounts)],
        Some(&keypair.pubkey()),
    );

    transaction
        .try_sign(&[&keypair, &new_account], blockhash_info)
        .unwrap();

    let tx_hash = connection
        .send_and_confirm_transaction(&transaction)
        .unwrap();

    println!("https://explorer.solana.com/tx/{}?cluster=custom", tx_hash);
}
