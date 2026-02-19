function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function safeRegex(pattern, flags) {
    try {
        return new RegExp(pattern, flags);
    } catch {
        return null;
    }
}

export const search = {

    isValidPattern(term) {
        if (!term || term.trim() === '') return true;
        return safeRegex(term.trim()) !== null;
    },

    searchRecords(records, searchTerm, caseInsensitive = false) {
        if (!searchTerm || searchTerm.trim() === '') return records;

        const flags = caseInsensitive ? 'i' : '';
        const regex = safeRegex(searchTerm.trim(), flags);
        if (!regex) return [];

        return records.filter(record => {
            return (
                regex.test(record.description) ||
                regex.test(record.category)    ||
                regex.test(String(record.amount)) ||
                regex.test(record.date)
            );
        });
    },

    highlightText(text, searchTerm, caseInsensitive = false) {
        if (!searchTerm || searchTerm.trim() === '') return escapeHtml(text);

        const flags = caseInsensitive ? 'gi' : 'g';
        const regex = safeRegex(searchTerm.trim(), flags);
        if (!regex) return escapeHtml(text);

        return escapeHtml(text).replace(regex, match => `<mark>${match}</mark>`);
    },

};