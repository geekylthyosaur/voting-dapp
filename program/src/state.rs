use common::state::Poll;
use solana_program::{instruction::Instruction, pubkey::Pubkey, system_instruction};

pub fn create_poll_ix(
    program_id: &Pubkey,
    payer_id: &Pubkey,
    poll_id: &Pubkey,
    rent: u64,
) -> Instruction {
    system_instruction::create_account(payer_id, poll_id, rent, Poll::SIZE as u64, program_id)
}
