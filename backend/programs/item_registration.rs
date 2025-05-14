use anchor_lang::prelude::*;

declare_id!("Dh1N1esPsvQdgakyM13S3CMFzT2jzDeKbNKerx1vK6Jw");

#[program]
pub mod item_registration {
    use super::*;

    // Constants for validation
    const MAX_NAME_LENGTH: usize = 60;
    const MAX_DESCRIPTION_LENGTH: usize = 250;
    const MAX_REGISTRY_ITEMS: usize = 1000; // Corresponds to ItemRegistry space allocation for item_ids
    const MAX_METADATA_URI_LENGTH: usize = 200; // Max length for metadata URI

    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.item_registry;
        registry.next_item_id = 0; // Initialize the next_item_id
        registry.item_ids = Vec::new();
        Ok(())
    }

    pub fn register_item(
        ctx: Context<RegisterItem>,
        name: String,
        description: String,
        price_per_hour: u64,
        price_per_day: u64,
        metadata_uri: String,
    ) -> Result<()> {
        // Input Validation
        // Check name length
        if name.len() > MAX_NAME_LENGTH {
            return err!(ErrorCode::NameTooLong);
        }
        // Check description length
        if description.len() > MAX_DESCRIPTION_LENGTH {
            return err!(ErrorCode::DescriptionTooLong);
        }
        // Check metadata_uri length
        if metadata_uri.len() > MAX_METADATA_URI_LENGTH {
            return err!(ErrorCode::MetadataUriTooLong);
        }
        // Check price validity
        if price_per_hour == 0 || price_per_day == 0 {
            return err!(ErrorCode::InvalidPrice);
        }

        let item_registry = &mut ctx.accounts.item_registry;
        let item_account = &mut ctx.accounts.item_account;
        let owner = ctx.accounts.owner.key();

        // Check if registry is full before adding a new item
        if item_registry.item_ids.len() >= MAX_REGISTRY_ITEMS {
            return err!(ErrorCode::RegistryFull);
        }

        // Increment next_item_id and assign new item_id
        item_registry.next_item_id += 1;
        let item_id = item_registry.next_item_id;
        item_registry.item_ids.push(item_id);

        // Store item data
        item_account.owner = owner;
        item_account.item_id = item_id;
        item_account.name = name;
        item_account.description = description;
        item_account.price_per_hour = price_per_hour;
        item_account.price_per_day = price_per_day;
        item_account.is_available = true;
        item_account.metadata_uri = metadata_uri;

        Ok(())
    }

    pub fn update_item(
        ctx: Context<UpdateItem>,
        name: Option<String>,
        description: Option<String>,
        price_per_hour: Option<u64>,
        price_per_day: Option<u64>,
        is_available: Option<bool>,
        metadata_uri: Option<String>,
    ) -> Result<()> {
        let item_account = &mut ctx.accounts.item_account;

        if let Some(n) = name {
            // Validate name length before updating
            if n.len() > MAX_NAME_LENGTH {
                return err!(ErrorCode::NameTooLong);
            }
            item_account.name = n;
        }
        if let Some(d) = description {
            // Validate description length before updating
            if d.len() > MAX_DESCRIPTION_LENGTH {
                return err!(ErrorCode::DescriptionTooLong);
            }
            item_account.description = d;
        }
        if let Some(pph) = price_per_hour {
            // Validate price before updating
            if pph == 0 {
                return err!(ErrorCode::InvalidPrice);
            }
            item_account.price_per_hour = pph;
        }
        if let Some(ppd) = price_per_day {
            // Validate price before updating
            if ppd == 0 {
                return err!(ErrorCode::InvalidPrice);
            }
            item_account.price_per_day = ppd;
        }
        if let Some(avail) = is_available { item_account.is_available = avail; }
        if let Some(uri) = metadata_uri {
            // Validate metadata_uri length before updating
            if uri.len() > MAX_METADATA_URI_LENGTH {
                return err!(ErrorCode::MetadataUriTooLong);
            }
            item_account.metadata_uri = uri;
        }
        Ok(())
    }

    pub fn remove_item(ctx: Context<RemoveItem>) -> Result<()> {
        let item_registry = &mut ctx.accounts.item_registry;
        let item_account = &ctx.accounts.item_account;
        let item_id = item_account.item_id;
        // Remove item_id from registry
        if let Some(pos) = item_registry.item_ids.iter().position(|&id| id == item_id) {
            item_registry.item_ids.swap_remove(pos);
        } else {
            // If item_id is not found in the list, return an error
            return err!(ErrorCode::ItemNotFound);
        }
        Ok(())
    }
    pub fn set_item_availability(ctx: Context<SetItemAvailabilityCpiAccounts>, available: bool) -> Result<()> {
        ctx.accounts.item_account.is_available = available;
        msg!("Item {} availability set to: {}", ctx.accounts.item_account.key(), available);
        Ok(())
    }

}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(init, payer = payer, space = 8 + 8 + 4 + 1000 * 8)]
    pub item_registry: Account<'info, ItemRegistry>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ItemAccount {
    pub owner: Pubkey,
    pub item_id: u64,
    pub name: String,        // Max 60 characters (enforced by MAX_NAME_LENGTH)
    pub description: String, // Max 250 characters (enforced by MAX_DESCRIPTION_LENGTH)
    pub price_per_hour: u64,
    pub price_per_day: u64,
    pub is_available: bool,
    pub metadata_uri: String,
}

