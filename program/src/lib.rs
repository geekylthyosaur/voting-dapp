mod entrypoint {
    use borsh::BorshDeserialize;
    use common::ProgramInstruction;
    use solana_program::{
        account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey,
    };

    solana_program::entrypoint!(process_instruction);

    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = ProgramInstruction::try_from_slice(instruction_data).unwrap();

        msg!(
            "{{ ProgramId({}), {}, {:?} }}",
            program_id,
            accounts.len(),
            instruction
        );

        super::processor::process_instruction(program_id, accounts, instruction)?;

        Ok(())
    }
}

mod processor {
    use borsh::{BorshDeserialize, BorshSerialize};
    use common::{state::Poll, ProgramInstruction};
    use solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    };

    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction: ProgramInstruction,
    ) -> ProgramResult {
        let accounts_iter = &mut accounts.iter();

        let account = next_account_info(accounts_iter)?;

        if account.owner != program_id {
            msg!(
                "Poll account is not owned by the program ({} != {})",
                account.owner,
                program_id
            );
            return Err(ProgramError::IncorrectProgramId);
        }

        if account.data_len() < Poll::SIZE {
            msg!(
                "Poll account too small ({} < {})",
                account.data_len(),
                Poll::SIZE
            );
            return Err(ProgramError::InvalidAccountData);
        }

        let mut poll = Poll::try_from_slice(&account.data.borrow()).unwrap();

        match instruction {
            ProgramInstruction::Vote(t) => {
                poll.vote(t);
            }
        };

        poll.serialize(&mut &mut account.data.borrow_mut()[..])
            .unwrap();

        Ok(())
    }
}
