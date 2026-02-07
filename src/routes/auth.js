import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { sendVerificationEmail } from '../utils/email.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario (requiere verificación posterior)
 */
router.post('/register', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('username').optional().trim().isLength({ min: 3 }).withMessage('El username debe tener al menos 3 caracteres')
], async (req, res) => {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const { email, password, username } = req.body;

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Verificar si el email ya existe
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'El email ya está registrado'
            });
        }

        // Verificar si el username ya existe (si se proporcionó)
        if (username) {
            const [existingUsername] = await pool.query(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUsername.length > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: 'El username ya está en uso'
                });
            }
        }

        // Hashear la contraseña
        const hashedPassword = hashPassword(password);

        // Generar username automático si no se proporcionó
        const finalUsername = username || email.split('@')[0];

        // Insertar usuario (is_active = FALSE initially)
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password, role, is_active, verification_code) 
             VALUES (?, ?, ?, 'user', FALSE, ?)`,
            [finalUsername, email, hashedPassword, code]
        );

        // Enviar email de verificación
        await sendVerificationEmail(email, code);

        console.log(`[INFO] Nuevo usuario registrado pendiente de verificar: ${email} (ID: ${result.insertId})`);

        // En desarrollo, mostrar código en consola para probar
        console.log(`[DEBUG] Código de verificación: ${code}`);

        res.status(201).json({
            status: 'pending_verification',
            message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
            data: {
                id: result.insertId,
                email: email,
                requires_verification: true
            }
        });

    } catch (error) {
        console.error('[ERROR] Error en registro:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al registrar usuario. Intenta de nuevo.'
        });
    }
});

/**
 * POST /api/auth/verify
 * Verificar código de email
 */
router.post('/verify', [
    body('email').isEmail().withMessage('Email inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Código inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
    }

    const { email, code } = req.body;

    try {
        // Buscar usuario pendiente
        const [users] = await pool.query(
            'SELECT id, verification_code FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        const user = users[0];

        // Validar código
        if (user.verification_code !== code) {
            return res.status(400).json({ status: 'error', message: 'Código incorrecto' });
        }

        // Activar usuario y limpiar código
        await pool.query(
            'UPDATE users SET is_active = TRUE, verification_code = NULL WHERE id = ?',
            [user.id]
        );

        console.log(`[INFO] Usuario verificado exitosamente: ${email}`);

        res.json({
            status: 'success',
            message: '¡Cuenta verificada correctamente! Ya puedes iniciar sesión.'
        });

    } catch (error) {
        console.error('[ERROR] Error en verificación:', error);
        res.status(500).json({ status: 'error', message: 'Error interno al verificar' });
    }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: errors.array()[0].msg
        });
    }

    const { email, password } = req.body;

    try {
        // Buscar usuario por email
        const [users] = await pool.query(
            `SELECT id, username, email, password, role, is_active, full_name 
             FROM users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }

        const user = users[0];

        // Verificar si la cuenta está activa
        if (!user.is_active) {
            return res.status(403).json({
                status: 'unverified', // Código especial para manejar en frontend
                message: 'Tu cuenta no ha sido verificada. Revisa tu email.',
                requires_verification: true,
                email: user.email
            });
        }

        // Verificar contraseña
        if (!verifyPassword(password, user.password)) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }

        // Actualizar último login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generar Token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[INFO] Login exitoso: ${email} (${user.role})`);

        // Respuesta exitosa
        res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                token: token
            }
        });

    } catch (error) {
        console.error('[ERROR] Error en login:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al iniciar sesión. Intenta de nuevo.'
        });
    }
});

/**
 * GET /api/auth/check
 * Verificar si un email ya existe (útil para validación en frontend)
 */
router.get('/check-email/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        res.json({
            exists: users.length > 0
        });

    } catch (error) {
        console.error('[ERROR] Error al verificar email:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al verificar email'
        });
    }
});

import { sendPasswordResetEmail } from '../utils/email.js';

/**
 * POST /api/auth/forgot-password
 * Solicitar cambio de contraseña
 */
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', message: errors.array()[0].msg });

    const { email } = req.body;

    try {
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // Por seguridad, no decimos si el email no existe, pero retornamos éxito simulado
            // Opcional: si es una app interna, podrías decir "No encontrado"
            console.log(`[INFO] Solicitud de reset para email no existente: ${email}`);
            return res.status(200).json({ status: 'success', message: 'Si el correo existe, recibirás un código.' });
        }

        const user = users[0];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Expira en 1 hora
        const expiresAt = new Date(Date.now() + 3600000);

        // Guardar código
        await pool.query(
            'UPDATE users SET reset_code = ?, reset_expires = ? WHERE id = ?',
            [code, expiresAt, user.id]
        );

        // Enviar email
        await sendPasswordResetEmail(email, code);

        // Debug log
        console.log(`[DEBUG] Código de recuperación para ${email}: ${code}`);

        res.status(200).json({ status: 'success', message: 'Código enviado a tu correo.' });

    } catch (error) {
        console.error('[ERROR] Forgot password:', error);
        res.status(500).json({ status: 'error', message: 'Error interno.' });
    }
});

/**
 * POST /api/auth/reset-password
 * Restablecer contraseña con código
 */
router.post('/reset-password', [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', message: errors.array()[0].msg });

    const { email, code, newPassword } = req.body;

    try {
        const [users] = await pool.query(
            'SELECT id, reset_code, reset_expires FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) return res.status(400).json({ status: 'error', message: 'Solicitud inválida.' });

        const user = users[0];

        // Validar código y expiración
        if (!user.reset_code || user.reset_code !== code) {
            return res.status(400).json({ status: 'error', message: 'Código inválido.' });
        }

        if (new Date() > new Date(user.reset_expires)) {
            return res.status(400).json({ status: 'error', message: 'El código ha expirado.' });
        }

        // Actualizar contraseña
        const hashedPassword = hashPassword(newPassword);
        await pool.query(
            'UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        console.log(`[INFO] Contraseña restablecida para: ${email}`);
        res.status(200).json({ status: 'success', message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        console.error('[ERROR] Reset password:', error);
        res.status(500).json({ status: 'error', message: 'Error al restablecer contraseña.' });
    }
});

export default router;
