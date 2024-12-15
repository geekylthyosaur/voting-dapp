use borsh::{BorshDeserialize, BorshSerialize};

use super::state::VoteType;

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub enum Instruction {
    Vote(VoteType),
}
