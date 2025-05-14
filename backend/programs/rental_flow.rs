use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use item_registration::ItemAccount;
use item_registration::cpi::accounts::SetItemAvailabilityCpiAccounts as ItemRegSetAvailabilityAccounts;
use item_registration::cpi::set_item_availability as item_reg_set_availability;
use item_registration::program::ItemRegistration as ItemRegistrationProgram;
use std::str::FromStr;

// USDC mint address on Devnet
// const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Replace with your real program ID
declare_id!("6XqPznLJiGdqzD4FkD9yQGMN2XQb1fLXL1UKfwq8kgPQ");

// Add a constant for the system (platform) revenue address (replace with your real address)
const SYSTEM_REVENUE_ADDRESS: &str = "6YDGTnmBDe34SYeziSbsVP6ss5ogWREHXec87CJu7Hos";

#[program]
pub mod rental_flow {
    use super::*;

    pub fn initiate_rental(
        ctx: Context<InitiateRental>,
        hours: u64,
        start_time: i64,
    ) -> Result<()> {
        // Input validation
        require!(start_time >= Clock::get()?.unix_timestamp, ErrorCode::InvalidStartTime);
        require!(hours > 0, ErrorCode::InvalidRentalDuration);

        // Item availability check
        require!(ctx.accounts.item_account.is_available, ErrorCode::ItemNotAvailable);

        let rental = &mut ctx.accounts.rental_transaction;
        let item = &ctx.accounts.item_account;
        let total_price = calculate_total_price(item.price_per_hour, item.price_per_day, hours)?;
        rental.item = item.key();
        rental.renter = ctx.accounts.renter.key();
        rental.owner = ctx.accounts.owner.key();
        rental.start_time = start_time;
        let duration_seconds = (hours as i64).checked_mul(3600).ok_or(ErrorCode::ArithmeticOverflow)?;
        rental.end_time = start_time.checked_add(duration_seconds).ok_or(ErrorCode::ArithmeticOverflow)?;
        rental.total_price = total_price;
        rental.is_active = true;
        rental.is_completed = false;

        // Transfer USDC from renter to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.renter_usdc.to_account_info(),
            to: ctx.accounts.escrow_usdc.to_account_info(),
            authority: ctx.accounts.renter.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_price)?;

        // CPI to item_registration to set item as unavailable
        let cpi_program = ctx.accounts.item_registration_program.to_account_info();
        let cpi_accounts = ItemRegSetAvailabilityAccounts {
            item_account: ctx.accounts.item_account.to_account_info(),
            owner: ctx.accounts.owner.to_account_info(), // Owner of the item_account
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        item_reg_set_availability(cpi_ctx, false)?; // false for unavailable

        Ok(())
    }

