import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Configuración
const BASE_URL = 'http://localhost:3002/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZ…M2M30.YN7ON3MyWedvfY0s4RkpqmqSVR04_9hCyHZGjAq-GVA'; // Necesitarás un token válido

async function testUploadEndpoint() {
  console.log('=== PRUEBA DEL ENDPOINT DE SUBIDA DE CERTIFICADOS ===\n');
  
  // Crear un archivo de prueba
  const testFilePath = './test_cert.p12';
  const testContent = Buffer.from('test certificate content');
  fs.writeFileSync(testFilePath, testContent);
  
  try {
    console.log('📁 Archivo de prueba creado:', testFilePath);
    
    // Crear FormData
    const formData = new FormData();
    formData.append('certificado', fs.createReadStream(testFilePath));
    formData.append('password', 'testpassword');
    
    console.log('📋 FormData creado con:');
    console.log('  - certificado: test_cert.p12');
    console.log('  - password: testpassword');
    
    // Hacer la petición
    console.log('\n🔄 Enviando petición a:', `${BASE_URL}/certificados/upload`);
    
    const response = await fetch(`${BASE_URL}/certificados/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('📡 Respuesta del servidor:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
    
    // Leer la respuesta
    const responseText = await response.text();
    console.log('\n📄 Contenido de la respuesta:');
    console.log(responseText.substring(0, 500));
    
    if (response.ok) {
      console.log('\n✅ Petición exitosa');
    } else {
      console.log('\n❌ Petición fallida');
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Archivo de prueba eliminado');
    }
  }
}

// Función para probar sin token (para ver el error de autenticación)
async function testWithoutAuth() {
  console.log('\n=== PRUEBA SIN AUTENTICACIÓN ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/certificados/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    
    console.log('📡 Respuesta sin auth:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('\n📄 Contenido de la respuesta:');
    console.log(responseText.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Error en petición sin auth:', error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  await testWithoutAuth();
  await testUploadEndpoint(); // Ahora con token válido
}

runTests().catch(console.error);
