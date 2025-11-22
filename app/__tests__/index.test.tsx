import { render, screen } from '@testing-library/react-native';
import { describe, it, expect } from 'vitest';
import TabOneScreen from '../(tabs)/index';

describe('TabOneScreen', () => {
  it('renders the title correctly', () => {
    render(<TabOneScreen />);
    expect(screen.getByText('Tab One')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { container } = render(<TabOneScreen />);
    expect(container).toBeTruthy();
  });
});
