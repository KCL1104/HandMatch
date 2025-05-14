import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import httpx # Added for async requests
import json
import base64
import asyncio
from anchorpy import Program, Provider, Wallet
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey as PublicKey
from solders.transaction import Transaction
# from solders.system_program import ID as SYS_PROGRAM_ID # Will use constant
from spl.token.instructions import get_associated_token_address
from anchorpy.error import AccountDoesNotExistError # For specific error handling

load_dotenv(dotenv_path=".env.local")

# Solana Program IDs
TOKEN_PROGRAM_ID = PublicKey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
ASSOCIATED_TOKEN_PROGRAM_ID = PublicKey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
SYSTEM_PROGRAM_ID = PublicKey.from_string("11111111111111111111111111111111")
ITEM_REGISTRATION_PROGRAM_ID = PublicKey.from_string("Dh1N1esPsvQdgakyM13S3CMFzT2jzDeKbNKerx1vK6Jw")
RENTAL_PROGRAM_ID = PublicKey.from_string("6XqPznLJiGdqzD4FkD9yQGMN2XQb1fLXL1UKfwq8kgPQ")


# System Revenue Address - REPLACE WITH YOUR ACTUAL ADDRESS IN .env OR HERE
SYSTEM_REVENUE_ADDRESS_STR = os.getenv("SYSTEM_REVENUE_ADDRESS")
if SYSTEM_REVENUE_ADDRESS_STR:
    SYSTEM_REVENUE_ADDRESS = PublicKey.from_string(SYSTEM_REVENUE_ADDRESS_STR)
else:
    SYSTEM_REVENUE_ADDRESS = PublicKey.from_string("SysRevenueNeedsToBeSet111111111111111111111")
    print("WARNING: SYSTEM_REVENUE_ADDRESS is not set in .env, using placeholder. Please update.")


PINATA_API_KEY = os.getenv("Pinata_API_Key")
PINATA_API_SECRET = os.getenv("Pinata_API_Secret")
PINATA_JWT = os.getenv("Pinata_JWT")
QUICKNODE_URL = os.getenv("SOLANA_RPC_URL")

# Load IDL for item_registration
with open("programs/idl/item_registration.json") as f:
    idl = json.load(f)

# Load IDL for rental_flow
with open("programs/idl/rental_flow.json") as f:
    rental_idl = json.load(f)

# Devnet USDC mint address
USDC_MINT_PUBKEY = PublicKey.from_string("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU") # Renamed for clarity

# Pydantic models for responses
class ItemAccountResponse(BaseModel):
    owner: str
    item_id: int
    name: str
    description: str
    price_per_hour: int
    price_per_day: int
    is_available: bool
    metadata_uri: str

class RentalTransactionResponse(BaseModel):
    item: str
    renter: str
    owner: str
    start_time: int
    end_time: int
    total_price: int
    is_active: bool
    is_completed: bool

app = FastAPI()

@app.get("/")
def read_root():
    pass

