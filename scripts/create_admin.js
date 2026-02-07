import pool from '../src/config/database.js';
import { hashPassword } from '../src/utils/hash.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        const email = 'admin@example.com';
        const password = 'admin123';
        const hashedPassword = hashPassword(password);
        const username = 'admin';

        // Verificar si existe por email O username
        const [existing] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            console.log(`[INFO] Admin ${email} ya existe`);
            // Actualizar a admin y password
            await pool.query(
                `UPDATE users SET role = 'admin', password = ? WHERE email = ?`,
                [hashedPassword, email]
            );
            console.log(`[OK] Rol actualizado a 'admin' y contraseña reiniciada`);
        } else {
            // Crear usuario
            await pool.query(
                `INSERT INTO users (username, email, password, role, is_active) 
                 VALUES (?, ?, ?, 'admin', TRUE)`,
                [username, email, hashedPassword]
            );
            console.log(`[OK] Usuario admin creado: ${email} / ${password} (Role: admin)`);
        }

        process.exit(0);
    } catch (error) {
        console.error('[ERROR]', error);
        process.exit(1);
    }
};

createAdmin();
