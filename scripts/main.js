const App = (function() {
    let currentSort = { field: 'date', direction: 'desc' };
    let currentSearchTerm = '';

    function sortRecords(records, field, direction) {
        const sorted = [...records];
        sorted.sort((a, b) => {
            let valueA, valueB;
            switch (field) {
                case 'date':
                    valueA = new Date(a.date).getTime();
                    valueB = new Date(b.date).getTime();
                    break;
                case 'description':
                    valueA = a.description.toLowerCase();
                    valueB = b.description.toLowerCase();
                    break;
                case 'amount':
                    valueA = Number(a.amount);
                    valueB = Number(b.amount);
                    break;
                default:
                    return 0;
            }
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
        return sorted;
    }

    function refreshUI() {
        const allRecords = State.getRecords();
        const budgetCap = State.getBudgetCap();
        let displayRecords = allRecords;
        if (currentSearchTerm) {
            displayRecords = Search.searchRecords(allRecords, currentSearchTerm);
        }
        displayRecords = sortRecords(displayRecords, currentSort.field, currentSort.direction);
        UI.renderTable(displayRecords, currentSearchTerm);
        UI.updateDashboard(allRecords, budgetCap);
    }

    function persistState() {
        const records = State.getRecords();
        const budgetCap = State.getBudgetCap();
        Storage.saveData(records, budgetCap);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const formData = {
            description: document.getElementById('description').value,
            amount: document.getElementById('amount').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };
        const validation = Validators.validateForm(formData);
        if (!validation.isValid) {
            UI.showErrors(validation.errors);
            return;
        }
        State.addRecord(formData);
        persistState();
        refreshUI();
        UI.resetForm();
    }

    function handleSortClick(e) {
        const field = e.target.dataset.sort;
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'asc';
        }
        refreshUI();
    }

    function handleSearchInput(e) {
        currentSearchTerm = e.target.value;
        refreshUI();
    }

    function handleSaveCap() {
        const capInput = document.getElementById('budget-cap');
        const newCap = Number(capInput.value);
        if (!isNaN(newCap) && newCap >= 0) {
            State.setBudgetCap(newCap);
            Storage.saveBudgetCap(newCap);
            refreshUI();
        }
    }

    function handleExport() {
        const records = State.getRecords();
        const budgetCap = State.getBudgetCap();
        const data = {
            records: records,
            budgetCap: budgetCap,
            exportedAt: new Date().toISOString()
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!Array.isArray(importedData.records)) {
                    alert('Invalid file format: missing records array');
                    return;
                }
                State.setRecords(importedData.records);
                if (importedData.budgetCap) {
                    State.setBudgetCap(importedData.budgetCap);
                }
                persistState();
                refreshUI();
                e.target.value = '';
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            State.deleteRecord(id);
            persistState();
            refreshUI();
        }
    }

    return {
        init() {
            console.log('Initializing Student Finance Tracker...');
            const savedData = Storage.loadData();
            State.setRecords(savedData.records);
            State.setBudgetCap(savedData.budgetCap);
            UI.setBudgetCap(State.getBudgetCap());
            refreshUI();
            this.setupEventListeners();
            console.log('Initialization complete!');
        },

        setupEventListeners() {
            const form = document.getElementById('transaction-form');
            if (form) form.addEventListener('submit', handleFormSubmit);
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.addEventListener('click', handleSortClick);
            });
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.addEventListener('input', handleSearchInput);
            const saveCapBtn = document.getElementById('save-cap');
            if (saveCapBtn) saveCapBtn.addEventListener('click', handleSaveCap);
            const exportBtn = document.getElementById('export-data');
            if (exportBtn) exportBtn.addEventListener('click', handleExport);
            const importFile = document.getElementById('import-file');
            if (importFile) importFile.addEventListener('change', handleImport);
        },

        deleteTransaction: deleteTransaction
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});