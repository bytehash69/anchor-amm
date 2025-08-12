use anchor_lang::prelude::*;

declare_id!("ArFY5WmLTSRE8mqPKXbLew4NZ11LceAmnJ7KfHRQ7fDp");

pub mod instructions;
pub mod states;

pub use instructions::*;
pub use states::Amm;

#[program]
pub mod anchor_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16, authority: Option<Pubkey>) -> Result<()> {
        ctx.accounts.Initialize(fee, authority, &ctx.bumps)?;
        Ok(())
    }
}