# Query Endpoints
@app.get("/item/{item_account_key_str}", response_model=ItemAccountResponse)
async def get_item(item_account_key_str: str):
    try:
        item_account_pubkey = PublicKey(item_account_key_str)
        
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local()
            provider = Provider(connection, dummy_wallet)
            # ITEM_REGISTRATION_PROGRAM_ID and idl are globally defined
            item_registration_program = await Program.create(idl, ITEM_REGISTRATION_PROGRAM_ID, provider)
            
            item_data = await item_registration_program.account["ItemAccount"].fetch(item_account_pubkey)
            
            # Convert PublicKey fields to string for the response model
        return ItemAccountResponse(
            owner=str(item_data.owner),
            item_id=item_data.item_id,
            name=item_data.name,
            description=item_data.description,
            price_per_hour=item_data.price_per_hour,
            price_per_day=item_data.price_per_day,
            is_available=item_data.is_available,
            metadata_uri=item_data.metadata_uri
        )
    except AccountDoesNotExistError:
        # connection is managed by async with
        raise HTTPException(status_code=404, detail="Item not found.")
    except ValueError as ve: # Handles invalid PublicKey string
        # connection is managed by async with
        raise HTTPException(status_code=400, detail=f"Invalid item_account_key_str: {str(ve)}")
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/items", response_model=List[int]) # Initially returning List[int] for item_ids
async def get_all_items():
    # TODO: Enhance to return List[ItemAccountResponse] if ItemAccount PDAs can be derived
    # solely from item_id or if ItemRegistry stores ItemAccount pubkeys.
    # Current ItemRegistry only stores item_ids (Vec<u64>).
    # Deriving ItemAccount PDA typically requires [b"item_account", owner.key().as_ref(), &item_id.to_le_bytes()].
    # The 'owner' is not available in ItemRegistry alongside item_id.
    # If ItemAccount PDA was, for example, [b"item", &item_id.to_le_bytes()], then we could fetch.
    try:
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local()
            provider = Provider(connection, dummy_wallet)
            item_registration_program = await Program.create(idl, ITEM_REGISTRATION_PROGRAM_ID, provider)

            item_registry_pda, _ = PublicKey.find_program_address(
                [b"item_registry"], ITEM_REGISTRATION_PROGRAM_ID
            )
            
            item_registry_data = await item_registration_program.account["ItemRegistry"].fetch(item_registry_pda)
            
            return item_registry_data.item_ids # Returns List[int] as per current simplification
        
    except AccountDoesNotExistError:
        # connection is managed by async with
        raise HTTPException(status_code=404, detail="ItemRegistry not found.")
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/rental-transaction/{rental_transaction_key_str}", response_model=RentalTransactionResponse)
async def get_rental_transaction(rental_transaction_key_str: str):
    try:
        rental_transaction_pubkey = PublicKey(rental_transaction_key_str)
        
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local()
            provider = Provider(connection, dummy_wallet)
            # RENTAL_PROGRAM_ID and rental_idl are globally defined
            rental_flow_program = await Program.create(rental_idl, RENTAL_PROGRAM_ID, provider)
            
            rental_data = await rental_flow_program.account["RentalTransaction"].fetch(rental_transaction_pubkey)
            
            # Convert PublicKey fields to string for the response model
        return RentalTransactionResponse(
            item=str(rental_data.item),
            renter=str(rental_data.renter),
            owner=str(rental_data.owner),
            start_time=rental_data.start_time,
            end_time=rental_data.end_time,
            total_price=rental_data.total_price,
            is_active=rental_data.is_active,
            is_completed=rental_data.is_completed
        )
    except AccountDoesNotExistError:
        # connection is managed by async with
        raise HTTPException(status_code=404, detail="Rental transaction not found.")
    except ValueError as ve: # Handles invalid PublicKey string
        # connection is managed by async with
        raise HTTPException(status_code=400, detail=f"Invalid rental_transaction_key_str: {str(ve)}")
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    # Removed redundant return statement

@app.post("/prepare-item-registration/")
async def prepare_item_registration(
    name: str = Form(...),
    description: str = Form(...),
    price_per_hour: int = Form(...),
    price_per_day: int = Form(...),
    file: UploadFile = File(...)
):
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {"Authorization": f"Bearer {PINATA_JWT}"}
    
    # Read file content asynchronously
    file_content = await file.read()
    files = {'file': (file.filename, file_content, file.content_type)}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, files=files, headers=headers)
            response.raise_for_status() # Raises an exception for 4XX/5XX responses
            pinata_data = response.json()
            metadata_uri = f"https://gateway.pinata.cloud/ipfs/{pinata_data['IpfsHash']}"
            return JSONResponse(content={
                "name": name,
                "description": description,
                "price_per_hour": price_per_hour,
                "price_per_day": price_per_day,
                "metadata_uri": metadata_uri
            })
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred during Pinata upload: {str(e)}")

class RegisterItemRequest(BaseModel):
    name: str
    description: str
    price_per_hour: int
    price_per_day: int
    metadata_uri: str
    user_pubkey: str  # base58 string

