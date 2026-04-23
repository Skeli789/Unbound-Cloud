// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { vi } from 'vitest';

vi.mock("darkreader", () =>
({
    enable: vi.fn(),
    disable: vi.fn(),
    auto: vi.fn(),
    setFetchMethod: vi.fn(),
    isEnabled: vi.fn()
}));
