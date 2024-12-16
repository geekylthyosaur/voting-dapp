use borsh::{BorshDeserialize, BorshSerialize};
use common::{
    state::{Poll, VoteType},
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
        ProgramInstruction::CreatePoll { rent } => {
            msg!("CreatePoll");
            create_poll(program_id, accounts, rent)?;
        }
        ProgramInstruction::Vote(t) => {
            msg!("Vote");
            vote(program_id, accounts, t)?;
        }
    };

    Ok(())
}

fn create_poll(program_id: &Pubkey, accounts: &[AccountInfo], rent: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let poll = next_account_info(accounts_iter)?;

    let ix = create_poll_ix(program_id, payer.key, poll.key, rent);

    invoke(&ix, accounts)?;
    Ok(())
}

fn vote(program_id: &Pubkey, accounts: &[AccountInfo], vote_type: VoteType) -> ProgramResult {
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

    if poll_account.data_len() < Poll::SIZE {
        msg!(
            "Poll account too small ({} < {})",
            poll_account.data_len(),
            Poll::SIZE
        );
        return Err(ProgramError::InvalidAccountData);
    }

    let mut poll = Poll::try_from_slice(&poll_account.data.borrow()).unwrap();
    poll.vote(vote_type);
    poll.serialize(&mut &mut poll_account.data.borrow_mut()[..])
        .unwrap();

    Ok(())
}
