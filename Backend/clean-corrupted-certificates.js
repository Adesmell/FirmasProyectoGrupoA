import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configurar MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firmas_digitales';
await mongoose.connect(mongoUri);
console.log('✅ Conectado a MongoDB');

async function cleanCorruptedCertificates() {
  try {
    const Certificado = mongoose.model('Certificate', new mongoose.Schema({}), 'certificates');
    
    // Buscar certificados corruptos (sin userId o fileName)
    const corruptedCerts = await Certificado.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined },
        { fileName: { $exists: false } },
        { fileName: null },
        { fileName: undefined }
      ]
    });
    
    console.log(`📋 Certificados corruptos encontrados: ${corruptedCerts.length}`);
    
    if (corruptedCerts.length > 0) {
      console.log('🗑️ Eliminando certificados corruptos...');
      
      for (const cert of corruptedCerts) {
        console.log(`  - Eliminando: ${cert._id}`);
        await Certificado.findByIdAndDelete(cert._id);
      }
      
      console.log('✅ Certificados corruptos eliminados');
    } else {
      console.log('✅ No hay certificados corruptos');
    }
    
    // Verificar certificados restantes
    const remainingCerts = await Certificado.find({});
    console.log(`📊 Certificados restantes: ${remainingCerts.length}`);
    
    if (remainingCerts.length > 0) {
      console.log('📋 Certificados válidos:');
      remainingCerts.forEach(cert => {
        console.log(`  - ID: ${cert._id} | Usuario: ${cert.userId} | Archivo: ${cert.fileName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanCorruptedCertificates(); 