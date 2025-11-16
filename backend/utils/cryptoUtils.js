const crypto = require('crypto');

const HASH_ALGORITHM = 'sha256';
const SALT_LENGTH = 16;
const TOKEN_LENGTH = 32;

function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.createHmac(HASH_ALGORITHM, salt).update(password).digest('hex');
    return { hash, salt };
}

function verifyPassword(password, storedHash, storedSalt) {
    const testHash = crypto.createHmac(HASH_ALGORITHM, storedSalt).update(password).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(storedHash, 'hex'));  
}

function generateSessionToken() {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateSessionToken
};