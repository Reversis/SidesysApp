// Crea otro archivo: reset_password.js
const { executeQuery } = require('./src/config/database');
const { hashPassword } = require('./src/utils/password');

const resetPassword = async () => {
    try {
        const newPassword = 'Admin123';
        const email = 'stac@sidesys.com';
        
        console.log('🔄 Reseteando contraseña...');
        
        // Generar nuevo hash
        const newHash = await hashPassword(newPassword);
        console.log('🔐 Nuevo hash generado:', newHash);
        
        // Actualizar en la base de datos
        const result = await executeQuery(
            `UPDATE Usuarios 
             SET PasswordHash = '${newHash}'
             WHERE Email = '${email}'`
        );
        
        console.log('✅ Contraseña reseteada exitosamente');
        console.log('📧 Email:', email);
        console.log('🔐 Nueva contraseña: Admin123');
        console.log('🔑 Nuevo hash:', newHash);
        
    } catch (error) {
        console.error('❌ Error reseteando contraseña:', error);
    }
};

resetPassword();