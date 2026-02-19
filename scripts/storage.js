const STORAGE_KEY = 'sft:data';
const VERSION     = '1.1';

const DEFAULTS = {
    records:  [],
    settings: {
        budgetCap:    500,
        baseCurrency: 'USD',
        currency2:    { code: 'EUR', rate: 0.92 },
        currency3:    { code: 'KES', rate: 130  },
    },
};

let _available = null;

function isAvailable() {
    if (_available !== null) return _available;
    try {
        const k = '__sft_test__';
        localStorage.setItem(k, k);
        localStorage.removeItem(k);
        _available = true;
    } catch {
        _available = false;
    }
    return _available;
}

function isValidShape(data) {
    return (
        data !== null &&
        typeof data === 'object' &&
        (data.records  === undefined || Array.isArray(data.records)) &&
        (data.settings === undefined || typeof data.settings === 'object')
    );
}

export const storage = {

    save({ records, settings }) {
        if (!isAvailable()) return { ok: false, reason: 'unavailable' };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                records,
                settings,
                version:     VERSION,
                lastUpdated: new Date().toISOString(),
            }));
            return { ok: true };
        } catch (err) {
            if (err.name === 'QuotaExceededError') return { ok: false, reason: 'quota' };
            return { ok: false, reason: 'unknown' };
        }
    },

    load() {
        if (!isAvailable()) return { ...DEFAULTS, corrupted: false };
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULTS, corrupted: false };

            const parsed = JSON.parse(raw);

            if (!isValidShape(parsed)) {
                localStorage.removeItem(STORAGE_KEY);
                return { ...DEFAULTS, corrupted: true };
            }

            return {
                records:   Array.isArray(parsed.records)        ? parsed.records   : [],
                settings:  typeof parsed.settings === 'object'  ? parsed.settings  : DEFAULTS.settings,
                corrupted: false,
            };
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            return { ...DEFAULTS, corrupted: true };
        }
    },

    clear() {
        if (!isAvailable()) return;
        localStorage.removeItem(STORAGE_KEY);
    },

    getInfo() {
        if (!isAvailable()) {
            return { available: false, hasData: false, sizeBytes: 0, sizeKB: 0, lastUpdated: null };
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        const size = raw ? new Blob([raw]).size : 0;
        let lastUpdated = null;
        try {
            if (raw) lastUpdated = JSON.parse(raw).lastUpdated ?? null;
        } catch { }
        return {
            available:   true,
            hasData:     !!raw,
            sizeBytes:   size,
            sizeKB:      Math.round(size / 1024 * 100) / 100,
            lastUpdated,
        };
    },

};