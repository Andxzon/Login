import nodemailer from 'nodemailer';

// Mock transport (sends to console if no creds)
const createTransporter = async () => {
    // If you have real email creds, use them here or in .env
    // For now, we use Ethereal for testing or just fallback to logging
    if (process.env.EMAIL_HOST) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Default: Log to console (easiest for dev without credentials)
    return {
        sendMail: async (mailOptions) => {
            console.log('\n[EMAIL MOCK] -----------------------------');
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Verification Code: ${mailOptions.text.match(/\d{6}/)}`);
            console.log('------------------------------------------\n');
            return { messageId: 'mock-id' };
        }
    };
};

export const sendVerificationEmail = async (email, code) => {
    const transporter = await createTransporter();

    const mailOptions = {
        from: '"My Super App" <noreply@example.com>',
        to: email,
        subject: 'Código de Verificación',
        text: `Tu código de verificación es: ${code}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Verifica tu cuenta</h2>
                <p>Usa el siguiente código para completar tu registro:</p>
                <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                    ${code}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Si no solicitaste este código, ignora este mensaje.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[INFO] Email enviado a ${email} con código ${code}`);
        return true;
    } catch (error) {
        console.error('[ERROR] Error enviando email:', error);
        return false;
    }
};

export const sendPasswordResetEmail = async (email, code) => {
    const transporter = await createTransporter();

    // Plantilla simple para reset de contraseña
    const mailOptions = {
        from: '"My Super App" <noreply@example.com>',
        to: email,
        subject: 'Recuperación de Contraseña',
        text: `Tu código de recuperación es: ${code}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Recuperación de Contraseña</h2>
                <p>Usa el siguiente código para restablecer tu contraseña:</p>
                <div style="background: #fff0f0; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #d32f2f;">
                    ${code}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Este código expira en 1 hora.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[INFO] Email de recuperación enviado a ${email} con código ${code}`);
        return true;
    } catch (error) {
        console.error('[ERROR] Error enviando email de recuperación:', error);
        return false;
    }
};
