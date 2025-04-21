use anchor_lang::prelude::*;

use crate::error::Error;
use crate::state::candidate::Candidate;

const POLL_NAME_MAX_LEN: usize = 32;
const POLL_DESCRIPTION_MAX_LEN: usize = 64;
const POLL_CANDIDATES_MAX_LEN: usize = 8;

#[account]
#[derive(InitSpace)]
pub struct Poll {
    #[max_len(POLL_NAME_MAX_LEN)]
    name: String,
    #[max_len(POLL_DESCRIPTION_MAX_LEN)]
    description: String,
    timestamp: u64,
    #[max_len(POLL_CANDIDATES_MAX_LEN)]
    candidates: Vec<Candidate>,
}

impl Poll {
    pub fn create(
        &mut self,
        name: String,
        description: String,
        timestamp: u64,
        candidates: Vec<String>,
    ) -> Result<()> {
        self.name = if name.len() > POLL_NAME_MAX_LEN || name.is_empty() {
            return Err(Error::InvalidPollName)?;
        } else {
            name
        };

        self.description = if description.len() > POLL_DESCRIPTION_MAX_LEN {
            return Err(Error::InvalidPollDescription)?;
        } else {
            description
        };

        self.timestamp = timestamp;

        let candidates = candidates
            .into_iter()
            .map(Candidate::new)
            .collect::<Result<Vec<_>>>()?;
        self.candidates = if candidates.len() > POLL_CANDIDATES_MAX_LEN {
            return Err(Error::InvalidCandidatesCount)?;
        } else {
            candidates
        };

        Ok(())
    }

    pub fn vote(&mut self, candidate: String) -> Result<()> {
        self.candidates
            .iter_mut()
            .find(|c| c.name == candidate)
            .ok_or(Error::CandidateNotFound)?
            .vote();

        Ok(())
    }

    pub fn is_open(&self) -> Result<bool> {
        let now = Clock::get()?.unix_timestamp;
        Ok(now as u64 <= self.timestamp)
    }

    pub fn is_empty(&self) -> bool {
        self.name.is_empty() && self.description.is_empty() && self.candidates.is_empty()
    }
}
