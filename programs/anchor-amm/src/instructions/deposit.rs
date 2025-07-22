use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint,TokenAccount,TokenInterface}};

use crate::states::Pool;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_x: InterfaceAccount<'info,Mint>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_y: InterfaceAccount<'info,Mint>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.pool_bump
    )]
    pub pool:Account<'info,Pool>,
    
    #[account(
        mut,
        seeds = [ b"lp",pool.key().as_ref()],
        bump = pool.lp_bump
    )]
    pub mint_lp: InterfaceAccount<'info,Mint>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_program
    )]
    pub vault_x: InterfaceAccount<'info,TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = pool,
        associated_token::token_program = token_program
    )]
    pub vault_y: InterfaceAccount<'info,TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_x,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_vault_x: InterfaceAccount<'info,TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_y,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_vault_y: InterfaceAccount<'info,TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint_lp,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_lp_ata: InterfaceAccount<'info,TokenAccount>,

    pub associated_token_program: Program<'info,AssociatedToken>,
    pub system_program: Program<'info,System>,
    pub token_program: Interface<'info,TokenInterface>
}

impl<'info> Deposit<'info> {
    fn deposit(
        &mut self,
        amount: u64,
        max_x: u64,
        max_y: u64
    ) -> Result<()> {
        let (amount_x, amount_y, amount_lp) = if self.vault_x.amount == 0 && self.vault_y.amount == 0 {
            let k = max_x.checked_mul(max_y).ok_or(ProgramError::ArithmeticOverflow)?;
            (max_x,max_y,k)
        } else {
            let k = (self.vault_x.amount as u128).checked_mul(self.vault_y.amount as u128).ok_or(ProgramError::ArithmeticOverflow)?;

            let k2: u128 = k.checked_add(amount as u128).ok_or(ProgramError::ArithmeticOverflow)?;
            let ratio = k2.checked_mul(1000000).ok_or(ProgramError::ArithmeticOverflow)?.checked_div(k).ok_or(ProgramError::ArithmeticOverflow)?;
            let amount_x: u64 = ratio.checked_mul(self.vault_x.amount.into()).ok_or(ProgramError::ArithmeticOverflow)?.checked_div(1000000).ok_or(ProgramError::ArithmeticOverflow)?.checked_sub(self.vault_x.amount.into())
                .ok_or(ProgramError::ArithmeticOverflow)?
            .try_into().map_err(|_| ProgramError::ArithmeticOverflow)?;

            let amount_y: u64 = ratio.checked_mul(self.vault_y.amount.into()).ok_or(ProgramError::ArithmeticOverflow)?.checked_div(1000000).ok_or(ProgramError::ArithmeticOverflow)?.checked_sub(self.vault_y.amount.into())
            .ok_or(ProgramError::ArithmeticOverflow)?
            .try_into().map_err(|_| ProgramError::ArithmeticOverflow)?;

            // check slippage A
            require_gt!(max_x,amount_x);

            //check slippage B
            require_gt!(max_y,amount_y);
            (amount_x, amount_y, amount)
        };


        Ok(())
    }
}