    pub fn complete_rental(ctx: Context<CompleteRental>) -> Result<()> {
        // Validate system_usdc account owner matches SYSTEM_REVENUE_ADDRESS
        let expected_system_pubkey = Pubkey::from_str(SYSTEM_REVENUE_ADDRESS).map_err(|_| ErrorCode::InvalidSystemAccount)?;
        require_keys_eq!(ctx.accounts.system_usdc.owner, expected_system_pubkey, ErrorCode::InvalidSystemAccount);
        // Validate system_usdc account mint matches usdc_mint
        require_keys_eq!(ctx.accounts.system_usdc.mint, ctx.accounts.usdc_mint.key(), ErrorCode::InvalidSystemAccount);

        // Pre-read immutable data from rental_transaction before mutable borrow
        let renter_key_for_pda_val = ctx.accounts.rental_transaction.renter;
        let rental_transaction_account_info = ctx.accounts.rental_transaction.to_account_info();
        let total_price_val = ctx.accounts.rental_transaction.total_price;

        let rental = &mut ctx.accounts.rental_transaction;
        require!(rental.is_active && !rental.is_completed, ErrorCode::InvalidRentalState);
        require!(Clock::get()?.unix_timestamp >= rental.end_time, ErrorCode::RentalNotYetConcluded);

        // Calculate platform fee and owner amount (10% to system, 90% to owner)
        let system_fee = total_price_val.checked_mul(10).ok_or(ErrorCode::ArithmeticOverflow)?.checked_div(100).ok_or(ErrorCode::ArithmeticOverflow)?;
        let owner_amount = total_price_val.checked_sub(system_fee).ok_or(ErrorCode::ArithmeticOverflow)?;

        // Seeds for the rental_transaction PDA, which is the authority for escrow_usdc
        let item_key_for_pda = ctx.accounts.item_account.key(); // Key used in PDA seeds definition for rental_transaction
        let bump = ctx.bumps.rental_transaction; // Bump for the rental_transaction PDA
        let seeds = &[
            b"rental_transaction".as_ref(),
            item_key_for_pda.as_ref(),
            renter_key_for_pda_val.as_ref(), // Use pre-read value
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer 90% USDC from escrow_usdc to owner_usdc
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_usdc.to_account_info(),
                    to: ctx.accounts.owner_usdc.to_account_info(),
                    authority: rental_transaction_account_info.clone(),
                },
                signer_seeds,
            ),
            owner_amount,
        )?;

        // Transfer 10% USDC from escrow_usdc to system_usdc
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_usdc.to_account_info(),
                    to: ctx.accounts.system_usdc.to_account_info(),
                    authority: rental_transaction_account_info.clone(),
                },
                signer_seeds,
            ),
            system_fee,
        )?;

        // Close the escrow USDC account, funds go to owner
        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::CloseAccount {
                    account: ctx.accounts.escrow_usdc.to_account_info(),
                    destination: ctx.accounts.owner.to_account_info(), // Rent goes to owner
                    authority: rental_transaction_account_info.clone(),
                },
                signer_seeds,
            )
        )?;

        rental.is_active = false;
        rental.is_completed = true;

        // CPI to item_registration to set item as available
        let cpi_program = ctx.accounts.item_registration_program.to_account_info();
        let cpi_accounts = ItemRegSetAvailabilityAccounts {
            item_account: ctx.accounts.item_account.to_account_info(),
            owner: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        item_reg_set_availability(cpi_ctx, true)?; // true for available

        Ok(())
    }

    pub fn cancel_rental(ctx: Context<CancelRental>) -> Result<()> {
        // Pre-read immutable data from rental_transaction before mutable borrow
        let rental_transaction_account_info = ctx.accounts.rental_transaction.to_account_info();
        let total_price_val = ctx.accounts.rental_transaction.total_price;

        let rental = &mut ctx.accounts.rental_transaction;
        require!(rental.is_active && !rental.is_completed, ErrorCode::InvalidRentalState);

        // Seeds for the rental_transaction PDA, which is the authority for escrow_usdc
        let item_key_for_pda = ctx.accounts.item_account.key(); // Key used in PDA seeds definition for rental_transaction
        let renter_key_for_pda = ctx.accounts.renter.key(); // Renter signer's key used in PDA seeds definition
        let bump = ctx.bumps.rental_transaction; // Bump for the rental_transaction PDA
        let seeds = &[
            b"rental_transaction".as_ref(),
            item_key_for_pda.as_ref(),
            renter_key_for_pda.as_ref(), // This remains as is, not from rental_transaction data
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer USDC from escrow_usdc back to renter_usdc
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_usdc.to_account_info(),
                    to: ctx.accounts.renter_usdc.to_account_info(),
                    authority: rental_transaction_account_info.clone(), // Use pre-read value
                },
                signer_seeds,
            ),
            total_price_val, // Use pre-read value
        )?;

        // Close the escrow USDC account, funds go to renter
        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::CloseAccount {
                    account: ctx.accounts.escrow_usdc.to_account_info(),
                    destination: ctx.accounts.renter.to_account_info(), // Rent goes back to renter
                    authority: rental_transaction_account_info.clone(), // Use pre-read value
                },
                signer_seeds,
            )
        )?;

        rental.is_active = false;

        // CPI to item_registration to set item as available
        let cpi_program = ctx.accounts.item_registration_program.to_account_info();
        let cpi_accounts = ItemRegSetAvailabilityAccounts {
            item_account: ctx.accounts.item_account.to_account_info(),
            owner: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        item_reg_set_availability(cpi_ctx, true)?; // true for available

        Ok(())
    }
}

#[account]
pub struct RentalTransaction {
    pub item: Pubkey,
    pub renter: Pubkey,
    pub owner: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub total_price: u64,
    pub is_active: bool,
    pub is_completed: bool,
}

impl RentalTransaction {
    // 8 (discriminator) + 3*32 (Pubkeys) + 3*8 (u64/i64) + 2*1 (bools)
    pub const LEN: usize = 8 + (3 * 32) + (3 * 8) + (2 * 1);
}

