use borsh::BorshDeserialize;
use common::{
    state::{Poll, Vote},
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
    let vote = parse_args().expect("Error: expected argument");

    let program = read_keypair_file("../program/program-id.json").unwrap();
    let program_id = program.pubkey();
    let rpc_url = "http://localhost:8899";
    let rpc_client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());
    let poll = read_keypair_file("./poll.json").unwrap();
    let poll_id = poll.pubkey();
    let payer = read_keypair_file("/home/dmytro/.config/solana/id.json").unwrap();

    if rpc_client.get_account(&poll_id).is_err() {
        println!("Poll does not exist, creating...");

        let new_poll = Poll::new()
            .with_title("Hello")
            .with_options(vec!["Bob", "Cat"]);
        let rent = rpc_client
            .get_minimum_balance_for_rent_exemption(new_poll.size() as usize)
            .unwrap();
        let ix = ProgramInstruction::CreatePoll {
            poll: new_poll,
            rent,
        };
        let latest_blockhash = rpc_client.get_latest_blockhash().unwrap();
        let tx = create_poll_tx(program_id, &payer, &poll, ix, latest_blockhash);
        rpc_client.send_and_confirm_transaction(&tx).unwrap();

        println!("Poll created: {}", poll_id);
    } else if let Ok(data) = rpc_client.get_account_data(&poll_id) {
        let poll = Poll::try_from_slice(&data).unwrap();
        println!("{poll:?}");
    }

    let ix = ProgramInstruction::Vote(vote);
    let latest_blockhash = rpc_client.get_latest_blockhash().unwrap();
    let tx = vote_tx(program_id, &payer, poll_id, ix, latest_blockhash);
    let tx_sig = rpc_client.send_and_confirm_transaction(&tx).unwrap();

    println!("https://explorer.solana.com/tx/{}?cluster=custom", tx_sig);
}

fn parse_args() -> Option<Vote> {
    if let Some(s) = std::env::args().nth(1).as_ref() {
        s.parse::<u8>().map(Vote::from).ok()
    } else {
        None
    }
}

fn create_poll_tx(
    program_id: Pubkey,
    payer: &Keypair,
    poll: &Keypair,
    ix: ProgramInstruction,
    latest_blockhash: Hash,
) -> Transaction {
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
    ix: ProgramInstruction,
    latest_blockhash: Hash,
) -> Transaction {
    let accounts = vec![AccountMeta::new(poll_id, false)];
    let ix = Instruction::new_with_borsh(program_id, &ix, accounts);

    Transaction::new_signed_with_payer(&[ix], Some(&payer.pubkey()), &[payer], latest_blockhash)
}
