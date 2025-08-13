use anchor_lang::prelude::*;

declare_id!("ArFY5WmLTSRE8mqPKXbLew4NZ11LceAmnJ7KfHRQ7fDp");

pub mod errors;
pub mod instructions;
pub mod states;

pub use errors::*;
pub use instructions::*;
pub use states::Amm;

#[program]
pub mod anchor_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee: u16, authority: Option<Pubkey>) -> Result<()> {
        ctx.accounts.initialize(fee, authority, &ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)?;
        Ok(())
    }
}
