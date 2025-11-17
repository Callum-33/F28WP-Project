// Utility functions for reading and writing JSON data files
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readData(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error(`Error reading data from ${fileName}:`, error);
        return [];
    }
}

function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filename}:`, error);
    }
}

module.exports = {
    readData,
    writeData
};
