const UI = (function() {
    const elements = {
        tableBody: document.getElementById('table-body'),
        totalTransactions: document.getElementById('total-transactions'),
        totalSpent: document.getElementById('total-spent'),
        topCategory: document.getElementById('top-category'),
        budgetMessage: document.getElementById('budget-text'),
        budgetMessageContainer: document.getElementById('budget-message'),
        descriptionError: document.getElementById('description-error'),
        amountError: document.getElementById('amount-error'),
        dateError: document.getElementById('date-error'),
        categoryError: document.getElementById('category-error'),
        budgetCap: document.getElementById('budget-cap'),
        searchInput: document.getElementById('search-input')
    };

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function calculateStats(records) {
        const totalTransactions = records.length;
        const totalSpent = records.reduce((sum, record) => sum + Number(record.amount), 0);
        const categoryCounts = records.reduce((counts, record) => {
            const category = record.category;
            counts[category] = (counts[category] || 0) + 1;
            return counts;
        }, {});
        let topCategory = '-';
        let maxCount = 0;
        for (const [category, count] of Object.entries(categoryCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topCategory = category;
            }
        }
        return { totalTransactions, totalSpent, topCategory };
    }

    return {
        renderTable(records, searchTerm = '') {
            if (!elements.tableBody) {
                console.error('Table body element not found');
                return;
            }
            if (records.length === 0) {
                elements.tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No transactions found</td></tr>';
                return;
            }
            const rows = records.map(record => {
                const description = searchTerm ? Search.highlightText(record.description, searchTerm) : record.description;
                return `
                    <tr data-id="${record.id}">
                        <td>${formatDate(record.date)}</td>
                        <td>${description}</td>
                        <td>${record.category}</td>
                        <td>${formatCurrency(record.amount)}</td>
                        <td>
                            <button class="delete-btn" onclick="App.deleteTransaction('${record.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
            elements.tableBody.innerHTML = rows;
        },

        updateDashboard(records, budgetCap) {
            const stats = calculateStats(records);
            if (elements.totalTransactions) {
                elements.totalTransactions.textContent = stats.totalTransactions;
            }
            if (elements.totalSpent) {
                elements.totalSpent.textContent = formatCurrency(stats.totalSpent);
            }
            if (elements.topCategory) {
                elements.topCategory.textContent = stats.topCategory || '-';
            }
            if (elements.budgetMessage && elements.budgetMessageContainer) {
                if (stats.totalSpent > budgetCap) {
                    elements.budgetMessage.textContent = `⚠️ OVER BUDGET! Spent ${formatCurrency(stats.totalSpent)} of ${formatCurrency(budgetCap)}`;
                    elements.budgetMessageContainer.setAttribute('aria-live', 'assertive');
                } else {
                    const remaining = budgetCap - stats.totalSpent;
                    elements.budgetMessage.textContent = `✅ Within budget. ${formatCurrency(remaining)} remaining of ${formatCurrency(budgetCap)}`;
                    elements.budgetMessageContainer.setAttribute('aria-live', 'polite');
                }
            }
        },

        showErrors(errors) {
            this.clearErrors();
            if (errors.description && elements.descriptionError) {
                elements.descriptionError.textContent = errors.description;
            }
            if (errors.amount && elements.amountError) {
                elements.amountError.textContent = errors.amount;
            }
            if (errors.date && elements.dateError) {
                elements.dateError.textContent = errors.date;
            }
            if (errors.category && elements.categoryError) {
                elements.categoryError.textContent = errors.category;
            }
        },

        clearErrors() {
            const errorElements = [
                elements.descriptionError,
                elements.amountError,
                elements.dateError,
                elements.categoryError
            ];
            errorElements.forEach(el => { if (el) el.textContent = ''; });
        },

        resetForm() {
            const form = document.getElementById('transaction-form');
            if (form) {
                form.reset();
            }
            this.clearErrors();
        },

        setBudgetCap(cap) {
            if (elements.budgetCap) {
                elements.budgetCap.value = cap;
            }
        },

        getSearchTerm() {
            return elements.searchInput ? elements.searchInput.value : '';
        }
    };
})();