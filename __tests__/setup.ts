import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as React from 'react';

// React 19 compatibility: Ensure IS_REACT_ACT_ENVIRONMENT is set
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// React 19 compatibility: Ensure act is available
// Use a more robust check and assignment to avoid "Cannot redefine property" errors
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReact = React as any;
  if (typeof anyReact.act !== 'function') {
    // Check if property is writable/configurable
    const desc = Object.getOwnPropertyDescriptor(React, 'act');
    if (!desc || desc.configurable) {
      Object.defineProperty(React, 'act', {
        value: (cb: () => Promise<void> | void) => {
          const result = cb();
          if (result instanceof Promise) {
            return result;
          }
          return Promise.resolve();
        },
        writable: true,
        configurable: true
      });
    }
  }
} catch (e) {
  console.warn('Could not polyfill React.act, tests might fail if act is missing:', e);
}

// Mock global ResizeObserver if needed for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));



