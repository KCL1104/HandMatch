# HandMatch - Decentralized Rental Marketplace

**Note:** This project was developed for a hackathon. Due to time constraints, some features are incomplete or were not implemented.

HandMatch is a peer-to-peer rental marketplace application that allows users to list, discover, and rent items using the Solana blockchain for secure and transparent transactions. The platform features a mobile-first experience built with React Native (Expo) and a robust backend powered by Python (FastAPI) and Rust-based Solana smart contracts.

## Project Overview

The HandMatch platform is composed of three main parts:

1.  **Frontend Application:** A mobile application (iOS, Android, Web) built with React Native and Expo. It provides the user interface for browsing items, managing user profiles, real-time chat, and interacting with the Solana blockchain for rental transactions.
2.  **Backend API:** A Python FastAPI server that acts as an intermediary between the frontend and the Solana blockchain. It handles requests for item information, prepares unsigned Solana transactions for the frontend to sign, and interacts with IPFS for metadata storage (via Pinata).
3.  **Solana Smart Contracts:** Two core Rust-based smart contracts deployed on the Solana blockchain:
    *   **Item Registration Program:** Manages the creation, updating, and querying of item listings.
    *   **Rental Flow Program:** Handles the lifecycle of a rental, including escrowing funds, payment distribution upon completion, and refunds upon cancellation.

## Architecture

```
+---------------------+     +---------------------+     +------------------------+
|   Frontend (Expo)   |<--->|    Backend API      |<--->| Solana Smart Contracts |
| (React Native, TS)  |     |  (Python, FastAPI)  |     |      (Rust, Anchor)    |
+---------------------+     +---------------------+     +------------------------+
        |                            |                             |
        |                            |                             |
        |                            +--------> Pinata (IPFS) <----+
        |                                                          |
        +----------------------------> Firebase (Auth, Firestore) <--+
```

### Key Features

*   **Decentralized Item Rentals:** Leverage Solana for secure and transparent rental agreements.
*   **User Authentication:** Secure sign-up and login using Firebase Authentication (Email/Password & Google).
*   **Item Discovery:** Browse, search, and filter item listings.
*   **Real-time Chat:** Communicate directly with item owners or renters within the app using Firebase Firestore.
*   **Solana Wallet Integration:** Connect a Solana wallet to sign transactions (e.g., Phantom, Solflare - via Mobile Wallet Adapter).
*   **Profile Management:** View user profiles and (planned) rental history.

## Getting Started

This project is a monorepo containing the `frontend` and `backend` components.

### Prerequisites

*   Node.js (LTS version recommended, e.g., v18+)
*   npm or yarn
*   Python (3.8+ recommended)
*   pip
*   Rust and Cargo (for Solana program development/deployment)
*   Solana CLI tools
*   Access to a Solana RPC endpoint (e.g., QuickNode, Helius, or a local validator)
*   Pinata account (for IPFS storage)
*   Firebase project

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd handmatch
    ```

2.  **Setup Frontend:**
    Navigate to the `frontend` directory for specific setup instructions:
    ```bash
    cd frontend
    # See frontend/README.md for detailed setup
    cd ..
    ```

3.  **Setup Backend:**
    Navigate to the `backend` directory for specific setup instructions:
    ```bash
    cd backend
    # See backend/README.md for detailed setup
    cd ..
    ```

### Running the Application

1.  **Start the Backend API server.** (See `backend/README.md`)
2.  **Start the Frontend Expo development server.** (See `frontend/README.md`)

Ensure your Solana smart contracts are deployed and their Program IDs are correctly configured in the backend.

## Further Information

*   For frontend-specific details, see [`frontend/README.md`](frontend/README.md:0).
*   For backend-specific details, including API and smart contract information, see [`backend/README.md`](backend/README.md:0).