import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { testConnection } from './config/database.js';

// Configuración de __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta de health check
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('[ERROR] Error no manejado:', err);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        console.log('\n' + '='.repeat(60));
        console.log('  NODE.JS SERVER - INICIANDO');
        console.log('='.repeat(60));

        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('\n[ERROR] No se pudo conectar a la base de datos');
            console.error('[INFO] Verifica el archivo .env y las credenciales');
            process.exit(1);
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n' + '='.repeat(60));
            console.log(`[OK] Servidor iniciado en http://localhost:${PORT}`);
            console.log('='.repeat(60));
            console.log('\n[INFO] Endpoints disponibles:');
            console.log(`  - GET  http://localhost:${PORT}/`);
            console.log(`  - GET  http://localhost:${PORT}/api/health`);
            console.log(`  - POST http://localhost:${PORT}/api/auth/login`);
            console.log(`  - POST http://localhost:${PORT}/api/auth/register`);
            console.log(`  - GET  http://localhost:${PORT}/api/auth/check-email/:email`);
            console.log('\n[INFO] Presiona Ctrl+C para detener el servidor\n');
        });

    } catch (error) {
        console.error('[ERROR] Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Iniciar
startServer();

export default app;
