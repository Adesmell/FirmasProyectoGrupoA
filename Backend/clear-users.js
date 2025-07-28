import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'firmas_digitales',
  logging: false
});

async function clearUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Verificar usuarios antes de eliminar
    const [beforeResults] = await sequelize.query('SELECT id, nombre, apellido, email FROM usuarios');
    console.log(`📋 Usuarios antes de eliminar: ${beforeResults.length}`);
    
    if (beforeResults.length > 0) {
      console.log('🗑️ Eliminando todos los usuarios...');
      await sequelize.query('DELETE FROM usuarios');
      console.log('✅ Todos los usuarios eliminados');
    } else {
      console.log('ℹ️ No hay usuarios para eliminar');
    }
    
    // Verificar después de eliminar
    const [afterResults] = await sequelize.query('SELECT COUNT(*) as count FROM usuarios');
    console.log(`📊 Usuarios después de eliminar: ${afterResults[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

clearUsers(); 