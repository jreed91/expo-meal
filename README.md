# Expo Meal

A modern React Native application built with Expo, TypeScript, and Tailwind CSS (NativeWind).

## Features

- ⚡️ **Expo Router** - File-based routing for React Native
- 🎨 **NativeWind v4** - Tailwind CSS for React Native
- 📱 **TypeScript** - Type-safe code
- 🧪 **Vitest** - Fast unit testing with React Native Testing Library
- 🗃️ **Zustand** - Lightweight state management
- 🎯 **ESLint & Prettier** - Code quality and formatting
- 🚀 **GitHub Actions** - Automated CI/CD pipelines

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
│       ├── ios-build.yml  # iOS build pipeline
│       ├── test.yml       # Test pipeline
│       └── lint.yml       # Lint pipeline
├── global.css             # Global Tailwind styles
├── tailwind.config.js     # Tailwind configuration
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
      <Text className="text-2xl font-bold text-blue-500">
        Hello NativeWind!
      </Text>
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

1. **iOS Build** - Builds the iOS app on push/PR to main/develop
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
