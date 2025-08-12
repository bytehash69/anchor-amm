use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Amm {
    pub authority: Option<Pubkey>,
    pub mint_x: Pubkey,
    pub mint_y: Pubkey,
    pub fee: u16,
    pub amm_bump: u8,
    pub lp_bump: u8,
}
