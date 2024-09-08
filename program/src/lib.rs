use borsh::BorshDeserialize;
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

solana_program::entrypoint!(process_instruction);

#[derive(BorshDeserialize, Debug)]
enum InstructionData {
    Msg(String),
}

pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = InstructionData::try_from_slice(instruction_data).unwrap();

    let InstructionData::Msg(msg) = instruction;
    solana_program::msg!(&msg);

    Ok(())
}
