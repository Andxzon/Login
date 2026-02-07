import crypto from 'crypto';

/**
 * Hashear contraseña con SHA-256 (compatible con el script Python)
 * @param {string} password - Contraseña en texto plano
 * @returns {string} Hash SHA-256 de la contraseña
 */
export const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Verificar contraseña comparando hashes
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {boolean} True si coinciden, false si no
 */
export const verifyPassword = (password, hash) => {
    const passwordHash = hashPassword(password);
    return passwordHash === hash;
};
