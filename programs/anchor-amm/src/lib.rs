use anchor_lang::prelude::*;

declare_id!("ArFY5WmLTSRE8mqPKXbLew4NZ11LceAmnJ7KfHRQ7fDp");

#[program]
pub mod anchor_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