#[derive(Accounts)]
pub struct InitiateRental<'info> {
    #[account(mut)]
    pub renter: Signer<'info>,
    // owner is the owner of the item_account and needs to sign for CPI to item_registration
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub item_account: Account<'info, ItemAccount>,
    #[account(init, payer = renter, space = RentalTransaction::LEN, seeds = [b"rental_transaction".as_ref(), item_account.key().as_ref(), renter.key().as_ref()], bump)]
    pub rental_transaction: Account<'info, RentalTransaction>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, token::mint = usdc_mint)] // Renter's USDC account, tokens are transferred from here
    pub renter_usdc: Account<'info, TokenAccount>,
    // owner_usdc is not strictly needed in InitiateRental if not used for transfers/checks here.
    // It's used in CompleteRental. For this audit, we remove it if unused in *this* instruction.
    // pub owner_usdc: Account<'info, TokenAccount>,
    #[account(init, payer = renter, associated_token::mint = usdc_mint, associated_token::authority = rental_transaction)] // Escrow's USDC token account, initialized as ATA
    pub escrow_usdc: Account<'info, TokenAccount>,
    pub item_registration_program: Program<'info, ItemRegistrationProgram>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct CompleteRental<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"rental_transaction".as_ref(), item_account.key().as_ref(), rental_transaction.renter.as_ref()], bump)]
    pub rental_transaction: Account<'info, RentalTransaction>,
    #[account(mut)]
    pub item_account: Account<'info, ItemAccount>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, token::mint = usdc_mint)] // Owner's USDC account, tokens are received here
    pub owner_usdc: Account<'info, TokenAccount>,
    #[account(mut, token::mint = usdc_mint)] // System's USDC account, receives platform fee
    pub system_usdc: Account<'info, TokenAccount>,
    #[account(mut, close = owner, token::mint = usdc_mint)] // Escrow's USDC token account
    pub escrow_usdc: Account<'info, TokenAccount>,
    pub item_registration_program: Program<'info, ItemRegistrationProgram>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelRental<'info> {
    #[account(mut)]
    pub renter: Signer<'info>,
    // Owner of the item_account, must be a signer for CPI to mark item available
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, seeds = [b"rental_transaction".as_ref(), item_account.key().as_ref(), renter.key().as_ref()], bump)]
    pub rental_transaction: Account<'info, RentalTransaction>,
    #[account(mut)]
    pub item_account: Account<'info, ItemAccount>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, token::mint = usdc_mint)] // Renter's USDC account, tokens are returned here
    pub renter_usdc: Account<'info, TokenAccount>,
    #[account(mut, close = renter, token::mint = usdc_mint)] // Escrow's USDC token account
    pub escrow_usdc: Account<'info, TokenAccount>,
    pub item_registration_program: Program<'info, ItemRegistrationProgram>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid rental state")]
    InvalidRentalState,
    #[msg("Start time cannot be in the past")]
    InvalidStartTime,
    #[msg("Rental duration must be greater than zero hours")]
    InvalidRentalDuration,
    #[msg("Item is not available for rental")]
    ItemNotAvailable,
    // #[msg("Invalid escrow owner")] // Unused
    // InvalidEscrowOwner,
    // #[msg("Incorrect mint for token account")] // Unused as mint constraints are added
    // WrongMint,
    #[msg("Arithmetic operation overflowed")]
    ArithmeticOverflow,
    #[msg("Rental cannot be completed before its end time")]
    RentalNotYetConcluded,
    #[msg("Invalid system account for platform fee")]
    InvalidSystemAccount,
}

// Helper function for price calculation
fn calculate_total_price(price_per_hour: u64, price_per_day: u64, hours: u64) -> Result<u64> {
    let total_hour_price = price_per_hour.checked_mul(hours).ok_or(ErrorCode::ArithmeticOverflow)?;
    
    let days = hours / 24;
    let remaining_hours = hours % 24;
    
    let daily_rate_total = price_per_day.checked_mul(days).ok_or(ErrorCode::ArithmeticOverflow)?;
    let hourly_rate_for_remaining = price_per_hour.checked_mul(remaining_hours).ok_or(ErrorCode::ArithmeticOverflow)?;
    let total_day_price = daily_rate_total.checked_add(hourly_rate_for_remaining).ok_or(ErrorCode::ArithmeticOverflow)?;

    if total_hour_price > total_day_price {
        Ok(total_day_price)
    } else {
        Ok(total_hour_price)
    }
}