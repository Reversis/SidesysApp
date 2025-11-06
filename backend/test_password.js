// Crea un archivo temporal: test_password.js en tu backend
const bcrypt = require('bcryptjs');

const testPasswords = async () => {
    const storedHash = '$2a$10$N9qo8uLOickgx2ZMRZoMye.MHLwPSP9xU5ku0puGg6M6YFQzZltnW';
    const testPasswords = [
        'Admin123',
        'admin123',
        'Admin',
        'admin',
        'Password123',
        'password123',
        'Stac123',
        'stac123',
        'Sidesys123',
        'sidesys123',
        '123456',
        '12345678'
    ];

    console.log('🔍 Probando contraseñas contra el hash...');
    
    for (const password of testPasswords) {
        const isValid = await bcrypt.compare(password, storedHash);
        console.log(`🔐 "${password}" -> ${isValid ? '✅ VÁLIDA' : '❌ inválida'}`);
        
        if (isValid) {
            console.log(`🎉 ¡CONTRASEÑA ENCONTRADA: "${password}"`);
            break;
        }
    }
};

testPasswords();