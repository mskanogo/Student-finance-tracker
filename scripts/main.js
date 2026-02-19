import { state } from './state.js';
import { storage } from './storage.js';
import { validators } from './validators.js';
import { search } from './search.js';
import { ui } from './ui.js';

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

let currentSort = { field: 'date', direction: 'desc' };
let currentSearchTerm = '';
let caseInsensitive = false;

function persist() {
    storage.save({
        records:  state.getRecords(),
        settings: state.getSettings(),
    });
}

function refreshUI() {
    const allRecords = state.getRecords();
    let displayed = currentSearchTerm
        ? search.searchRecords(allRecords, currentSearchTerm, caseInsensitive)
        : allRecords;

    displayed = sortRecords(displayed, currentSort.field, currentSort.direction);

    ui.renderTable(displayed, currentSearchTerm);
    ui.updateDashboard({
        totalSpent:   state.getTotalSpent(),
        topCategory:  state.getTopCategory(),
        totalCount:   allRecords.length,
        budgetCap:    state.getBudgetCap(),
        settings:     state.getSettings(),
        last7Records: state.getRecordsInLastDays(7),
    });
}

function sortRecords(records, field, direction) {
    return [...records].sort((a, b) => {
        let va, vb;
        if (field === 'date') {
            va = new Date(a.date).getTime();
            vb = new Date(b.date).getTime();
        } else if (field === 'description') {
            va = a.description.toLowerCase();
            vb = b.description.toLowerCase();
        } else if (field === 'amount') {
            va = Number(a.amount);
            vb = Number(b.amount);
        } else {
            return 0;
        }
        if (va === vb) return 0;
        return (va > vb ? 1 : -1) * (direction === 'asc' ? 1 : -1);
    });
}

function updateSortButtons(activeField) {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === activeField);
    });
}

function setImportFeedback(message, type) {
    const el = document.getElementById('import-feedback');
    if (!el) return;
    el.textContent = message;
    el.className = type;
}

function setStatusMessage(message) {
    const el = document.getElementById('status-message');
    if (el) el.textContent = message;
}

function validateImportRecord(record) {
    if (typeof record !== 'object' || record === null) return false;
    if (!record.id || !record.description || !record.category || !record.date) return false;
    if (!Number.isFinite(Number(record.amount))) return false;
    if (!DATE_REGEX.test(record.date)) return false;
    return true;
}

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        description: document.getElementById('description').value.trim(),
        amount:      document.getElementById('amount').value,
        category:    document.getElementById('category').value,
        date:        document.getElementById('date').value,
    };

    const validation = validators.validateForm(formData);

    if (!validation.isValid) {
        ui.showErrors(validation.errors);
        return;
    }

    ui.clearErrors();

    if (state.isEditing()) {
        state.updateRecord(state.getEditingId(), formData);
        state.clearEditingId();
        ui.resetForm();
        ui.setSubmitLabel('Add Transaction');
        setStatusMessage('Transaction updated.');
    } else {
        state.addRecord(formData);
        ui.resetForm();
        setStatusMessage('Transaction added.');
    }

    persist();
    refreshUI();
}

function handleSortClick(e) {
    const btn = e.currentTarget;
    const field = btn.dataset.sort;

    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    updateSortButtons(field);
    refreshUI();
}

function handleSearchInput(e) {
    currentSearchTerm = e.target.value;
    refreshUI();
}

function handleCaseToggle(e) {
    caseInsensitive = e.target.checked;
    if (currentSearchTerm) refreshUI();
}

function handleSaveCap() {
    const input = document.getElementById('budget-cap');
    const result = state.setBudgetCap(input.value);
    if (result === null) {
        setStatusMessage('Invalid budget cap value.');
        return;
    }
    persist();
    refreshUI();
    setStatusMessage('Budget cap saved.');
}

function handleSaveRates() {
    state.setCurrencies({
        baseCurrency: document.getElementById('base-currency')?.value,
        currency2: {
            code: document.getElementById('currency2-code')?.value,
            rate: document.getElementById('currency2-rate')?.value,
        },
        currency3: {
            code: document.getElementById('currency3-code')?.value,
            rate: document.getElementById('currency3-rate')?.value,
        },
    });
    persist();
    refreshUI();
    setStatusMessage('Currency rates saved.');
}

