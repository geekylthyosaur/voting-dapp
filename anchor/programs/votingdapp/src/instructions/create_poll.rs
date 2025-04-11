use anchor_lang::prelude::*;

use crate::error::Error;
use crate::state::poll::Poll;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        init_if_needed, 
        payer = signer, 
        space = 8 + Poll::INIT_SPACE, 
        seeds = [b"poll".as_ref(), name.as_ref()], 
        bump
    )]
    poll: Account<'info, Poll>,
    system_program: Program<'info, System>,
}

pub fn handle_create_poll(
    ctx: Context<CreatePoll>,
    name: String,
    description: String,
    candidates: Vec<String>,
) -> Result<()> {
    let account = &mut ctx.accounts.poll;

    require!(account.is_empty(), Error::PollAlreadyExists);

    account.create(name, description, candidates)?;

    Ok(())
}

