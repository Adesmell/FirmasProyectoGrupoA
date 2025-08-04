// Script de prueba para verificar la funcionalidad de restablecimiento de contraseña
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002/api';

async function testPasswordReset() {
  console.log('🧪 Iniciando pruebas de restablecimiento de contraseña...\n');

  // Test 1: Solicitar restablecimiento con email válido
  console.log('📧 Test 1: Solicitando restablecimiento con email válido...');
  try {
    const response1 = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com' // Usar un email que exista en tu base de datos
      })
    });
    
    const data1 = await response1.json();
    console.log('✅ Resultado:', data1);
  } catch (error) {
    console.error('❌ Error en test 1:', error);
  }

  // Test 2: Solicitar restablecimiento con email inválido
  console.log('\n📧 Test 2: Solicitando restablecimiento con email inválido...');
  try {
    const response2 = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com'
      })
    });
    
    const data2 = await response2.json();
    console.log('✅ Resultado:', data2);
  } catch (error) {
    console.error('❌ Error en test 2:', error);
  }

  // Test 3: Solicitar restablecimiento sin email
  console.log('\n📧 Test 3: Solicitando restablecimiento sin email...');
  try {
    const response3 = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    const data3 = await response3.json();
    console.log('✅ Resultado:', data3);
  } catch (error) {
    console.error('❌ Error en test 3:', error);
  }

  // Test 4: Verificar token inválido
  console.log('\n🔍 Test 4: Verificando token inválido...');
  try {
    const response4 = await fetch(`${BASE_URL}/verify-reset-token/invalid-token`);
    const data4 = await response4.json();
    console.log('✅ Resultado:', data4);
  } catch (error) {
    console.error('❌ Error en test 4:', error);
  }

  // Test 5: Restablecer contraseña con datos inválidos
  console.log('\n🔐 Test 5: Restableciendo contraseña con datos inválidos...');
  try {
    const response5 = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'invalid-token',
        newPassword: 'short'
      })
    });
    
    const data5 = await response5.json();
    console.log('✅ Resultado:', data5);
  } catch (error) {
    console.error('❌ Error en test 5:', error);
  }

  console.log('\n🏁 Pruebas completadas');
  console.log('\n📝 Notas:');
  console.log('- Para probar completamente, necesitas un usuario registrado en la base de datos');
  console.log('- Los tokens de restablecimiento expiran en 1 hora');
  console.log('- Verifica los logs del servidor para ver los emails simulados');
}

// Ejecutar las pruebas
testPasswordReset().catch(console.error); 