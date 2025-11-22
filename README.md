# Expo Meal

A modern React Native application built with Expo, TypeScript, and Tailwind CSS (NativeWind).

## Features

- ⚡️ **Expo Router** - File-based routing for React Native
- 🎨 **NativeWind v4** - Tailwind CSS for React Native
- 📱 **TypeScript** - Type-safe code
- 🧪 **Vitest** - Fast unit testing with React Native Testing Library
- 🗃️ **Zustand** - Lightweight state management
- 🎯 **ESLint & Prettier** - Code quality and formatting
- 🚀 **EAS Build** - Cloud-based builds with Expo Application Services
- 📦 **GitHub Actions** - Automated CI/CD pipelines

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- iOS Simulator (macOS) or Android Emulator

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd expo-meal
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Run on your preferred platform:
   ```bash
   npm run ios     # Run on iOS
   npm run android # Run on Android
   npm run web     # Run on web
   ```

## Available Scripts

### Development

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser

### Testing

- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### EAS Build

- `npm run build:dev` - Build development iOS app
- `npm run build:preview` - Build preview iOS app for testing
- `npm run build:prod` - Build production iOS app

## EAS Build Setup

This project uses [Expo Application Services (EAS)](https://expo.dev/eas) for building and deploying the app.

### First-time Setup

1. **Install EAS CLI** (already included as dev dependency):

   ```bash
   npm install
   ```

2. **Login to Expo**:

   ```bash
   npx eas login
   ```

3. **Configure your project**:
   ```bash
   npx eas build:configure
   ```

### Building for iOS

The project includes three build profiles:

#### 1. Development Build

For development with Expo's development client:

```bash
npm run build:dev
# or
npx eas build --profile development --platform ios
```

#### 2. Preview Build (Recommended for Testing)

Creates an installable build for testing on physical devices without App Store:

```bash
npm run build:preview
# or
npx eas build --profile preview --platform ios
```

**To install on your device:**

1. Run the preview build command
2. Register your iOS device when prompted (or add it at https://expo.dev)
3. Once the build completes, scan the QR code with your iOS device
4. Download and install the app

#### 3. Production Build

For App Store submission:

```bash
npm run build:prod
# or
npx eas build --profile production --platform ios
```

### Viewing Builds

After running a build command:

- Visit https://expo.dev to see build status
- Builds appear in your project dashboard
- Download the `.ipa` file or install directly on registered devices

### GitHub Actions Integration

EAS builds are automatically triggered via GitHub Actions:

- **Pull Requests**: Triggers preview builds
- **Main/Develop branches**: Triggers appropriate builds based on branch
- **Manual**: Use workflow_dispatch to trigger builds manually from GitHub Actions tab

**Required Secret:**
Add `EXPO_TOKEN` to your GitHub repository secrets:

1. Generate a token: `npx eas build:configure`
2. Go to repository Settings → Secrets and variables → Actions
3. Add new secret named `EXPO_TOKEN` with your token value

## Project Structure

```
expo-meal/
├── app/                    # App routes and screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   ├── __tests__/         # Test files
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── constants/             # App constants
├── store/                 # Zustand stores
├── assets/                # Images, fonts, etc.
├── .github/               # GitHub Actions workflows
│   └── workflows/
│       ├── ios-build.yml  # EAS build pipeline
│       ├── test.yml       # Test pipeline
│       └── lint.yml       # Lint pipeline
├── global.css             # Global Tailwind styles
├── tailwind.config.js     # Tailwind configuration
├── eas.json               # EAS Build configuration
├── vitest.config.ts       # Vitest configuration
└── tsconfig.json          # TypeScript configuration
```

## Styling with NativeWind

This project uses NativeWind v4, which brings Tailwind CSS to React Native. Use className prop for styling:

```tsx
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-500">Hello NativeWind!</Text>
    </View>
  );
}
```

## State Management with Zustand

Example store usage:

```tsx
import { useExampleStore } from '@/store/exampleStore';

export default function Counter() {
  const { count, increment, decrement } = useExampleStore();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-4xl mb-4">{count}</Text>
      <Button title="Increment" onPress={increment} />
      <Button title="Decrement" onPress={decrement} />
    </View>
  );
}
```

## Testing

Tests are written using Vitest and React Native Testing Library:

```tsx
import { render, screen } from '@testing-library/react-native';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

## CI/CD

This project includes three GitHub Actions workflows:

1. **EAS Build** - Builds iOS app using EAS on push/PR to main/develop (requires EXPO_TOKEN secret)
2. **Test** - Runs tests and generates coverage reports
3. **Lint** - Checks code quality with ESLint and Prettier

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass: `npm test -- --run`
4. Ensure linting passes: `npm run lint`
5. Format code: `npm run format`
6. Submit a pull request

## License

MIT