function handleExport() {
    const data = {
        records:     state.getRecords(),
        settings:    state.getSettings(),
        exportedAt:  new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `finance-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('Data exported.');
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const parsed = JSON.parse(event.target.result);

            if (!Array.isArray(parsed.records)) {
                setImportFeedback('Import failed: missing records array.', 'error');
                return;
            }

            const invalid = parsed.records.filter(r => !validateImportRecord(r));
            if (invalid.length > 0) {
                setImportFeedback(
                    `Import failed: ${invalid.length} record(s) have missing or invalid fields.`,
                    'error'
                );
                return;
            }

            state.setRecords(parsed.records);

            if (parsed.settings) {
                if (parsed.settings.budgetCap !== undefined) {
                    state.setBudgetCap(parsed.settings.budgetCap);
                }
                if (parsed.settings.baseCurrency) {
                    state.setCurrencies(parsed.settings);
                }
            }

            persist();
            refreshUI();
            e.target.value = '';
            setImportFeedback(
                `${parsed.records.length} record(s) imported successfully.`,
                'success'
            );
            setStatusMessage('Import complete.');

        } catch (err) {
            setImportFeedback('Import failed: file could not be parsed as JSON.', 'error');
        }
    };
    reader.readAsText(file);
}

function handleTableClick(e) {
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const editBtn   = e.target.closest('[data-action="edit"]');

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const record = state.findRecord(id);
        if (!record) return;
        state.deleteRecord(id);
        persist();
        refreshUI();
        setStatusMessage(`"${record.description}" deleted.`);
    }

    if (editBtn) {
        const id = editBtn.dataset.id;
        const record = state.findRecord(id);
        if (!record) return;
        document.getElementById('description').value = record.description;
        document.getElementById('amount').value      = record.amount;
        document.getElementById('category').value    = record.category;
        document.getElementById('date').value        = record.date;
        state.setEditingId(id);
        ui.setSubmitLabel('Update Transaction');
        document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('description').focus();
    }
}

function handleSidebarOpen() {
    document.body.classList.remove('sidebar-closed');
    document.body.classList.add('sidebar-open');
    document.getElementById('sidebar-close')?.setAttribute('aria-expanded', 'true');
    document.getElementById('sidebar-open')?.setAttribute('aria-expanded', 'true');
}

function handleSidebarClose() {
    document.body.classList.remove('sidebar-open');
    document.body.classList.add('sidebar-closed');
    document.getElementById('sidebar-close')?.setAttribute('aria-expanded', 'false');
    document.getElementById('sidebar-open')?.setAttribute('aria-expanded', 'false');
}

function setupEventListeners() {
    document.getElementById('transaction-form')
        ?.addEventListener('submit', handleFormSubmit);

    document.querySelectorAll('.sort-btn').forEach(btn =>
        btn.addEventListener('click', handleSortClick)
    );

    document.getElementById('search-input')
        ?.addEventListener('input', handleSearchInput);

    document.getElementById('search-case')
        ?.addEventListener('change', handleCaseToggle);

    document.getElementById('save-cap')
        ?.addEventListener('click', handleSaveCap);

    document.getElementById('save-rates')
        ?.addEventListener('click', handleSaveRates);

    document.getElementById('export-data')
        ?.addEventListener('click', handleExport);

    document.getElementById('import-file')
        ?.addEventListener('change', handleImport);

    document.getElementById('table-body')
        ?.addEventListener('click', handleTableClick);

    document.getElementById('sidebar-open')
        ?.addEventListener('click', handleSidebarOpen);

    document.getElementById('sidebar-close')
        ?.addEventListener('click', handleSidebarClose);

    document.getElementById('overlay')
        ?.addEventListener('click', handleSidebarClose);

    document.getElementById('transaction-form')
        ?.addEventListener('reset', () => {
            state.clearEditingId();
            ui.setSubmitLabel('Add Transaction');
            ui.clearErrors();
        });
}

function init() {
    const saved = storage.load();
    state.setRecords(saved.records ?? []);

    if (saved.settings?.budgetCap !== undefined) {
        state.setBudgetCap(saved.settings.budgetCap);
    }
    if (saved.settings?.baseCurrency) {
        state.setCurrencies(saved.settings);
    }

    const budgetInput = document.getElementById('budget-cap');
    if (budgetInput) budgetInput.value = state.getBudgetCap();

    const settings = state.getSettings();
    const baseCurrencyInput = document.getElementById('base-currency');
    if (baseCurrencyInput) baseCurrencyInput.value = settings.baseCurrency;

    const c2Code = document.getElementById('currency2-code');
    const c2Rate = document.getElementById('currency2-rate');
    if (c2Code) c2Code.value = settings.currency2.code;
    if (c2Rate) c2Rate.value = settings.currency2.rate;

    const c3Code = document.getElementById('currency3-code');
    const c3Rate = document.getElementById('currency3-rate');
    if (c3Code) c3Code.value = settings.currency3.code;
    if (c3Rate) c3Rate.value = settings.currency3.rate;

    updateSortButtons(currentSort.field);
    setupEventListeners();
    refreshUI();
}

document.addEventListener('DOMContentLoaded', init);