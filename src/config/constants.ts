/**
 * Global mock-mode flag.
 * Priority: localStorage "DEV_MOCK_MODE" → env var NEXT_PUBLIC_IS_MOCK_MODE.
 */
 const isClient = typeof window !== 'undefined';

const getGlobal = () => {
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    return {} as any;
};

const g = getGlobal();

/**
 * Allows tests to override the mock mode.
 * @param value true to force mock mode, false to force real mode, null to reset to default.
 */
export const setTestMockOverride = (value: boolean | null) => {
    g.__TEST_MOCK_OVERRIDE__ = value;
};

/**
 * Returns true if the application should run in mock mode.
 * Prioritizes test override, then localStorage, then fallback to env var.
 */
export const getIsMockMode = (): boolean => {
    if (g.__TEST_MOCK_OVERRIDE__ !== undefined && g.__TEST_MOCK_OVERRIDE__ !== null) {
        return g.__TEST_MOCK_OVERRIDE__;
    }
    if (isClient) {
        const devMock = localStorage.getItem('DEV_MOCK_MODE');
        if (devMock !== null) {
            return devMock === 'true';
        }
    }
    return process.env.NEXT_PUBLIC_IS_MOCK_MODE === 'true';
};

// For backward compatibility and simple usage where reactivity isn't needed immediately
export const IS_MOCK_MODE = getIsMockMode();
