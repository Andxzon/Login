import express from 'express';
import pool from '../config/database.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Aplicar middlewares de autenticación y admin a todas las rutas de este router
router.use(verifyToken, verifyAdmin);

/**
 * GET /api/admin/stats
 * Obtener estadísticas generales
 */
router.get('/stats', async (req, res) => {
    try {
        // Ejecutar consultas en paralelo para mayor velocidad
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [newUsersToday] = await pool.query('SELECT COUNT(*) as count FROM users WHERE Date(created_at) = CurDate()');
        // Asumiendo que consideras "sesión activa" a logins en las últimas 24h
        const [activeSessions] = await pool.query('SELECT COUNT(*) as count FROM users WHERE last_login > NOW() - INTERVAL 1 DAY');

        res.json({
            status: 'success',
            data: {
                totalUsers: totalUsers[0].count,
                newUsersToday: newUsersToday[0].count,
                activeSessions: activeSessions[0].count,
                serverStatus: 'OK'
            }
        });
    } catch (error) {
        console.error('[ERROR] Admin Stats:', error);
        res.status(500).json({ status: 'error', message: 'Error obteniendo estadísticas' });
    }
});

/**
 * GET /api/admin/users
 * Obtener lista de usuarios
 */
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT id, username, email, role, is_active, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        res.json({
            status: 'success',
            data: users
        });
    } catch (error) {
        console.error('[ERROR] Admin Users:', error);
        res.status(500).json({ status: 'error', message: 'Error obteniendo usuarios' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Eliminar un usuario
 */
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    // Evitar auto-eliminación
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ status: 'error', message: 'No puedes eliminarte a ti mismo.' });
    }

    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ status: 'success', message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('[ERROR] Delete User:', error);
        res.status(500).json({ status: 'error', message: 'Error eliminando usuario' });
    }
});

export default router;
