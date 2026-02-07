import pool from '../src/config/database.js';

const checkTable = async () => {
    try {
        const [rows] = await pool.query('DESCRIBE users');
        console.log('--- USERS TABLE SCHEMA ---');
        rows.forEach(row => {
            console.log(`${row.Field} (${row.Type})`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error describing table:', error);
        process.exit(1);
    }
};

checkTable();
