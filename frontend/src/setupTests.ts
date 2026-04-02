import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Ensure TextEncoder is available (JSDOM usually has it but sometimes needs polyfill in older envs, safe to keep or rely on default)
// JSDOM 16+ has TextEncoder/TextDecoder. If tests fail on encoding, we can add it here.