@app.post("/build-register-item-tx/")
async def build_register_item_tx(req: RegisterItemRequest):
    try:
        async with AsyncClient(QUICKNODE_URL) as connection:
            # AnchorPy requires a Wallet for Provider context, but we do NOT use it for signing.
            # The transaction will be unsigned and sent to thefrontend for user signing.
            dummy_wallet = Wallet.local()  # Not used for signing, just for Anchor context
            provider = Provider(connection, dummy_wallet)
            program = await Program.create(idl, ITEM_REGISTRATION_PROGRAM_ID, provider)

            user_pubkey = PublicKey(req.user_pubkey)

            # Derive PDAs (item_registry)
            item_registry_pda, _ = PublicKey.find_program_address(
                [b"item_registry"], program.program_id
            )
            # For item_account, generate a random keypair (frontend should use the same logic)
            from solders.keypair import Keypair
            item_account = Keypair()

            # Build the transaction
            tx = Transaction()
            tx.add(
                await program.instruction["register_item"](
                    req.name,
                    req.description,
                    req.price_per_hour,
                    req.price_per_day,
                    req.metadata_uri,
                    accounts={ # Matches RegisterItem Accounts struct
                        "owner": user_pubkey,
                        "item_account": item_account.public_key,
                        "item_registry": item_registry_pda,
                        "system_program": SYSTEM_PROGRAM_ID,
                    }
                )
            )
            
            latest_blockhash_resp = await connection.get_latest_blockhash()
            tx.recent_blockhash = latest_blockhash_resp.blockhash
            tx.fee_payer = user_pubkey
            
            # Serialize transaction using serialize_message
            serialized_tx = base64.b64encode(tx.serialize_message()).decode('ascii')

            return {"transaction": serialized_tx, "item_account": str(item_account.public_key)}
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=str(e))

class InitiateRentalRequest(BaseModel):
    item_account: str # Pubkey string
    renter: str       # Pubkey string (fee payer for this tx)
    owner: str        # Pubkey string (owner of the item)
    renter_usdc: str  # Pubkey string (renter's USDC ATA)
    hours: int
    start_time: int   # Unix timestamp
    # Removed program ID fields, they are constants or derived in backend
    # escrow_usdc: str = None # Derived in backend

@app.post("/build-initiate-rental-tx/")
async def build_initiate_rental_tx(req: InitiateRentalRequest):
    try:
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local()
            provider = Provider(connection, dummy_wallet)
            program = await Program.create(rental_idl, RENTAL_PROGRAM_ID, provider)

            # Convert all provided keys to PublicKey
            item_account_pk = PublicKey.from_string(req.item_account)
            renter_pk = PublicKey.from_string(req.renter)
            owner_pk = PublicKey.from_string(req.owner)
            renter_usdc_pk = PublicKey.from_string(req.renter_usdc)

            # Derive rental_transaction_pda
            rental_transaction_pda, _ = PublicKey.find_program_address(
                [b"rental_transaction", item_account_pk.to_bytes(), renter_pk.to_bytes()],
                program.program_id  # RENTAL_PROGRAM_ID
            )

            # Derive escrow_usdc ATA
            escrow_usdc_pubkey = get_associated_token_address(
                owner=rental_transaction_pda,
                mint=USDC_MINT_PUBKEY
            )

            tx = Transaction()
            tx.add(
                await program.instruction["initiate_rental"](
                    req.hours,
                    req.start_time,
                    accounts={ # Matches InitiateRental Accounts struct
                        "renter": renter_pk,
                        "owner": owner_pk, # Owner of item_account, needed for CPI to item_registration
                        "item_account": item_account_pk,
                        "rental_transaction": rental_transaction_pda,
                        "usdc_mint": USDC_MINT_PUBKEY,
                        "renter_usdc": renter_usdc_pk,
                        "escrow_usdc": escrow_usdc_pubkey,
                        "item_registration_program": ITEM_REGISTRATION_PROGRAM_ID, # Program, not an account key
                        "token_program": TOKEN_PROGRAM_ID,
                        "system_program": SYSTEM_PROGRAM_ID,
                        "associated_token_program": ASSOCIATED_TOKEN_PROGRAM_ID,
                    }
                )
            )
            
            latest_blockhash_resp = await connection.get_latest_blockhash()
            tx.recent_blockhash = latest_blockhash_resp.blockhash
            tx.fee_payer = renter_pk # Renter pays for initiating the rental
            
            serialized_tx = base64.b64encode(tx.serialize_message()).decode('ascii')
            
            return {"transaction": serialized_tx, "escrow_usdc": str(escrow_usdc_pubkey)}
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=str(e))

