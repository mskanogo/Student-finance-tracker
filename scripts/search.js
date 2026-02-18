const Search = (function() {
    function safeRegex(pattern, flags = 'gi') {
        try {
            return new RegExp(pattern, flags);
        } catch (error) {
            console.log('Invalid regex pattern:', error.message);
            return null;
        }
    }

    return {
        searchRecords(records, searchTerm) {
            if (!searchTerm || searchTerm.trim() === '') {
                return records;
            }
            const regex = safeRegex(searchTerm.trim());
            if (!regex) {
                return [];
            }
            regex.lastIndex = 0;
            return records.filter(record => {
                regex.lastIndex = 0;
                const descriptionMatch = regex.test(record.description);
                regex.lastIndex = 0;
                const categoryMatch = regex.test(record.category);
                return descriptionMatch || categoryMatch;
            });
        },

        highlightText(text, searchTerm) {
            if (!searchTerm || searchTerm.trim() === '') {
                return text;
            }
            const regex = safeRegex(searchTerm.trim());
            if (!regex) {
                return text;
            }
            regex.lastIndex = 0;
            return text.toString().replace(regex, match => `<span class="highlight">${match}</span>`);
        },

        isValidSearch(searchTerm) {
            if (!searchTerm || searchTerm.trim() === '') {
                return true;
            }
            try {
                new RegExp(searchTerm);
                return true;
            } catch {
                return false;
            }
        }
    };
})();