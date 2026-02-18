const Validators = (function() {
    const CATEGORIES = ['Food', 'Transport', 'Books', 'Supplies', 'Entertainment', 'Other'];

    function hasDuplicateWords(text) {
        const words = text.toLowerCase().split(/\s+/);
        const seenWords = new Set();
        for (const word of words) {
            if (word.length <= 3) continue;
            if (seenWords.has(word)) return true;
            seenWords.add(word);
        }
        return false;
    }

    function isSafeText(text) {
        return !/[<>{}]/.test(text);
    }

    return {
        validateDescription(value) {
            if (!value || value.trim() === '') {
                return { isValid: false, message: 'Description is required' };
            }
            const trimmed = value.trim();
            if (trimmed.length < 3) {
                return { isValid: false, message: 'Description must be at least 3 characters' };
            }
            if (trimmed.length > 50) {
                return { isValid: false, message: 'Description must be less than 50 characters' };
            }
            if (!isSafeText(trimmed)) {
                return { isValid: false, message: 'Description contains invalid characters' };
            }
            if (hasDuplicateWords(trimmed)) {
                return { isValid: false, message: 'Description contains duplicate words (try to be more specific)' };
            }
            return { isValid: true, message: '' };
        },

        validateAmount(value) {
            if (value === undefined || value === null || value === '') {
                return { isValid: false, message: 'Amount is required' };
            }
            const amount = Number(value);
            if (isNaN(amount)) {
                return { isValid: false, message: 'Amount must be a number' };
            }
            if (amount <= 0) {
                return { isValid: false, message: 'Amount must be greater than 0' };
            }
            if (amount > 1000000) {
                return { isValid: false, message: 'Amount cannot exceed $1,000,000' };
            }
            const valueString = value.toString();
            if (valueString.includes('.')) {
                const decimalPlaces = valueString.split('.')[1].length;
                if (decimalPlaces > 2) {
                    return { isValid: false, message: 'Amount can only have up to 2 decimal places' };
                }
            }
            return { isValid: true, message: '' };
        },

        validateDate(value) {
            if (!value) {
                return { isValid: false, message: 'Date is required' };
            }
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { isValid: false, message: 'Please enter a valid date' };
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const inputDate = new Date(value);
            inputDate.setHours(0, 0, 0, 0);
            if (inputDate > today) {
                return { isValid: false, message: 'Date cannot be in the future' };
            }
            return { isValid: true, message: '' };
        },

        validateCategory(value) {
            if (!value) {
                return { isValid: false, message: 'Please select a category' };
            }
            if (!CATEGORIES.includes(value)) {
                return { isValid: false, message: 'Please select a valid category' };
            }
            return { isValid: true, message: '' };
        },

        validateForm(formData) {
            const errors = {};
            let isValid = true;

            const descValidation = this.validateDescription(formData.description);
            if (!descValidation.isValid) {
                errors.description = descValidation.message;
                isValid = false;
            }

            const amountValidation = this.validateAmount(formData.amount);
            if (!amountValidation.isValid) {
                errors.amount = amountValidation.message;
                isValid = false;
            }

            const dateValidation = this.validateDate(formData.date);
            if (!dateValidation.isValid) {
                errors.date = dateValidation.message;
                isValid = false;
            }

            const categoryValidation = this.validateCategory(formData.category);
            if (!categoryValidation.isValid) {
                errors.category = categoryValidation.message;
                isValid = false;
            }

            return { isValid, errors };
        },

        validateSearchTerm(term) {
            if (!term || term.trim() === '') {
                return { isValid: true, message: '' };
            }
            try {
                new RegExp(term);
                return { isValid: true, message: '' };
            } catch (e) {
                return { isValid: false, message: 'Invalid search pattern: ' + e.message };
            }
        },

        getCategories() {
            return [...CATEGORIES];
        }
    };
})();