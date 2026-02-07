/**
 * Script de prueba para verificar la API de autenticación
 * Ejecutar con: node test-api.js
 */

const API_URL = 'http://localhost:3000/api';

console.log('\n=================================================');
console.log('  PRUEBA DE API - Sistema de Autenticación');
console.log('=================================================\n');

// Test 1: Health Check
async function testHealthCheck() {
    console.log('[1] Probando Health Check...');
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✓ Health Check:', data);
        return data.database === 'connected';
    } catch (error) {
        console.error('✗ Error en Health Check:', error.message);
        return false;
    }
}

// Test 2: Login con usuario admin
async function testLogin() {
    console.log('\n[2] Probando Login (admin)...');
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });
        const data = await response.json();

        if (data.status === 'success') {
            console.log('✓ Login exitoso:', data.data);
            return true;
        } else {
            console.error('✗ Login fallido:', data.message);
            return false;
        }
    } catch (error) {
        console.error('✗ Error en Login:', error.message);
        return false;
    }
}

// Test 3: Registro de nuevo usuario
async function testRegister() {
    console.log('\n[3] Probando Registro (nuevo usuario)...');
    const testEmail = `test${Date.now()}@example.com`;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'test123456'
            })
        });
        const data = await response.json();

        if (data.status === 'success') {
            console.log('✓ Registro exitoso:', data.data);
            return true;
        } else {
            console.error('✗ Registro fallido:', data.message);
            return false;
        }
    } catch (error) {
        console.error('✗ Error en Registro:', error.message);
        return false;
    }
}

// Test 4: Login fallido (credenciales incorrectas)
async function testLoginFail() {
    console.log('\n[4] Probando Login con credenciales incorrectas...');
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'noexiste@example.com',
                password: 'wrongpassword'
            })
        });
        const data = await response.json();

        if (data.status === 'error') {
            console.log('✓ Validación correcta - credenciales rechazadas');
            return true;
        } else {
            console.error('✗ Debería haber fallado');
            return false;
        }
    } catch (error) {
        console.error('✗ Error inesperado:', error.message);
        return false;
    }
}

// Ejecutar todas las pruebas
async function runAllTests() {
    const results = {
        total: 4,
        passed: 0,
        failed: 0
    };

    console.log('Iniciando pruebas...\n');

    // Esperar un poco para asegurar que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ejecutar pruebas
    if (await testHealthCheck()) results.passed++; else results.failed++;
    if (await testLogin()) results.passed++; else results.failed++;
    if (await testRegister()) results.passed++; else results.failed++;
    if (await testLoginFail()) results.passed++; else results.failed++;

    // Resumen
    console.log('\n=================================================');
    console.log('  RESUMEN DE PRUEBAS');
    console.log('=================================================');
    console.log(`Total: ${results.total}`);
    console.log(`✓ Exitosas: ${results.passed}`);
    console.log(`✗ Fallidas: ${results.failed}`);
    console.log('=================================================\n');

    if (results.failed === 0) {
        console.log('¡Todas las pruebas pasaron exitosamente! 🎉\n');
    } else {
        console.log('Algunas pruebas fallaron. Revisa los logs arriba.\n');
    }
}

// Ejecutar
runAllTests().catch(err => {
    console.error('\n✗ Error general:', err);
    process.exit(1);
});
