#![allow(clippy::result_large_err)]
#![warn(clippy::pedantic)]

use anchor_lang::prelude::*;
use instructions::create_poll::*;
use instructions::vote::*;

mod error;
mod instructions;
mod state;

declare_id!("2VmZhuN5W39i28vzqPiJzV9WovoegLghrdJrzSwsS7at");

#[program]
pub mod votingdapp {
    use super::*;

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        name: String,
        description: String,
        timestamp: u64,
        candidates: Vec<String>,
    ) -> Result<()> {
        handle_create_poll(ctx, name, description, timestamp, candidates)
    }

    pub fn vote(ctx: Context<Vote>, name: String, candidate: String) -> Result<()> {
        _ = name;
        handle_vote(ctx, candidate)
    }
}
