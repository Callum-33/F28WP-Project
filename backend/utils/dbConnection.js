const mysql = require('mysql2/promise');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'rentals_user',
    password: process.env.DB_PASSWORD || 'rentals_password',
    database: process.env.DB_NAME || 'rentals',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;