mod entrypoint {
    use super::instruction;

    use borsh::BorshDeserialize;
    use solana_program::{
        account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey,
    };

    solana_program::entrypoint!(process_instruction);

    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = instruction::Instruction::try_from_slice(instruction_data).unwrap();

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

mod instruction {
    use borsh::BorshDeserialize;

    use super::state::VoteType;

    #[derive(BorshDeserialize, Debug)]
    #[non_exhaustive]
    pub enum Instruction {
        Vote(VoteType),
    }
}

mod state {
    use borsh::{BorshDeserialize, BorshSerialize};

    #[derive(BorshDeserialize, BorshSerialize, Clone, Copy, Debug)]
    pub struct Poll {
        gm: u64,
        gn: u64,
    }

    impl Poll {
        pub const SIZE: usize = 16;

        pub fn vote(&mut self, vote: VoteType) {
            match vote {
                VoteType::GM => self.gm += 1,
                VoteType::GN => self.gn += 1,
            }
        }
    }

    #[derive(BorshDeserialize, BorshSerialize, Clone, Copy, Debug)]
    pub enum VoteType {
        GM,
        GN,
    }
}

mod processor {
    use borsh::{BorshDeserialize, BorshSerialize};
    use solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    };

    use crate::{instruction::Instruction, state::Poll};

    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction: Instruction,
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
            Instruction::Vote(t) => {
                poll.vote(t);
            }
        };

        poll.serialize(&mut &mut account.data.borrow_mut()[..])
            .unwrap();

        Ok(())
    }
}
