import { search } from './search.js';

function el(id) {
    return document.getElementById(id);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatCurrency(amount, currencyCode = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style:                 'currency',
        currency:              currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
    });
}

function buildConversionTitle(amount, settings) {
    const c2 = (amount * settings.currency2.rate).toFixed(2);
    const c3 = (amount * settings.currency3.rate).toFixed(2);
    return `${settings.currency2.code} ${c2} · ${settings.currency3.code} ${c3}`;
}

function renderTrendChart(last7Records) {
    const chart = el('trend-chart');
    if (!chart) return;

    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d;
    });

    const totals = days.map(day => {
        const key = day.toISOString().slice(0, 10);
        return last7Records
            .filter(r => r.date === key)
            .reduce((sum, r) => sum + r.amount, 0);
    });

    const max = Math.max(...totals, 1);

    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    chart.innerHTML = days.map((day, i) => {
        const heightPct = Math.round((totals[i] / max) * 100);
        const label = labels[day.getDay()];
        const title = `${label}: ${formatCurrency(totals[i])}`;
        return `<div class="chart-bar"
                     style="height:${heightPct}%"
                     title="${escapeHtml(title)}"
                     aria-label="${escapeHtml(title)}">
                    <span class="chart-label">${label}</span>
                </div>`;
    }).join('');
}

export const ui = {

    renderTable(records, searchTerm = '', caseInsensitive = false) {
        const body = el('table-body');
        if (!body) return;

        if (records.length === 0) {
            body.innerHTML = `<tr><td colspan="5" class="table-empty">No transactions found. Add one above.</td></tr>`;
            return;
        }

        body.innerHTML = records.map(record => {
            const description = searchTerm
                ? search.highlightText(record.description, searchTerm, caseInsensitive)
                : escapeHtml(record.description);

            const category = searchTerm
                ? search.highlightText(record.category, searchTerm, caseInsensitive)
                : escapeHtml(record.category);

            return `<tr>
                <td>${escapeHtml(formatDate(record.date))}</td>
                <td>${description}</td>
                <td>${category}</td>
                <td>${escapeHtml(formatCurrency(record.amount))}</td>
                <td>
                    <button class="btn-edit"
                            data-action="edit"
                            data-id="${escapeHtml(record.id)}">Edit</button>
                    <button class="btn-danger"
                            data-action="delete"
                            data-id="${escapeHtml(record.id)}">Delete</button>
                </td>
            </tr>`;
        }).join('');
    },

    updateDashboard({ totalSpent, topCategory, totalCount, budgetCap, settings, last7Records }) {
        const totalTransactionsEl = el('total-transactions');
        const totalSpentEl        = el('total-spent');
        const topCategoryEl       = el('top-category');
        const budgetText          = el('budget-text');
        const budgetContainer     = el('budget-message');

        if (totalTransactionsEl) totalTransactionsEl.textContent = totalCount;

        if (totalSpentEl) {
            totalSpentEl.textContent = formatCurrency(totalSpent, settings?.baseCurrency ?? 'USD');
            if (settings) {
                totalSpentEl.title = buildConversionTitle(totalSpent, settings);
            }
        }

        if (topCategoryEl) topCategoryEl.textContent = topCategory ?? '—';

        if (budgetText && budgetContainer) {
            if (totalSpent > budgetCap) {
                const over = totalSpent - budgetCap;
                budgetText.textContent = `Over budget by ${formatCurrency(over, settings?.baseCurrency ?? 'USD')} (cap: ${formatCurrency(budgetCap, settings?.baseCurrency ?? 'USD')})`;
                budgetContainer.setAttribute('aria-live', 'assertive');
                budgetContainer.style.background = '#fdecea';
                budgetContainer.style.color      = '#c0392b';
                budgetContainer.style.borderColor= '#e74c3c';
            } else {
                const remaining = budgetCap - totalSpent;
                budgetText.textContent = `Within budget — ${formatCurrency(remaining, settings?.baseCurrency ?? 'USD')} remaining of ${formatCurrency(budgetCap, settings?.baseCurrency ?? 'USD')}`;
                budgetContainer.setAttribute('aria-live', 'polite');
                budgetContainer.style.background  = '';
                budgetContainer.style.color       = '';
                budgetContainer.style.borderColor = '';
            }
        }

        renderTrendChart(last7Records ?? []);
    },

    showErrors(errors) {
        this.clearErrors();
        const fields = ['description', 'amount', 'category', 'date'];
        fields.forEach(field => {
            if (errors[field]) {
                const errorEl = el(`${field}-error`);
                const inputEl = el(field);
                if (errorEl) errorEl.textContent = errors[field];
                if (inputEl) inputEl.classList.add('invalid');
            }
        });
    },

    clearErrors() {
        const fields = ['description', 'amount', 'category', 'date'];
        fields.forEach(field => {
            const errorEl = el(`${field}-error`);
            const inputEl = el(field);
            if (errorEl) errorEl.textContent = '';
            if (inputEl) inputEl.classList.remove('invalid');
        });
    },

    resetForm() {
        const form = el('transaction-form');
        if (form) form.reset();
        this.clearErrors();
    },

    setSubmitLabel(label) {
        const btn = document.querySelector('#transaction-form button[type="submit"]');
        if (btn) btn.textContent = label;
    },

};