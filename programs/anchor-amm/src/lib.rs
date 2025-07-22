use anchor_lang::prelude::*;

declare_id!("H9rcsbqoe1LXXzJwZKYj8Amfz32xHpYEvD4Bf5qkFw64");

pub mod states;
pub mod instructions;
pub use instructions::*;

#[program]
pub mod anchor_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}