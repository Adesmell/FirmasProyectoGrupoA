const mongoose = require('mongoose');

async function checkMongoDB() {
  try {
    console.log('🔍 Intentando conectar a MongoDB sin autenticación...');
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('✅ Conexión exitosa sin autenticación');
    
    // Verificar si podemos crear una colección
    const testDb = mongoose.connection.useDb('test');
    await testDb.createCollection('test_collection');
    console.log('✅ Puede crear colecciones');
    
    await mongoose.disconnect();
    console.log('✅ Desconexión exitosa');
    
  } catch (error) {
    console.error('❌ Error conectando sin autenticación:', error.message);
    
    // Intentar con autenticación
    try {
      console.log('🔍 Intentando conectar con autenticación...');
      await mongoose.connect('mongodb://root:admin@localhost:27017/admin?authSource=admin');
      console.log('✅ Conexión exitosa con autenticación');
      await mongoose.disconnect();
    } catch (authError) {
      console.error('❌ Error con autenticación:', authError.message);
      console.log('💡 El contenedor de MongoDB necesita ser configurado para permitir conexiones sin autenticación');
    }
  }
}

checkMongoDB();
