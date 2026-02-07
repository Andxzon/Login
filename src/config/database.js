import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Verificar conexión
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[OK] Conexión exitosa a MySQL en AWS RDS');
        console.log(`[INFO] Base de datos: ${process.env.DB_NAME}`);
        console.log(`[INFO] Host: ${process.env.DB_HOST}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('[ERROR] Error al conectar a la base de datos:', error.message);
        return false;
    }
};

export default pool;
