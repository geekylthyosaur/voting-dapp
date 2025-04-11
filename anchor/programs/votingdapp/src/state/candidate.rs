use anchor_lang::prelude::*;

use crate::error::Error;

const CANDIDATE_NAME_MAX_LEN: usize = 32;

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(CANDIDATE_NAME_MAX_LEN)]
    pub name: String,
    votes_count: u64,
}

impl Candidate {
    pub fn new(name: String) -> Result<Self> {
        let name = if name.len() > CANDIDATE_NAME_MAX_LEN || name.is_empty() {
            return Err(Error::InvalidCandidateName)?;
        } else {
            name
        };

        Ok(Self {
            name,
            votes_count: 0,
        })
    }

    pub fn vote(&mut self) {
        self.votes_count += 1;
    }
}
