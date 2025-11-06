require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor SIDESYS Vigencias corriendo en puerto ${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`🔐 Usuario por defecto: stac@sidesys.com / Admin123`);
    console.log('📝 Verifica que la base de datos esté configurada correctamente');
});