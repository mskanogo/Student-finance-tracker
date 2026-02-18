const State = (function() {
    let records = [];
    let budgetCap = 500;

    function generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return timestamp + random;
    }

    function isValidRecord(record) {
        return (
            record &&
            typeof record.description === 'string' &&
            typeof record.amount === 'number' &&
            typeof record.category === 'string' &&
            typeof record.date === 'string'
        );
    }

    return {
        getRecords() {
            return [...records];
        },

        getRecordById(id) {
            return records.find(record => record.id === id);
        },

        getBudgetCap() {
            return budgetCap;
        },

        setRecords(newRecords) {
            if (Array.isArray(newRecords)) {
                records = [...newRecords];
            } else {
                console.error('setRecords: expected array, got', typeof newRecords);
                records = [];
            }
        },

        setBudgetCap(cap) {
            const parsedCap = Number(cap);
            if (!isNaN(parsedCap) && parsedCap >= 0) {
                budgetCap = parsedCap;
            }
        },

        addRecord(recordData) {
            const newRecord = {
                ...recordData,
                amount: Number(recordData.amount),
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (!isValidRecord(newRecord)) {
                console.error('addRecord: invalid record data', recordData);
                return null;
            }
            records.push(newRecord);
            return newRecord;
        },

        updateRecord(id, updates) {
            const index = records.findIndex(r => r.id === id);
            if (index === -1) {
                console.warn(`updateRecord: record with id ${id} not found`);
                return null;
            }
            const existingRecord = records[index];
            const updatedRecord = {
                ...existingRecord,
                ...updates,
                amount: updates.amount ? Number(updates.amount) : existingRecord.amount,
                updatedAt: new Date().toISOString()
            };
            if (!isValidRecord(updatedRecord)) {
                console.error('updateRecord: invalid update data', updates);
                return null;
            }
            records[index] = updatedRecord;
            return updatedRecord;
        },

        deleteRecord(id) {
            const index = records.findIndex(r => r.id === id);
            if (index === -1) {
                console.warn(`deleteRecord: record with id ${id} not found`);
                return null;
            }
            const deletedRecords = records.splice(index, 1);
            return deletedRecords[0];
        },

        deleteRecords(ids) {
            const deleted = [];
            records = records.filter(record => {
                if (ids.includes(record.id)) {
                    deleted.push(record);
                    return false;
                }
                return true;
            });
            return deleted;
        },

        clearAllRecords() {
            records = [];
        },

        getRecordCount() {
            return records.length;
        },

        getTotalSpent() {
            return records.reduce((sum, record) => sum + record.amount, 0);
        },

        debug() {
            console.log('=== STATE DEBUG ===');
            console.log('Records:', records.length);
            console.log('Budget Cap:', budgetCap);
            console.log('Total Spent:', this.getTotalSpent());
            console.log('===================');
        }
    };
})();