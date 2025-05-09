# Marketplace App with Solana Integration

A React Native Expo marketplace application that allows users to rent items using Solana blockchain. Built with modern UI/UX principles and powered by Expo.

## Features

- **Browse Items**: View available items for rent with pricing per hour
- **Real-time Messaging**: Chat with item owners or renters
- **Solana Integration**: Connect your Solana wallet for secure transactions
- **Profile Management**: Manage your listings and rental history

## Tech Stack

- React Native with Expo SDK 52
- Expo Router for navigation
- Solana Mobile Wallet Adapter
- React Native Reanimated for smooth animations

## Getting Started

1. Click the **Run** button to start the development server
2. Scan the QR code with Expo Go (Android) or Camera app (iOS)
3. Connect your Solana wallet to start using the app

## Project Structure

```
app/
├── (tabs)/           # Main tab screens
├── chat/            # Chat related screens
├── components/      # Reusable components
└── constants/       # Theme and configuration
```

## Build Configuration

### Prerequisites
- Node.js 20+ (automatically provided by Replit)
- Expo CLI
- Android Studio or Expo Go app for testing

### Environment Setup
1. Install dependencies:
```bash
npm install
```

2. Configure Solana Mobile Wallet Adapter:
```bash
npm install @solana/web3.js @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol buffer
npx expo install expo-crypto
```

### Development
1. Start the development server:
- Click the "Run" button in Replit, or
- Run `npx expo start` in the console

2. Test the app:
- Scan QR code with Expo Go (Android)
- Use Android Studio for development build
- Web preview in Replit

### Building for Android
1. Configure EAS Build:
```bash
npx eas init
```

2. Create preview build:
- Use the "EAS Publish Preview Android" workflow
- Or run: `npx eas build --platform android --profile preview`

## Development

The app uses Expo's development server. After starting the app:

- Press 'r' to reload
- Press 'm' to toggle the menu
- Press 'w' to open in web browser

## Features in Development

- [ ] Item search and filtering
- [ ] Rating system
- [ ] Transaction history
- [ ] Push notifications

Made with ❤️ on Replit