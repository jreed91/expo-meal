import { describe, it, expect, beforeEach } from 'vitest';
import { useExampleStore } from '../exampleStore';

describe('Example Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useExampleStore.setState({ count: 0 });
  });

  it('should initialize with count 0', () => {
    const state = useExampleStore.getState();
    expect(state.count).toBe(0);
  });

  it('should increment count', () => {
    const { increment } = useExampleStore.getState();
    increment();
    expect(useExampleStore.getState().count).toBe(1);
  });

  it('should decrement count', () => {
    const { increment, decrement } = useExampleStore.getState();
    increment();
    increment();
    decrement();
    expect(useExampleStore.getState().count).toBe(1);
  });

  it('should reset count to 0', () => {
    const { increment, reset } = useExampleStore.getState();
    increment();
    increment();
    increment();
    reset();
    expect(useExampleStore.getState().count).toBe(0);
  });
});
