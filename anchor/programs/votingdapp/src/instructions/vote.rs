use anchor_lang::prelude::*;

use crate::error::Error;
use crate::state::{poll::Poll, voter::Voter};

#[derive(Accounts)]
#[instruction(name: String, candidate: String)]
pub struct Vote<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"poll".as_ref(), name.as_ref()], 
        bump
    )]
    poll: Account<'info, Poll>,
    #[account(
        init_if_needed, 
        payer = signer, 
        space = 8 + Voter::INIT_SPACE, 
        seeds = [b"voter".as_ref(), name.as_ref(), signer.key().as_ref()], 
        bump
    )]
    voter: Account<'info, Voter>,
    system_program: Program<'info, System>,
}

pub fn handle_vote(ctx: Context<Vote>, candidate: String) -> Result<()> {
    let signer = &mut ctx.accounts.signer;
    let poll = &mut ctx.accounts.poll;
    let voter = &mut ctx.accounts.voter;

    require!(voter.id != signer.key(), Error::AlreadyVoted);
    require!(poll.is_open()?, Error::VotingEnded);

    poll.vote(candidate)?;

    voter.id = signer.key();

    Ok(())
}