class CompleteRentalRequest(BaseModel):
    owner_key_str: str # Renamed from owner for clarity, as it's the requestor's key
    item_account_key_str: str # Renamed from item_account
    rental_transaction_key_str: str  # Renamed from rental_transaction, PDA provided by frontend
    # owner_usdc_ata_str: str # Removed, will be derived
    # system_usdc_ata_str: str # Removed, will be derived
    # associated_token_program_id_str: str # Removed, will use constant
    # token_program_id_str: str # Removed, will use constant
    # system_program_id_str: str # Removed, will use constant
    # item_registration_program_id_str: str # Removed, will use constant

class CancelRentalRequest(BaseModel):
    rental_transaction_key_str: str
    renter_key_str: str
    item_account_key_str: str
    owner_key_str: str # Owner of the item, required for CPI to item_registration
    fee_payer_key_str: str # Who pays for this transaction (can be renter or owner)

# ITEM_REGISTRATION_PROGRAM_ID and RENTAL_PROGRAM_ID moved to top

@app.post("/build-complete-rental-tx/")
async def build_complete_rental_tx(req: CompleteRentalRequest):
    try:
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local()
            provider = Provider(connection, dummy_wallet)
            
            rental_program = await Program.create(rental_idl, RENTAL_PROGRAM_ID, provider)
            item_reg_program_client = await Program.create(idl, ITEM_REGISTRATION_PROGRAM_ID, provider)

            request_owner_pubkey = PublicKey(req.owner_key_str)
            item_account_pubkey = PublicKey(req.item_account_key_str)
            rental_transaction_pubkey = PublicKey(req.rental_transaction_key_str)

            # Authorization Checks
            try:
                item_account_data = await item_reg_program_client.account["ItemAccount"].fetch(item_account_pubkey)
            except AccountDoesNotExistError:
                raise HTTPException(status_code=404, detail=f"ItemAccount not found: {item_account_pubkey}")
            
            try:
                rental_transaction_data = await rental_program.account["RentalTransaction"].fetch(rental_transaction_pubkey)
            except AccountDoesNotExistError:
                raise HTTPException(status_code=404, detail=f"RentalTransaction not found: {rental_transaction_pubkey}")

            if not (request_owner_pubkey == item_account_data.owner and \
                    request_owner_pubkey == rental_transaction_data.owner):
                raise HTTPException(status_code=403, detail="Unauthorized: Provided owner does not match record owner.")

            owner_usdc_ata = get_associated_token_address(owner=request_owner_pubkey, mint=USDC_MINT_PUBKEY)
            system_usdc_ata = get_associated_token_address(owner=SYSTEM_REVENUE_ADDRESS, mint=USDC_MINT_PUBKEY)
            renter_pubkey = rental_transaction_data.renter
            escrow_usdc_pubkey = get_associated_token_address(
                owner=rental_transaction_pubkey,
                mint=USDC_MINT_PUBKEY
            )

            tx = Transaction()
            tx.add(
                await rental_program.instruction["complete_rental"](
                    accounts={ # Matches CompleteRental Accounts struct
                        "owner": request_owner_pubkey,
                        "rental_transaction": rental_transaction_pubkey,
                        "item_account": item_account_pubkey,
                        "usdc_mint": USDC_MINT_PUBKEY,
                        "owner_usdc": owner_usdc_ata,
                        "system_usdc": system_usdc_ata,
                        "escrow_usdc": escrow_usdc_pubkey,
                        "item_registration_program": ITEM_REGISTRATION_PROGRAM_ID,
                        "token_program": TOKEN_PROGRAM_ID,
                        # system_program and associated_token_program are not in Rust struct
                    }
                )
            )
            
            latest_blockhash_resp = await connection.get_latest_blockhash()
            tx.recent_blockhash = latest_blockhash_resp.blockhash
            tx.fee_payer = request_owner_pubkey # Owner pays for completing the rental
            
            serialized_tx = base64.b64encode(tx.serialize_message()).decode('ascii')
            
            return {
                "transaction": serialized_tx,
                "escrow_usdc": str(escrow_usdc_pubkey),
                "renter": str(renter_pubkey),
                "derived_owner_usdc_ata": str(owner_usdc_ata),
                "derived_system_usdc_ata": str(system_usdc_ata)
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=f"Failed to complete rental: {str(e)}")
    
