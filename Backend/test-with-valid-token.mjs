import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testWithValidToken() {
  console.log('=== PRUEBA CON TOKEN VÁLIDO ===\n');
  
  // Crear un archivo de prueba simple
  const testFilePath = './test_simple.p12';
  const testContent = Buffer.from('test certificate content');
  fs.writeFileSync(testFilePath, testContent);
  
  try {
    console.log('📁 Archivo de prueba creado:', testFilePath);
    
    // Crear FormData
    const formData = new FormData();
    formData.append('certificado', fs.createReadStream(testFilePath));
    formData.append('password', 'testpassword');
    
    console.log('📋 FormData creado');
    console.log('🔄 Enviando petición...');
    
    // Usar el token válido que está funcionando
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWxWZXJpZmljYWRvIjp0cnVlLCJpYXQiOjE3NTQ2ODIwNjUsImV4cCI6MTc1NDY4NTY2NX0.gQKEeIb3MYpjbOR-08t93uOH_uwYowwZsxwR2-CAqtk';
    
    const response = await fetch('http://localhost:3002/api/certificados/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📡 Respuesta:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('\n📄 Contenido de la respuesta:');
    console.log(responseText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Limpiar
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testWithValidToken();
