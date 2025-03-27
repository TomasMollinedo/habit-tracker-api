require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    queueLimit:0
    //Usa el valor de .env y si no está definido usa por defecto 10, como es undefined || toma el 10
});

// Conectar a la base de datos
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a MySQL (usando pool de conexiones)');
    connection.release(); // Liberamos la conexión
});

module.exports = pool;