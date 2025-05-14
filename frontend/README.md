# HandMatch - Frontend Mobile Application

This is the frontend mobile application for HandMatch, a decentralized rental marketplace. It's built with React Native and Expo, allowing users to browse items, chat with others, and manage rentals using the Solana blockchain.

## Features

*   **User Authentication:** Sign up and log in using Email/Password or Google (via Firebase).
*   **Item Browsing & Discovery:**
    *   View a grid of available items for rent with details like title, price, and image.
    *   Search for items.
    *   Filter items by category.
    *   (Planned) Map view for item locations.
*   **Real-time Messaging:**
    *   Initiate chats with item owners directly from item listings.
    *   View a list of ongoing conversations.
    *   Engage in real-time messaging within chat rooms.
    *   Message status indicators (sent, delivered, read).
*   **Solana Integration (Core Functionality - Partially Implemented):**
    *   Dependencies for `@solana/web3.js` and Solana Mobile Wallet Adapter are included.
    *   (TODO) Wallet connection functionality on the profile screen.
    *   The architecture is designed for the frontend to receive unsigned transactions from the backend and sign them using the user's connected wallet.
*   **Profile Management:**
    *   View user profile information (name, email, profile picture).
    *   Logout functionality.
    *   (Placeholders) Edit profile, wallet settings, transaction history.
*   **UI/UX:**
    *   Themed components for light/dark mode support.
    *   Custom tab bar and haptic feedback.
    *   Uses Expo Router for navigation with typed routes.

## Tech Stack

*   **Framework:** React Native with Expo SDK (~52)
*   **Language:** TypeScript
*   **Navigation:** Expo Router
*   **State Management:** React Context API (implied by `useColorScheme`, etc.), component state.
*   **Backend Integration:**
    *   Firebase: For Authentication (Email/Password, Google) and Firestore (real-time chat).
    *   Custom Backend API: For fetching item/rental data and pre-built Solana transactions.
*   **Solana:**
    *   `@solana/web3.js`: For interacting with the Solana blockchain.
    *   `@solana-mobile/mobile-wallet-adapter-protocol` & `protocol-web3js`: For mobile wallet interactions.
    *   `expo-crypto` & `buffer`: Polyfills for cryptographic operations.
*   **UI Components:** Custom themed components, `@expo/vector-icons`.
*   **Animations:** `react-native-reanimated`.

## Project Structure

```
frontend/
├── app/                  # Expo Router file-based routing
│   ├── (tabs)/           # Layout and screens for the main tab navigation (Home, Chat, Profile)
│   │   ├── _layout.tsx
│   │   ├── index.tsx     # Home screen
│   │   ├── chat.tsx      # Chat list screen
│   │   └── profile.tsx   # User profile screen
│   ├── auth/             # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── chat/             # Dynamic route for individual chat rooms
│   │   └── [id].tsx
│   ├── _layout.tsx       # Root layout for the app
│   └── +not-found.tsx    # Not found screen
├── assets/               # Static assets (fonts, images)
├── components/           # Reusable UI components (ItemCard, ChatRoom, ThemedText, etc.)
│   ├── ui/               # More specific UI elements (IconSymbol, TabBarBackground)
├── config/               # Configuration files
│   └── firebase.ts       # Firebase initialization
├── constants/            # Constants like Colors
├── hooks/                # Custom React hooks (useColorScheme, useThemeColor)
├── services/             # Services for interacting with backends
│   ├── authService.ts    # Firebase authentication functions
│   └── chatService.ts    # Firebase Firestore chat functions
├── types/                # TypeScript type definitions
│   └── item.ts
├── scripts/              # Utility scripts
│   └── reset-project.js
├── .gitignore
├── app.json              # Expo app configuration
├── eas.json              # EAS Build configuration
├── index.js              # App entry point (with polyfills)
├── package.json
├── README.md             # This file
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

### Prerequisites

*   Node.js (LTS version, e.g., v20+ recommended)
*   npm or yarn
*   Expo Go app on your mobile device (for testing) or an Android/iOS emulator/simulator.
*   A Firebase project set up with Authentication (Email/Password, Google Sign-In) and Firestore enabled.

### Environment Setup

1.  **Clone the repository (if not already done) and navigate to the `frontend` directory:**
    ```bash
    # From the project root
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    # yarn install
    ```

3.  **Configure Firebase:**
    *   Open [`frontend/config/firebase.ts`](frontend/config/firebase.ts:0).
    *   Replace the placeholder `firebaseConfig` values with your actual Firebase project's configuration.
    *   Ensure you have enabled Email/Password and Google Sign-In methods in your Firebase Authentication settings.
    *   Set up Firestore rules. For development, you might start with permissive rules, but secure them for production. Example (allow read/write if authenticated):
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if request.auth != null;
            }
          }
        }
        ```

