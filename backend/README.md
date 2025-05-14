# HandMatch - Backend API & Solana Programs

This directory contains the backend API server (Python/FastAPI) and the Solana smart contracts (Rust/Anchor) for the HandMatch project.

## Overview

The backend serves two primary purposes:
1.  **API Layer:** Provides HTTP endpoints for the frontend application to interact with. This includes fetching item data, preparing unsigned Solana transactions for item registration and rentals, and interacting with Pinata for IPFS storage.
2.  **Solana Smart Contracts:** Defines the on-chain logic for item registration and the rental lifecycle.

## Technologies Used

*   **API Server:**
    *   Python 3.8+
    *   FastAPI: Modern, fast (high-performance) web framework for building APIs.
    *   Uvicorn: ASGI server for running FastAPI.
    *   AnchorPy: Python client for interacting with Anchor-based Solana programs.
    *   Solana-py: Python library for Solana.
    *   Solders: Python bindings for Solana Rust types.
    *   SPL-Token: Python library for SPL Token interactions.
    *   httpx: Asynchronous HTTP client (for Pinata).
    *   python-dotenv: For managing environment variables.
    *   Pydantic: For data validation and settings management.
*   **Solana Smart Contracts:**
    *   Rust
    *   Anchor Framework: For rapid Solana program development.
*   **Storage:**
    *   Pinata: For pinning item metadata (images, descriptions) to IPFS.

## Solana Smart Contracts

Two main smart contracts are used:

### 1. Item Registration Program

*   **Program ID:** `Dh1N1esPsvQdgakyM13S3CMFzT2jzDeKbNKerx1vK6Jw` (as per [`item_registration.rs`](backend/programs/item_registration.rs:3) and [`item_registration.json`](backend/programs/idl/item_registration.json:2))
*   **Functionality:**
    *   `initialize_registry`: Initializes a global registry for items.
    *   `register_item`: Allows an owner to register a new item with details like name, description, price, and metadata URI (pointing to IPFS).
    *   `update_item`: Allows the owner to update details of an existing item.
    *   `remove_item`: Allows the owner to remove an item listing (closes the item account).
    *   `set_item_availability`: Internal CPI called by the Rental Flow program to mark an item as available or unavailable.
*   **Accounts:**
    *   `ItemRegistry`: Stores a list of all registered item IDs and the next available ID.
    *   `ItemAccount`: Stores details for a specific item, including owner, prices, availability, and metadata URI.
*   **IDL:** [`programs/idl/item_registration.json`](backend/programs/idl/item_registration.json:0)

### 2. Rental Flow Program

*   **Program ID:** `6XqPznLJiGdqzD4FkD9yQGMN2XQb1fLXL1UKfwq8kgPQ` (as per [`rental_flow.rs`](backend/programs/rental_flow.rs:15) and [`rental_flow.json`](backend/programs/idl/rental_flow.json:2))
*   **Functionality:**
    *   `initiate_rental`: Allows a renter to start a rental. Transfers USDC from the renter to an escrow account and marks the item as unavailable (via CPI to Item Registration program).
    *   `complete_rental`: Allows the item owner to complete a rental after the rental period. Distributes funds from escrow (e.g., 90% to owner, 10% to a system revenue account) and marks the item as available again.
    *   `cancel_rental`: Allows the renter (or potentially owner under certain conditions) to cancel an active rental. Refunds USDC from escrow to the renter and marks the item as available.
*   **Accounts:**
    *   `RentalTransaction`: Stores details of an active or completed rental, including item, renter, owner, start/end times, total price, and status.
    *   Escrow Token Accounts: Associated Token Accounts (ATAs) owned by the `RentalTransaction` PDA to hold USDC during the rental period.
*   **IDL:** [`programs/idl/rental_flow.json`](backend/programs/idl/rental_flow.json:0)

## API Server ([`main.py`](backend/main.py:0))

The FastAPI application provides the following key endpoints:

*   **Item Endpoints:**
    *   `GET /item/{item_account_key_str}`: Fetches details of a specific item.
    *   `GET /items`: Fetches a list of item IDs from the registry.
    *   `POST /prepare-item-registration/`: Uploads an item image to Pinata (IPFS) and returns metadata for registration.
    *   `POST /build-register-item-tx/`: Builds an unsigned Solana transaction for registering an item.
*   **Rental Endpoints:**
    *   `GET /rental-transaction/{rental_transaction_key_str}`: Fetches details of a specific rental transaction.
    *   `POST /build-initiate-rental-tx/`: Builds an unsigned Solana transaction for initiating a rental.
    *   `POST /build-complete-rental-tx/`: Builds an unsigned Solana transaction for completing a rental.
    *   `POST /build-cancel-rental-tx/`: Builds an unsigned Solana transaction for canceling a rental.

### Setup and Running the Backend

1.  **Prerequisites:**
    *   Python 3.8+ and Pip
    *   A running Solana cluster (local or devnet/mainnet-beta) with the programs deployed.
    *   Pinata account and API keys.

2.  **Environment Variables:**
    Create a `.env.local` file in the `backend/` directory with the following (replace placeholders):
    ```env
    SOLANA_RPC_URL="YOUR_SOLANA_RPC_ENDPOINT"
    Pinata_API_Key="YOUR_PINATA_API_KEY"
    Pinata_API_Secret="YOUR_PINATA_API_SECRET"
    Pinata_JWT="YOUR_PINATA_JWT" # JWT is preferred for Pinata
    SYSTEM_REVENUE_ADDRESS="YOUR_SOLANA_SYSTEM_REVENUE_PUBLIC_KEY" # For collecting platform fees
    ```
    *Note: The `ITEM_REGISTRATION_PROGRAM_ID` and `RENTAL_PROGRAM_ID` are hardcoded in [`main.py`](backend/main.py:0) but should match your deployed program IDs.*

3.  **Install Dependencies:**
    It's recommended to use a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    # The requirements.txt is minimal. You'll likely need to install others:
    pip install fastapi uvicorn python-dotenv "anchorpy[cli]" solana solders spl-token httpx pydantic
    ```

4.  **Deploy Solana Programs:**
    If you are developing the Solana programs:
    *   Navigate to `backend/programs/item_registration/` and `backend/programs/rental_flow/`.
    *   Build and deploy using Anchor CLI: `anchor build` and `anchor deploy`.
    *   Update the Program IDs in [`main.py`](backend/main.py:0) and the IDL JSON files if they change.

5.  **Run the API Server:**
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```
    (Assuming your `main.py` is in the current directory. If `main.py` is inside a `backend` subdirectory, run from the parent directory as `uvicorn backend.main:app --reload ...`)

    The API will be accessible at `http://localhost:8000`.

### Notes

*   The backend API constructs and returns *unsigned* Solana transactions. These transactions must be signed by the user on the frontend using their connected wallet before being sent to the Solana network.
*   The `SYSTEM_REVENUE_ADDRESS` is used in the `complete_rental` flow to distribute a portion of the rental fee to the platform.
*   USDC mint address for Devnet is hardcoded. This should be configurable if targeting other networks or tokens.