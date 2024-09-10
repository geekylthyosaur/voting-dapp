use std::str::FromStr;

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    native_token::LAMPORTS_PER_SOL,
    program,
    pubkey::Pubkey,
    system_instruction,
};

solana_program::entrypoint!(process_instruction);

#[derive(BorshDeserialize, Debug)]
#[non_exhaustive]
enum InstructionData {
    CreatePoll(Poll),
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
struct Poll {
    question: String,
}

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = InstructionData::try_from_slice(instruction_data).unwrap();

    match instruction {
        InstructionData::CreatePoll(poll) => create_poll(accounts, &poll)?,
    };

    Ok(())
}

fn create_poll(accounts: &[AccountInfo], poll: &Poll) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let new_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let mut account_data = Vec::new();
    poll.serialize(&mut account_data).unwrap();
    let account_size = account_data.len() as u64;
    let account_owner = Pubkey::from_str("B3pBndkF5cN36QZ1EqoRigRayVKRx5Dz1XMj6xXSFxBZ").unwrap();

    program::invoke(
        &system_instruction::create_account(
            payer.key,
            new_account.key,
            LAMPORTS_PER_SOL,
            account_size,
            &account_owner,
        ),
        &[payer.clone(), new_account.clone(), system_program.clone()],
    )?;

    new_account.data.borrow_mut()[..account_data.len()].copy_from_slice(&account_data);

    Ok(())
}
