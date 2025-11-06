const sql = require('mssql');

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        encrypt: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

const getPool = () => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig)
            .connect()
            .then(pool => {
                console.log('✅ Conectado a SQL Server');
                return pool;
            })
            .catch(err => {
                console.error('❌ Error conectando a SQL Server:', err);
                throw err;
            });
    }
    return poolPromise;
};

const database = {
    sql,
    getPool,
    executeQuery: async (query, params = {}) => {
        try {
            const pool = await getPool();
            const request = pool.request();
            
            // Agregar parámetros
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
            
            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            console.error('Error en consulta SQL:', error);
            throw error;
        }
    },
    executeProcedure: async (procedureName, params = {}) => {
        try {
            const pool = await getPool();
            const request = pool.request();
            
            // Agregar parámetros
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
            
            const result = await request.execute(procedureName);
            return result.recordset;
        } catch (error) {
            console.error('Error ejecutando procedimiento:', error);
            throw error;
        }
    }
};

module.exports = database;