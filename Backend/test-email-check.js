// Script de prueba para verificar la funcionalidad de verificación de email
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002/api';

async function testEmailCheck() {
  console.log('🧪 Iniciando pruebas de verificación de email...\n');

  // Test 1: Verificar email que no existe
  console.log('📧 Test 1: Verificando email que no existe...');
  try {
    const response1 = await fetch(`${BASE_URL}/check-email?email=test@example.com`);
    const data1 = await response1.json();
    console.log('✅ Resultado:', data1);
    console.log('📊 Email disponible:', data1.isAvailable);
  } catch (error) {
    console.error('❌ Error en test 1:', error);
  }

  // Test 2: Verificar email con formato inválido
  console.log('\n📧 Test 2: Verificando email con formato inválido...');
  try {
    const response2 = await fetch(`${BASE_URL}/check-email?email=invalid-email`);
    const data2 = await response2.json();
    console.log('✅ Resultado:', data2);
  } catch (error) {
    console.error('❌ Error en test 2:', error);
  }

  // Test 3: Verificar sin parámetro email
  console.log('\n📧 Test 3: Verificando sin parámetro email...');
  try {
    const response3 = await fetch(`${BASE_URL}/check-email`);
    const data3 = await response3.json();
    console.log('✅ Resultado:', data3);
  } catch (error) {
    console.error('❌ Error en test 3:', error);
  }

  // Test 4: Registrar un usuario y luego verificar
  console.log('\n📧 Test 4: Registrando usuario y verificando...');
  try {
    // Primero registrar un usuario
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: 'Test',
        apellido: 'User',
        email: 'testuser@example.com',
        password: 'TestPass123!'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ Usuario registrado exitosamente');
      
      // Ahora verificar que el email ya no está disponible
      const checkResponse = await fetch(`${BASE_URL}/check-email?email=testuser@example.com`);
      const checkData = await checkResponse.json();
      console.log('📊 Email disponible después del registro:', checkData.isAvailable);
    } else {
      const errorData = await registerResponse.json();
      console.log('⚠️ Error en registro:', errorData.message);
    }
  } catch (error) {
    console.error('❌ Error en test 4:', error);
  }

  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar las pruebas
testEmailCheck().catch(console.error); 