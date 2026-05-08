import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global ResizeObserver if needed for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
