import pool from '../src/config/database.js';

const updateSchema = async () => {
    try {
        console.log('[INFO] Updating database schema for password reset...');

        // Add reset_code and reset_expires columns
        // Usamos DATETIME para la expiración
        const [result] = await pool.query(`
            ALTER TABLE users 
            ADD COLUMN reset_code VARCHAR(6) DEFAULT NULL,
            ADD COLUMN reset_expires DATETIME DEFAULT NULL;
        `);

        console.log('[OK] reset_code and reset_expires columns added successfully');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('[OK] Columns already exist');
            process.exit(0);
        } else {
            console.error('[ERROR] Failed to update schema:', error);
            process.exit(1);
        }
    }
};

updateSchema();
