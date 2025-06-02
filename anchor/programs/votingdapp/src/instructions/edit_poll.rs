use anchor_lang::prelude::*;

use crate::error::Error;
use crate::state::poll::Poll;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct EditPoll<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"poll".as_ref(), name.as_ref()], 
        bump
    )]
    poll: Account<'info, Poll>,
    system_program: Program<'info, System>,
}

pub fn handle_edit_poll(ctx: Context<EditPoll>, timestamp: u64) -> Result<()> {
    let poll = &mut ctx.accounts.poll;

    poll.edit(timestamp)?;

    Ok(())
}
