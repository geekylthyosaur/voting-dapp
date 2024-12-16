use borsh::BorshDeserialize;
use common::ProgramInstruction;
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, msg, pubkey::Pubkey};

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
