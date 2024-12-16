use std::str::FromStr;

use borsh::BorshDeserialize;
use common::{
    state::{Poll, VoteType},
    ProgramInstruction,
};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    hash::Hash,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{read_keypair_file, Keypair, Signer},
    system_program,
    transaction::Transaction,
};

fn main() {
    let vote_type = parse_args().expect("Error: expected argument GM/GN");

    let program_id = Pubkey::from_str(env!("PROGRAM_ID")).unwrap();
    let rpc_url = "http://localhost:8899";
    let rpc_client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());
    let poll = read_keypair_file("./poll.json").unwrap();
    let poll_id = poll.pubkey();
    let payer = read_keypair_file("/home/dmytro/.config/solana/id.json").unwrap();

    if rpc_client.get_account(&poll_id).is_err() {
        println!("Poll does not exist, creating...");

        let rent_exemtion = rpc_client
            .get_minimum_balance_for_rent_exemption(Poll::SIZE)
            .unwrap();
        let latest_blockhash = rpc_client.get_latest_blockhash().unwrap();
        let tx = create_poll_tx(program_id, &payer, &poll, rent_exemtion, latest_blockhash);
        rpc_client.send_and_confirm_transaction(&tx).unwrap();

        println!("Poll created: {}", poll_id);
    } else if let Ok(data) = rpc_client.get_account_data(&poll_id) {
        let poll = Poll::try_from_slice(&data).unwrap();
        println!("{poll:?}");
    }

    let latest_blockhash = rpc_client.get_latest_blockhash().unwrap();
    let tx = vote_tx(program_id, &payer, poll_id, latest_blockhash, vote_type);
    let tx_sig = rpc_client.send_and_confirm_transaction(&tx).unwrap();

    println!("https://explorer.solana.com/tx/{}?cluster=custom", tx_sig);
}

fn parse_args() -> Option<VoteType> {
    if let Some(s) = std::env::args().nth(1).as_ref() {
        match s.as_str() {
            "gm" => Some(VoteType::GM),
            "gn" => Some(VoteType::GN),
            _ => None,
        }
    } else {
        None
    }
}

fn create_poll_tx(
    program_id: Pubkey,
    payer: &Keypair,
    poll: &Keypair,
    rent: u64,
    latest_blockhash: Hash,
) -> Transaction {
    let ix = ProgramInstruction::CreatePoll { rent };
    let accounts = vec![
        AccountMeta::new_readonly(payer.pubkey(), true),
        AccountMeta::new(poll.pubkey(), true),
        AccountMeta::new_readonly(system_program::ID, false),
    ];
    let ix = Instruction::new_with_borsh(program_id, &ix, accounts);

    Transaction::new_signed_with_payer(
        &[ix],
        Some(&payer.pubkey()),
        &[&payer, &poll],
        latest_blockhash,
    )
}

fn vote_tx(
    program_id: Pubkey,
    payer: &Keypair,
    poll_id: Pubkey,
    latest_blockhash: Hash,
    vote_type: VoteType,
) -> Transaction {
    let vote = ProgramInstruction::Vote(vote_type);
    let accounts = vec![AccountMeta::new(poll_id, false)];
    let ix = Instruction::new_with_borsh(program_id, &vote, accounts);

    Transaction::new_signed_with_payer(&[ix], Some(&payer.pubkey()), &[payer], latest_blockhash)
}
