import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configurar MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firmas_digitales';
await mongoose.connect(mongoUri);
console.log('✅ Conectado a MongoDB');

// Configurar PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'firmas_digitales',
  logging: false
});

async function debugCertificates() {
  try {
    // 1. Verificar usuarios en PostgreSQL
    console.log('\n📋 Usuarios en PostgreSQL:');
    const [users] = await sequelize.query('SELECT id, nombre, apellido, email FROM usuarios ORDER BY id');
    users.forEach(user => {
      console.log(`  ID: ${user.id} | ${user.nombre} ${user.apellido} | ${user.email}`);
    });

    // 2. Verificar certificados en MongoDB
    console.log('\n📋 Certificados en MongoDB:');
    const Certificado = mongoose.model('Certificate', new mongoose.Schema({}), 'certificates');
    const certificates = await Certificado.find({}).sort({ createdAt: -1 });
    
    certificates.forEach(cert => {
      console.log(`  ID: ${cert._id} | Usuario: ${cert.userId} | Archivo: ${cert.fileName} | Tipo: ${typeof cert.userId}`);
    });

    // 3. Verificar si hay inconsistencias
    console.log('\n🔍 Verificando inconsistencias...');
    const userIds = users.map(u => u.id.toString());
    const certUserIds = certificates.map(c => c.userId);
    
    console.log('IDs de usuarios en PostgreSQL:', userIds);
    console.log('IDs de usuarios en certificados:', certUserIds);
    
    // Verificar certificados huérfanos
    const orphanedCerts = certificates.filter(cert => !userIds.includes(cert.userId));
    if (orphanedCerts.length > 0) {
      console.log('\n⚠️ Certificados huérfanos (sin usuario correspondiente):');
      orphanedCerts.forEach(cert => {
        console.log(`  - ${cert.fileName} (usuario: ${cert.userId})`);
      });
    } else {
      console.log('\n✅ No hay certificados huérfanos');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

debugCertificates(); 