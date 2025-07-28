import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL para usuarios
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  logging: false, // Desactivar logs SQL en producción
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Función para probar la conexión
export const testPostgresConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    return false;
  }
}; 