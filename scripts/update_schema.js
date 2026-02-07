import pool from '../src/config/database.js';

const updateSchema = async () => {
    try {
        console.log('[INFO] Updating database schema...');

        // Add verification_code column
        const [result] = await pool.query(`
            ALTER TABLE users 
            ADD COLUMN verification_code VARCHAR(6) DEFAULT NULL AFTER is_active;
        `);

        console.log('[OK] verification_code column added successfully');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('[OK] Column verification_code already exists');
            process.exit(0);
        } else {
            console.error('[ERROR] Failed to update schema:', error);
            process.exit(1);
        }
    }
};

updateSchema();
