import fetch from 'node-fetch';

async function testAuthOnly() {
  console.log('=== PRUEBA SOLO AUTENTICACIÓN ===\n');
  
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzUwNjI4NzIwLCJleHAiOjE3NTA2MzIzMjB9.G-9Rq4THg2PdktB7DWqBdvBJMEfUK419UjceeYhT1Vg';
  
  try {
    console.log('🔑 Token:', token.substring(0, 50) + '...');
    console.log('🔄 Enviando petición de prueba...');
    
    // Probar un endpoint simple primero
    const response = await fetch('http://localhost:3002/api/certificados/usuario', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Respuesta:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('\n📄 Contenido de la respuesta:');
    console.log(responseText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuthOnly();
