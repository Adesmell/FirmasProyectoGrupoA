import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configurar MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firmas_digitales';
await mongoose.connect(mongoUri);
console.log('✅ Conectado a MongoDB');

async function cleanAllCertificates() {
  try {
    const Certificado = mongoose.model('Certificate', new mongoose.Schema({}), 'certificates');
    
    // Contar certificados antes
    const countBefore = await Certificado.countDocuments();
    console.log(`📋 Certificados antes de limpiar: ${countBefore}`);
    
    if (countBefore > 0) {
      console.log('🗑️ Eliminando todos los certificados...');
      await Certificado.deleteMany({});
      console.log('✅ Todos los certificados eliminados');
    } else {
      console.log('ℹ️ No hay certificados para eliminar');
    }
    
    // Verificar después
    const countAfter = await Certificado.countDocuments();
    console.log(`📊 Certificados después de limpiar: ${countAfter}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanAllCertificates(); 