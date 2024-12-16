use borsh::{BorshDeserialize, BorshSerialize};

use crate::state::Poll;

use super::state::Vote;

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub enum Instruction {
    CreatePoll { poll: Poll, rent: u64 },
    Vote(Vote),
}
