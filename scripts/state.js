const _records = [];

let _editingId = null;

let _settings = {
    budgetCap:     500,
    baseCurrency:  'USD',
    currency2:     { code: 'EUR', rate: 0.92 },
    currency3:     { code: 'KES', rate: 130 },
};

function generateId() {
    return 'txn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function deepCopyRecord(record) {
    return { ...record };
}

export const state = {

    getRecords() {
        return _records.map(deepCopyRecord);
    },

    setRecords(incoming) {
        if (!Array.isArray(incoming)) return;
        _records.length = 0;
        incoming.forEach(r => _records.push(deepCopyRecord(r)));
    },

    addRecord(fields) {
        if (!fields || !fields.description || !fields.amount || !fields.category || !fields.date) {
            return null;
        }
        const now = new Date().toISOString();
        const record = {
            description: fields.description,
            amount:      Number(fields.amount),
            category:    fields.category,
            date:        fields.date,
            id:          generateId(),
            createdAt:   now,
            updatedAt:   now,
        };
        _records.push(record);
        return deepCopyRecord(record);
    },

    updateRecord(id, updates) {
        const index = _records.findIndex(r => r.id === id);
        if (index === -1) return null;

        const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safeUpdates } = updates;

        _records[index] = {
            ..._records[index],
            ...safeUpdates,
            updatedAt: new Date().toISOString(),
        };
        return deepCopyRecord(_records[index]);
    },

    deleteRecord(id) {
        const index = _records.findIndex(r => r.id === id);
        if (index === -1) return null;
        const deleted = deepCopyRecord(_records[index]);
        _records.splice(index, 1);
        return deleted;
    },

    findRecord(id) {
        const found = _records.find(r => r.id === id);
        return found ? deepCopyRecord(found) : null;
    },

    clearAllRecords() {
        _records.length = 0;
    },

    getEditingId() {
        return _editingId;
    },

    setEditingId(id) {
        _editingId = id || null;
    },

    clearEditingId() {
        _editingId = null;
    },

    isEditing() {
        return _editingId !== null;
    },

    getSettings() {
        return { ..._settings, currency2: { ..._settings.currency2 }, currency3: { ..._settings.currency3 } };
    },

    getBudgetCap() {
        return _settings.budgetCap;
    },

    setBudgetCap(cap) {
        const parsed = Number(cap);
        if (!Number.isFinite(parsed) || parsed < 0) return null;
        _settings.budgetCap = parsed;
        return _settings.budgetCap;
    },

    setCurrencies({ baseCurrency, currency2, currency3 }) {
        if (baseCurrency) _settings.baseCurrency = String(baseCurrency).toUpperCase().slice(0, 3);
        if (currency2?.code) _settings.currency2.code = String(currency2.code).toUpperCase().slice(0, 3);
        if (Number.isFinite(Number(currency2?.rate))) _settings.currency2.rate = Number(currency2.rate);
        if (currency3?.code) _settings.currency3.code = String(currency3.code).toUpperCase().slice(0, 3);
        if (Number.isFinite(Number(currency3?.rate))) _settings.currency3.rate = Number(currency3.rate);
    },

    resetSettings() {
        _settings = {
            budgetCap:    500,
            baseCurrency: 'USD',
            currency2:    { code: 'EUR', rate: 0.92 },
            currency3:    { code: 'KES', rate: 130 },
        };
    },

    getTotalSpent() {
        return _records.reduce((sum, r) => sum + r.amount, 0);
    },

    getTopCategory() {
        if (_records.length === 0) return null;
        const counts = {};
        _records.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    },

    getRecordsInLastDays(days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return _records
            .filter(r => new Date(r.date) >= cutoff)
            .map(deepCopyRecord);
    },

};