### Development

1.  **Start the development server:**
    ```bash
    npm start
    # OR
    # expo start
    ```
    This will open the Expo DevTools in your web browser and show a QR code.

2.  **Run the app:**
    *   **On a physical device:** Scan the QR code using the Expo Go app (iOS or Android).
    *   **On an emulator/simulator:**
        *   Press `a` in the terminal for Android.
        *   Press `i` in the terminal for iOS.
    *   **In a web browser:** Press `w` in the terminal.

### Development Workflow

*   The app uses Expo's development server with Fast Refresh. Changes in your code should automatically reload the app.
*   **Expo DevTools Menu:**
    *   Press `r` in the terminal (or shake device) to reload the app.
    *   Press `m` in the terminal (or shake device) to toggle the in-app developer menu.
    *   Press `w` in the terminal to open the app in a web browser.

### Building for Production (EAS Build)

Expo Application Services (EAS) is used for building and submitting the app.

1.  **Install EAS CLI (if not already installed):**
    ```bash
    npm install -g eas-cli
    ```

2.  **Log in to your Expo account:**
    ```bash
    eas login
    ```

3.  **Configure the project for EAS Build (if not already done):**
    This will create/update `eas.json`.
    ```bash
    eas build:configure
    ```
    You might need to update the `projectId` in [`frontend/app.json`](frontend/app.json:41) under `expo.extra.eas` with your actual EAS project ID.

4.  **Start a build:**
    *   For Android:
        ```bash
        eas build --platform android --profile preview
        # Or use a specific build profile (e.g., production)
        # eas build --platform android --profile production
        ```
    *   For iOS:
        ```bash
        eas build --platform ios --profile preview
        # Or use a specific build profile
        # eas build --platform ios --profile production
        ```
    Follow the prompts from EAS CLI. Builds will run on EAS servers.

## Key Functionalities and TODOs

*   **Solana Wallet Connection:** The Profile screen has a placeholder for wallet connection ([`frontend/app/(tabs)/profile.tsx`](frontend/app/(tabs)/profile.tsx:14)). This needs to be implemented using `@solana-mobile/mobile-wallet-adapter-protocol` to allow users to connect their Solana wallets.
*   **Backend API Integration for Items:** The Home screen currently uses mock data ([`frontend/app/(tabs)/index.tsx`](frontend/app/(tabs)/index.tsx:20)). This should be replaced with API calls to the backend to fetch actual item listings.
*   **Transaction Signing:** Once items are fetched and wallet connection is implemented, flows for item registration (if applicable from frontend) and rentals will involve:
    1.  Frontend requests a pre-built transaction from the backend API.
    2.  Backend API returns a serialized, unsigned transaction.
    3.  Frontend uses the connected wallet to sign this transaction.
    4.  Frontend sends the signed transaction to the Solana network.
*   **Map View:** The map view on the Home screen is a placeholder ([`frontend/app/(tabs)/index.tsx`](frontend/app/(tabs)/index.tsx:151)) and needs implementation using `react-native-maps` or a similar library.
*   **Profile Screen Features:** "Edit Profile", "Wallet Settings", "Transaction History" are placeholders.
*   **Error Handling & Loading States:** Enhance throughout the app for a better user experience.

## Features in Development (from original README)

*   [x] Item search and filtering (Basic implementation present)
*   [ ] Rating system
*   [ ] Transaction history
*   [ ] Push notifications