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

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Consultar usuarios directamente
    const [results] = await sequelize.query('SELECT id, nombre, apellido, email, "emailVerificado" FROM usuarios ORDER BY id');
    
    console.log('📋 Usuarios registrados:');
    console.log('ID | Nombre | Apellido | Email | Verificado');
    console.log('---|--------|----------|-------|-----------');
    
    results.forEach(user => {
      console.log(`${user.id} | ${user.nombre} | ${user.apellido} | ${user.email} | ${user.emailVerificado}`);
    });
    
    console.log(`\n📊 Total de usuarios: ${results.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers(); 