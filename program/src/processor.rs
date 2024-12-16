use borsh::{BorshDeserialize, BorshSerialize};
use common::{
    state::{Poll, Vote},
    ProgramInstruction,
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::state::create_poll_ix;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction: ProgramInstruction,
) -> ProgramResult {
    match instruction {
        ProgramInstruction::CreatePoll { poll, rent } => {
            msg!("CreatePoll");
            create_poll(program_id, accounts, poll, rent)?;
        }
        ProgramInstruction::Vote(t) => {
            msg!("Vote");
            vote(program_id, accounts, t)?;
        }
    };

    Ok(())
}

fn create_poll(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    poll: Poll,
    rent: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let poll_acc = next_account_info(accounts_iter)?;

    let size = poll.size();
    let ix = create_poll_ix(program_id, payer.key, poll_acc.key, rent, size);
    invoke(&ix, accounts)?;

    poll.serialize(&mut *poll_acc.data.borrow_mut()).unwrap();

    Ok(())
}

fn vote(program_id: &Pubkey, accounts: &[AccountInfo], vote: Vote) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let poll_account = next_account_info(accounts_iter)?;

    if poll_account.owner != program_id {
        msg!(
            "Poll account is not owned by the program ({} != {})",
            poll_account.owner,
            program_id
        );
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut poll = Poll::try_from_slice(&poll_account.data.borrow()).unwrap();
    poll.vote(vote);
    poll.serialize(&mut *poll_account.data.borrow_mut())
        .unwrap();

    Ok(())
}
