const CATEGORIES = ['Food', 'Books', 'Transport', 'Entertainment', 'Fees', 'Other'];

const PATTERNS = {
    description:    /^\S(?:(?!\s{2})[\s\S])*\S$|^\S$/,
    amount:         /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date:           /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    category:       /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    duplicateWords: /\b(\w{4,})\b(?=.*\b\1\b)/i,
};

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function validateDescription(value) {
    if (!value || value.trim() === '') {
        return { isValid: false, message: 'Description is required.' };
    }
    if (value.length < 3) {
        return { isValid: false, message: 'Description must be at least 3 characters.' };
    }
    if (value.length > 50) {
        return { isValid: false, message: 'Description must be 50 characters or fewer.' };
    }
    if (!PATTERNS.description.test(value)) {
        return { isValid: false, message: 'Description cannot start or end with a space, or contain consecutive spaces.' };
    }
    if (PATTERNS.duplicateWords.test(value)) {
        return { isValid: false, message: 'Description contains a repeated word — try being more specific.' };
    }
    return { isValid: true, message: '' };
}

function validateAmount(value) {
    if (value === undefined || value === null || value === '') {
        return { isValid: false, message: 'Amount is required.' };
    }
    const raw = String(value).trim();
    if (!PATTERNS.amount.test(raw)) {
        return { isValid: false, message: 'Amount must be a positive number with up to 2 decimal places.' };
    }
    const amount = Number(raw);
    if (amount <= 0) {
        return { isValid: false, message: 'Amount must be greater than 0.' };
    }
    if (amount > 1_000_000) {
        return { isValid: false, message: 'Amount cannot exceed $1,000,000.' };
    }
    return { isValid: true, message: '' };
}

function validateDate(value) {
    if (!value) {
        return { isValid: false, message: 'Date is required.' };
    }
    if (!PATTERNS.date.test(value)) {
        return { isValid: false, message: 'Date must be in YYYY-MM-DD format.' };
    }
    const [year] = value.split('-').map(Number);
    if (year < 2000) {
        return { isValid: false, message: 'Date must be from the year 2000 or later.' };
    }
    const inputDate = parseLocalDate(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) {
        return { isValid: false, message: 'Date cannot be in the future.' };
    }
    return { isValid: true, message: '' };
}

function validateCategory(value) {
    if (!value) {
        return { isValid: false, message: 'Please select a category.' };
    }
    if (!CATEGORIES.includes(value)) {
        return { isValid: false, message: 'Please select a valid category.' };
    }
    return { isValid: true, message: '' };
}

export const validators = {

    PATTERNS,

    getCategories() {
        return [...CATEGORIES];
    },

    validateDescription,
    validateAmount,
    validateDate,
    validateCategory,

    validateForm(formData) {
        const results = {
            description: validateDescription(formData.description),
            amount:      validateAmount(formData.amount),
            date:        validateDate(formData.date),
            category:    validateCategory(formData.category),
        };

        const errors = {};
        let isValid = true;

        for (const [field, result] of Object.entries(results)) {
            if (!result.isValid) {
                errors[field] = result.message;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

};