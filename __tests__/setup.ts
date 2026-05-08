import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';

// React 19 compatibility: Ensure act is available
// Some environments might not expose it correctly through all import paths
if (typeof (React as unknown as { act: unknown }).act !== 'function') {
  // Use a simple fallback if act is missing in the test environment
  // @ts-expect-error - act might be missing on React type in some versions
  React.act = (cb: () => Promise<void> | void) => {
    const result = cb();
    if (result instanceof Promise) {
      return result;
    }
    return Promise.resolve();
  };
}

// Mock global ResizeObserver if needed for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));



