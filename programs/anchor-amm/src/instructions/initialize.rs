use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::states::Pool;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_x: InterfaceAccount<'info, Mint>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_y: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = pool,
        mint::token_program = token_program,
        seeds = [ b"lp",pool.key().as_ref()],
        bump
    )]
    pub mint_lp: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_program
    )]
    pub vault_x: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_program
    )]
    pub vault_y: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, fee: u16, pool_bump: u8, lp_bump: u8) -> Result<()> {
        self.pool.set_inner(Pool {
            mint_x: self.mint_x.key(),
            mint_y: self.mint_y.key(),
            fee,
            pool_bump: pool_bump,
            lp_bump: lp_bump,
        });
        Ok(())
    }
}
