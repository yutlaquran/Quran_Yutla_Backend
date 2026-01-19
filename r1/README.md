# Quran Yutla Mobile App

A React Native mobile application for the Quran Yutla platform.

## Features

- Beautiful splash screen with Islamic geometric design
- Teal themed UI matching the brand identity
- Arabic RTL support
- Cross-platform (iOS & Android)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
```bash
cd r1
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Install Expo Go app on your phone
- Scan the QR code from the terminal

Or run on emulator:
```bash
npm run android  # For Android
npm run ios      # For iOS
```

## Project Structure

```
r1/
├── App.js                      # Main app component with navigation
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── src/
│   └── screens/
│       ├── SplashScreen.js     # Splash screen with Islamic design
│       └── HomeScreen.js       # Main home screen
└── assets/                     # Images and fonts
```

## Theme Colors

- Primary: `#4A9B8E` (Teal)
- Background: `#F5F5F5` (Light Gray)
- Text: `#333333` (Dark Gray)

## License

Private - Quran Yutla Platform
