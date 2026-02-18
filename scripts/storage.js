const Storage = (function() {
    const STORAGE_KEY = 'student_finance_tracker';
    const CAP_KEY = 'budget_cap_backup';

    function isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('localStorage is not available:', e);
            return false;
        }
    }

    function isValidStoredData(data) {
        return (
            data &&
            typeof data === 'object' &&
            (data.records === undefined || Array.isArray(data.records)) &&
            (data.budgetCap === undefined || typeof data.budgetCap === 'number')
        );
    }

    return {
        saveData(records, budgetCap) {
            if (!isStorageAvailable()) {
                alert('Warning: localStorage is not available. Your data will not persist after closing the browser.');
                return false;
            }
            try {
                const dataToStore = {
                    records: records,
                    budgetCap: budgetCap,
                    lastUpdated: new Date().toISOString(),
                    version: '1.0'
                };
                const jsonString = JSON.stringify(dataToStore);
                localStorage.setItem(STORAGE_KEY, jsonString);
                console.log(`Data saved: ${records.length} records`);
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    alert('Storage quota exceeded. Try deleting some records.');
                } else {
                    console.error('Error saving to localStorage:', error);
                }
                return false;
            }
        },

        loadData() {
            const defaults = { records: [], budgetCap: 500 };
            if (!isStorageAvailable()) {
                console.warn('localStorage not available, using defaults');
                return defaults;
            }
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) {
                    console.log('No saved data found, using defaults');
                    return defaults;
                }
                const parsed = JSON.parse(stored);
                if (!isValidStoredData(parsed)) {
                    console.error('Invalid data structure in localStorage');
                    return defaults;
                }
                return {
                    records: Array.isArray(parsed.records) ? parsed.records : [],
                    budgetCap: typeof parsed.budgetCap === 'number' ? parsed.budgetCap : 500
                };
            } catch (error) {
                console.error('Error loading from localStorage:', error);
                localStorage.removeItem(STORAGE_KEY);
                return defaults;
            }
        },

        saveBudgetCap(cap) {
            try {
                localStorage.setItem(CAP_KEY, JSON.stringify(cap));
                return true;
            } catch (error) {
                console.error('Error saving budget cap:', error);
                return false;
            }
        },

        loadBudgetCap() {
            try {
                const cap = localStorage.getItem(CAP_KEY);
                return cap ? JSON.parse(cap) : 500;
            } catch (error) {
                console.error('Error loading budget cap:', error);
                return 500;
            }
        },

        exportData() {
            const records = State.getRecords();
            const budgetCap = State.getBudgetCap();
            const exportObject = {
                records: records,
                budgetCap: budgetCap,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            return JSON.stringify(exportObject, null, 2);
        },

        importData(jsonString) {
            try {
                const imported = JSON.parse(jsonString);
                if (!isValidStoredData(imported)) {
                    throw new Error('Invalid data format');
                }
                return {
                    records: imported.records || [],
                    budgetCap: imported.budgetCap || 500
                };
            } catch (error) {
                console.error('Error importing data:', error);
                return null;
            }
        },

        clearAll() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(CAP_KEY);
                console.log('All storage cleared');
            } catch (error) {
                console.error('Error clearing storage:', error);
            }
        },

        getStorageInfo() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                const size = stored ? new Blob([stored]).size : 0;
                return {
                    hasData: !!stored,
                    sizeBytes: size,
                    sizeKB: Math.round(size / 1024 * 100) / 100,
                    lastUpdated: stored ? JSON.parse(stored).lastUpdated : null
                };
            } catch (error) {
                return { error: error.message };
            }
        }
    };
})();