@app.post("/build-cancel-rental-tx/")
async def build_cancel_rental_tx(req: CancelRentalRequest):
    try:
        async with AsyncClient(QUICKNODE_URL) as connection:
            dummy_wallet = Wallet.local() # Not used for signing
            provider = Provider(connection, dummy_wallet)
            
            rental_program = await Program.create(rental_idl, RENTAL_PROGRAM_ID, provider)
            item_reg_program_client = await Program.create(idl, ITEM_REGISTRATION_PROGRAM_ID, provider)

            rental_transaction_pubkey = PublicKey.from_string(req.rental_transaction_key_str)
            renter_pubkey = PublicKey.from_string(req.renter_key_str)
            item_account_pubkey = PublicKey.from_string(req.item_account_key_str)
            owner_pubkey = PublicKey.from_string(req.owner_key_str) # Owner of item, for CPI
            fee_payer_pubkey = PublicKey.from_string(req.fee_payer_key_str)

            # Authorization Checks
            try:
                rental_transaction_data = await rental_program.account["RentalTransaction"].fetch(rental_transaction_pubkey)
            except AccountDoesNotExistError:
                raise HTTPException(status_code=404, detail=f"RentalTransaction not found: {rental_transaction_pubkey}")
            
            try:
                item_account_data = await item_reg_program_client.account["ItemAccount"].fetch(item_account_pubkey)
            except AccountDoesNotExistError:
                raise HTTPException(status_code=404, detail=f"ItemAccount not found: {item_account_pubkey}")

            # Verify renter (signer of cancel can be renter or owner, but renter in PDA must match)
            if renter_pubkey != rental_transaction_data.renter:
                 # This check might need refinement based on who is allowed to call cancel.
                 # If owner can cancel, this check is too strict.
                 # Assuming for now the renter_key_str in request is the actual renter.
                pass # Allowing owner to cancel too, as long as they are the item owner.

            # Verify owner of the item matches
            if owner_pubkey != item_account_data.owner:
                raise HTTPException(status_code=403, detail="Unauthorized: Provided owner does not match item's owner.")
            # Verify owner in rental transaction also matches (consistency)
            if owner_pubkey != rental_transaction_data.owner:
                 raise HTTPException(status_code=403, detail="Unauthorized: Provided owner does not match rental transaction's owner.")


            renter_usdc_ata = get_associated_token_address(owner=rental_transaction_data.renter, mint=USDC_MINT_PUBKEY) # renter from rental_transaction_data
            escrow_usdc_pubkey = get_associated_token_address(owner=rental_transaction_pubkey, mint=USDC_MINT_PUBKEY)

            accounts_dict = { # Matches CancelRental Accounts struct
                "renter": rental_transaction_data.renter, # Renter from the transaction state
                "owner": owner_pubkey, # Item owner, for CPI
                "rental_transaction": rental_transaction_pubkey,
                "item_account": item_account_pubkey,
                "usdc_mint": USDC_MINT_PUBKEY,
                "renter_usdc": renter_usdc_ata,
                "escrow_usdc": escrow_usdc_pubkey,
                "item_registration_program": ITEM_REGISTRATION_PROGRAM_ID,
                "token_program": TOKEN_PROGRAM_ID,
                # system_program and associated_token_program are not in Rust struct
            }
            
            ix = await rental_program.instruction["cancel_rental"](accounts=accounts_dict)

            tx = Transaction()
            tx.add(ix)
            tx.fee_payer = fee_payer_pubkey
            
            latest_blockhash_resp = await connection.get_latest_blockhash()
            tx.recent_blockhash = latest_blockhash_resp.blockhash

            serialized_tx = base64.b64encode(tx.serialize_message()).decode('ascii')
            
            return {"transaction": serialized_tx}

    except HTTPException as he:
        raise he
    except Exception as e:
        # connection is managed by async with
        raise HTTPException(status_code=500, detail=f"Failed to build cancel rental transaction: {str(e)}")