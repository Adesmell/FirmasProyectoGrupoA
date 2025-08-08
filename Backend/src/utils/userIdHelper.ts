/**
 * Helper para normalizar IDs de usuario entre PostgreSQL y MongoDB
 * PostgreSQL usa IDs numéricos, MongoDB puede almacenarlos como string o number
 */

/**
 * Normaliza un ID de usuario para búsquedas en MongoDB
 * @param userId - ID del usuario (puede ser string o number)
 * @returns Array con diferentes formatos del ID para búsqueda
 */
export const normalizeUserId = (userId: string | number): (string | number)[] => {
  const userIdStr = userId.toString();
  const userIdNum = parseInt(userIdStr);
  
  // Retornar array con diferentes formatos para búsqueda
  return [userIdStr, userIdNum];
};

/**
 * Busca un documento con diferentes formatos de ID de usuario
 * @param model - Modelo de MongoDB
 * @param documentId - ID del documento
 * @param userId - ID del usuario
 * @returns Documento encontrado o null
 */
export const findDocumentWithUserCheck = async (model: any, documentId: string, userId: string | number) => {
  const normalizedIds = normalizeUserId(userId);
  
  console.log(`🔍 Buscando documento ${documentId} para usuario con IDs:`, normalizedIds);
  
  // Primero, buscar el documento sin filtro de usuario para ver si existe
  const documentWithoutUserFilter = await model.findOne({ _id: documentId });
  if (documentWithoutUserFilter) {
    console.log(`🔍 Documento existe en BD con usuario_id: ${documentWithoutUserFilter.usuario_id} (tipo: ${typeof documentWithoutUserFilter.usuario_id})`);
  } else {
    console.log(`❌ Documento ${documentId} no existe en la base de datos`);
    return null;
  }
  
  // Intentar con cada formato de ID
  for (const id of normalizedIds) {
    const document = await model.findOne({ _id: documentId, usuario_id: id });
    if (document) {
      console.log(`✅ Documento encontrado con ID de usuario: ${id} (tipo: ${typeof id})`);
      return document;
    }
  }
  
  console.log(`❌ Documento no encontrado con ningún formato de ID de usuario:`, normalizedIds);
  console.log(`⚠️ El documento existe pero pertenece a otro usuario`);
  return null;
};

/**
 * Busca documentos de un usuario con diferentes formatos de ID
 * @param model - Modelo de MongoDB
 * @param userId - ID del usuario
 * @returns Array de documentos
 */
export const findDocumentsByUser = async (model: any, userId: string | number) => {
  const normalizedIds = normalizeUserId(userId);
  
  // Buscar con todos los formatos de ID
  const documents = await model.find({ 
    usuario_id: { $in: normalizedIds } 
  });
  
  console.log(`🔍 Encontrados ${documents.length} documentos para usuario con IDs:`, normalizedIds);
  return documents;
};

/**
 * Función de debug para mostrar todos los documentos en la base de datos
 * @param model - Modelo de MongoDB
 */
export const debugAllDocuments = async (model: any) => {
  try {
    const allDocuments = await model.find({}).limit(10); // Limitar a 10 para no saturar los logs
    
    console.log(`🔍 DEBUG: Mostrando todos los documentos en la BD (limitado a 10):`);
    allDocuments.forEach((doc: any, index: number) => {
      console.log(`  ${index + 1}. ID: ${doc._id}, Nombre: ${doc.nombre_original}, Usuario: ${doc.usuario_id} (tipo: ${typeof doc.usuario_id})`);
    });
    
    if (allDocuments.length === 0) {
      console.log(`  ⚠️ No hay documentos en la base de datos`);
    }
  } catch (error) {
    console.error(`❌ Error al obtener documentos para debug:`, error);
  }
};

/**
 * Función de debug para mostrar documentos de un usuario específico
 * @param model - Modelo de MongoDB
 * @param userId - ID del usuario
 */
export const debugUserDocuments = async (model: any, userId: string | number) => {
  try {
    const normalizedIds = normalizeUserId(userId);
    const userDocuments = await model.find({ 
      usuario_id: { $in: normalizedIds } 
    });
    
    console.log(`🔍 DEBUG: Documentos del usuario ${userId} (IDs: ${normalizedIds}):`);
    if (userDocuments.length === 0) {
      console.log(`  ⚠️ No hay documentos para este usuario`);
    } else {
      userDocuments.forEach((doc: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${doc._id}, Nombre: ${doc.nombre_original}, Usuario: ${doc.usuario_id}`);
      });
    }
  } catch (error) {
    console.error(`❌ Error al obtener documentos del usuario para debug:`, error);
  }
};
