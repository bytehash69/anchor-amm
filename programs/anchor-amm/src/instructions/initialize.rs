use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::Amm;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        space = 8 + Amm::INIT_SPACE,
        seeds = [b"amm"],
        bump
    )]
    pub amm: Account<'info, Amm>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = amm.key(),
        seeds = [b"lp", amm.key().as_ref()],
        bump
    )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_x,
        associated_token::authority = amm,
        associated_token::token_program = token_program
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint_y,
        associated_token::authority = amm,
        associated_token::token_program = token_program
    )]
    pub vault_y: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(
        &mut self,
        fee: u16,
        authority: Option<Pubkey>,
        bumps: &InitializeBumps,
    ) -> Result<()> {
        self.amm.set_inner(Amm {
            authority: authority,
            mint_x: self.mint_x.key(),
            mint_y: self.mint_y.key(),
            fee,
            amm_bump: bumps.amm,
            lp_bump: bumps.mint_lp,
        });
        Ok(())
    }
}