#[account]
pub struct ItemRegistry {
    pub next_item_id: u64, // Stores the ID to be assigned to the next registered item
    // Stores item IDs. Capacity is limited by account size (currently MAX_REGISTRY_ITEMS, ~1000 items).
    pub item_ids: Vec<u64>,
}

#[derive(Accounts)]
pub struct RegisterItem<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space = 8 + 32 + 8 + 4 + 64 + 4 + 256 + 8 + 8 + 1 + 4 + 256)] // adjust space as needed
    pub item_account: Account<'info, ItemAccount>,
    #[account(mut)]
    pub item_registry: Account<'info, ItemRegistry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateItem<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner)]
    pub item_account: Account<'info, ItemAccount>,
}

#[derive(Accounts)]
pub struct RemoveItem<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut, has_one = owner, close = owner)]
    pub item_account: Account<'info, ItemAccount>,
    #[account(mut)]
    pub item_registry: Account<'info, ItemRegistry>,
}

#[derive(Accounts)]
pub struct SetItemAvailabilityCpiAccounts<'info> {
    #[account(mut, has_one = owner @ ErrorCode::Unauthorized)] // Ensure owner is the authority
    pub item_account: Account<'info, ItemAccount>,
    pub owner: Signer<'info>, // The owner of the item, must sign
}

impl ItemAccount {
    pub fn calculate_total_price(&self, hours: u64) -> Result<u64> {
        // Calculate price based on hours only
        let total_hour_price = self.price_per_hour.checked_mul(hours)
            .ok_or_else(|| error!(ErrorCode::PriceCalculationOverflow))?;

        // Calculate price based on days and remaining hours
        let days = hours / 24;
        let remaining_hours = hours % 24;

        let day_rate_total = self.price_per_day.checked_mul(days)
            .ok_or_else(|| error!(ErrorCode::PriceCalculationOverflow))?;
        let remaining_hour_rate_total = self.price_per_hour.checked_mul(remaining_hours)
            .ok_or_else(|| error!(ErrorCode::PriceCalculationOverflow))?;
        
        let total_day_price = day_rate_total.checked_add(remaining_hour_rate_total)
            .ok_or_else(|| error!(ErrorCode::PriceCalculationOverflow))?;

        // Return the minimum of the two calculation methods
        if total_hour_price > total_day_price {
            Ok(total_day_price)
        } else {
            Ok(total_hour_price)
        }
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Item name is too long. Max 60 characters allowed.")]
    NameTooLong,
    #[msg("Item description is too long. Max 250 characters allowed.")]
    DescriptionTooLong,
    #[msg("Price must be greater than zero.")]
    InvalidPrice,
    #[msg("Item registry is full. Cannot register more items.")]
    RegistryFull,
    #[msg("Item not found in registry.")]
    ItemNotFound,
    #[msg("Unauthorized to perform this action.")]
    Unauthorized,
    #[msg("Metadata URI is too long. Max 200 characters allowed.")]
    MetadataUriTooLong,
    #[msg("Price calculation resulted in an overflow.")]
    PriceCalculationOverflow,
}