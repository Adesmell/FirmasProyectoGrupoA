const { MongoClient } = require('mongodb');

async function setupMongoDB() {
  try {
    console.log('🔧 Configurando MongoDB...');
    
    // Conectar sin autenticación
    const client = new MongoClient('mongodb://localhost:27017', {
      useUnifiedTopology: true
    });
    
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('Documentos');
    
    // Crear colecciones si no existen
    await db.createCollection('notifications');
    await db.createCollection('documents');
    await db.createCollection('certificates');
    
    console.log('✅ Colecciones creadas/verificadas');
    
    // Crear índices básicos
    await db.collection('notifications').createIndex({ destinatario_id: 1 });
    await db.collection('documents').createIndex({ usuario_id: 1 });
    await db.collection('certificates').createIndex({ userId: 1 });
    
    console.log('✅ Índices creados');
    
    await client.close();
    console.log('✅ Configuración completada');
    
  } catch (error) {
    console.error('❌ Error configurando MongoDB:', error);
  }
}

setupMongoDB();
