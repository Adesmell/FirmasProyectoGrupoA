import Documento from "../Models/Documento";
import type { Request, Response, NextFunction } from "express";
import fs from 'fs';
import path from 'path';
import { findDocumentWithUserCheck } from '../utils/userIdHelper';

export const uploadDocumento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("🔄 Iniciando subida de documento...");
    console.log("📁 Archivo recibido:", req.file);
    console.log("👤 Usuario:", req.user);

    // El archivo subido estará en req.file
    const file = req.file as Express.Multer.File;
    if (!file) {
      console.log("❌ No se subió ningún archivo");
      res.status(400).json({ mensaje: "No se subió ningún archivo" });
      return;
    }

    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      console.log("❌ Usuario no autenticado o sin ID", req.user);
      res.status(401).json({ mensaje: "Usuario no autenticado" });
      return;
    }

    console.log("✅ Usuario autenticado:", req.user);
    const userId = req.user.id.toString();
    console.log("🆔 ID de usuario que sube el documento:", userId);

    // Verificar que el archivo sea un PDF
    if (file.mimetype !== 'application/pdf') {
      console.log("❌ Tipo de archivo no válido:", file.mimetype);
      res.status(400).json({ mensaje: "Solo se permiten archivos PDF" });
      return;
    }

    // Verificar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log("❌ Archivo demasiado grande:", file.size);
      res.status(413).json({ mensaje: "El archivo es demasiado grande. Máximo 10MB" });
      return;
    }

    // Guardar información en MongoDB
    const nuevoDocumento = new Documento({
      nombre_original: file.originalname,
      nombre_archivo: file.filename,
      ruta: file.path,
      tamano: file.size,
      tipo_archivo: file.mimetype,
      fecha_subida: new Date(),
      usuario_id: userId
    });
    
    console.log("💾 Guardando documento con datos:", {
      nombre_original: file.originalname,
      nombre_archivo: file.filename,
      tamano: file.size,
      usuario_id: userId
    });
    
    const documentoGuardado = await nuevoDocumento.save();
    console.log("✅ Documento guardado correctamente:", documentoGuardado._id);

    const responseData = {
      mensaje: "Archivo subido correctamente", 
      documento: {
        _id: documentoGuardado._id,
        nombre_original: documentoGuardado.nombre_original,
        nombre_archivo: documentoGuardado.nombre_archivo,
        ruta: documentoGuardado.ruta,
        tamano: documentoGuardado.tamano,
        tipo_archivo: documentoGuardado.tipo_archivo,
        fecha_subida: documentoGuardado.fecha_subida,
        usuario_id: documentoGuardado.usuario_id
      }
    };

    console.log("📤 Enviando respuesta:", responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('❌ Error al subir el archivo:', error);
    res.status(500).json({ mensaje: "Error interno del servidor al subir el archivo" });
  }
};

// Función para obtener documentos por usuario
export const getDocumentosByUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar que existe usuario autenticado
    if (!req.user || !req.user.id) {
      res.status(401).json({ mensaje: "Usuario no autenticado" });
      return next();
    }

    const usuarioId = req.user.id.toString();
    console.log("Buscando documentos para el usuario ID:", usuarioId);
    
    // Buscar documentos asociados al usuario
    const documentos = await Documento.find({ usuario_id: usuarioId });
    
    console.log(`Se encontraron ${documentos.length} documentos para el usuario`);
    
    res.status(200).json({ 
      mensaje: "Documentos recuperados correctamente", 
      documentos,
      total: documentos.length,
      usuario_id: usuarioId 
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
    return next();
  }
};

// Función para previsualizar documento
export const previewDocumento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id?.toString();

    console.log('🔍 Preview documento - ID recibido:', id);
    console.log('🔍 Preview documento - Longitud del ID:', id?.length || 0);
    console.log('🔍 Preview documento - Formato válido:', id ? /^[0-9a-fA-F]{24}$/.test(id) : false);
    console.log('🔍 Preview documento - User ID:', userId);
    console.log('🔍 Preview documento - Headers:', req.headers);

    if (!userId) {
      console.log('❌ Usuario no autenticado');
      res.status(401).json({ mensaje: "Usuario no autenticado" });
      return next();
    }

    // Validar que el ID sea un ObjectId válido
    if (!id) {
      console.log('❌ ID de documento inválido');
      res.status(400).json({ mensaje: "ID de documento inválido" });
      return next();
    }
    
    // Validación temporalmente deshabilitada para debugging
    // if (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
    //   res.status(400).json({ mensaje: "ID de documento inválido" });
    //   return next();
    // }

    console.log('🔍 Buscando documento en BD...');
    // Buscar el documento usando el helper que maneja diferentes formatos de ID
    const documento = await findDocumentWithUserCheck(Documento, id, userId);
    
    if (!documento) {
      console.log('❌ Documento no encontrado en BD');
      res.status(404).json({ mensaje: "Documento no encontrado" });
      return next();
    }

    // Determinar qué archivo mostrar (original o firmado)
    let filePath = documento.ruta;
    
    // Si el documento está firmado y existe el archivo firmado, usar ese
    if (documento.estado === 'firmado' && documento.rutaFirmado && fs.existsSync(documento.rutaFirmado)) {
      filePath = documento.rutaFirmado;
      console.log('✅ Mostrando documento firmado:', filePath);
    } else {
      console.log('✅ Mostrando documento original:', filePath);
    }

    console.log('✅ Documento encontrado:', {
      id: documento._id,
      nombre: documento.nombre_original,
      ruta: filePath,
      usuario_id: documento.usuario_id,
      estado: documento.estado
    });

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      console.log('❌ Archivo no encontrado en sistema:', filePath);
      res.status(404).json({ mensaje: "Archivo no encontrado en el sistema" });
      return next();
    }

    console.log('✅ Archivo encontrado en sistema:', filePath);

    // Manejar range requests para PDF.js
    const range = req.headers.range;
    if (range) {
      const fileSize = fs.statSync(documento.ruta).size;
      const CHUNK_SIZE = 10 ** 6; // 1MB
      const start = Number(range.replace(/\D/g, ""));
      const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
      const contentLength = end - start + 1;
      
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": documento.tipo_archivo,
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Range",
        "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "ALLOWALL"
      };
      
      res.writeHead(206, headers);
      const videoStream = fs.createReadStream(filePath, { start, end });
      videoStream.pipe(res);
      return;
    }

    // Configurar headers apropiados para la previsualización
    res.setHeader('Content-Type', documento.tipo_archivo);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    
    console.log('📤 Enviando archivo...');
    // Enviar el archivo
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error("❌ Error al previsualizar documento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
    return next();
  }
};

// Función para descargar documento
export const downloadDocumento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id?.toString();

    console.log('🔍 Download documento - ID recibido:', id);
    console.log('🔍 Download documento - Longitud del ID:', id?.length || 0);
    console.log('🔍 Download documento - Formato válido:', id ? /^[0-9a-fA-F]{24}$/.test(id) : false);

    if (!userId) {
      res.status(401).json({ mensaje: "Usuario no autenticado" });
      return next();
    }

    // Validar que el ID sea un ObjectId válido
    if (!id) {
      res.status(400).json({ mensaje: "ID de documento inválido" });
      return next();
    }
    
    // Validación temporalmente deshabilitada para debugging
    // if (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
    //   res.status(400).json({ mensaje: "ID de documento inválido" });
    //   return next();
    // }

    // Buscar el documento usando el helper que maneja diferentes formatos de ID
    const documento = await findDocumentWithUserCheck(Documento, id, userId);
    
    if (!documento) {
      res.status(404).json({ mensaje: "Documento no encontrado" });
      return next();
    }

    // Determinar qué archivo enviar (original o firmado)
    let filePath = documento.ruta;
    let fileName = documento.nombre_original;
    
    // Si el documento está firmado y existe el archivo firmado, usar ese
    if (documento.estado === 'firmado' && documento.rutaFirmado && fs.existsSync(documento.rutaFirmado)) {
      filePath = documento.rutaFirmado;
      fileName = `firmado-${documento.nombre_original}`;
      console.log('✅ Enviando documento firmado:', filePath);
    } else {
      console.log('✅ Enviando documento original:', filePath);
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ mensaje: "Archivo no encontrado en el sistema" });
      return next();
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', documento.tipo_archivo);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Enviar el archivo
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error("Error al descargar documento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
    return next();
  }
};

// Función para eliminar documento
export const deleteDocumento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id?.toString();

    console.log('🔍 Delete documento - ID recibido:', id);
    console.log('🔍 Delete documento - User ID:', userId);

    if (!userId) {
      res.status(401).json({ mensaje: "Usuario no autenticado" });
      return next();
    }

    if (!id) {
      res.status(400).json({ mensaje: "ID de documento requerido" });
      return next();
    }

    // Buscar el documento usando el helper que maneja diferentes formatos de ID
    const documento = await findDocumentWithUserCheck(Documento, id, userId);
    
    if (!documento) {
      res.status(404).json({ mensaje: "Documento no encontrado" });
      return next();
    }

    console.log('✅ Documento encontrado para eliminar:', {
      id: documento._id,
      nombre: documento.nombre_original,
      ruta: documento.ruta
    });

    // Eliminar el archivo físico original si existe
    if (fs.existsSync(documento.ruta)) {
      try {
        fs.unlinkSync(documento.ruta);
        console.log('✅ Archivo original eliminado:', documento.ruta);
      } catch (fileError) {
        console.error('⚠️ Error eliminando archivo original:', fileError);
        // Continuar aunque falle la eliminación del archivo
      }
    }

    // Eliminar el archivo firmado si existe
    if (documento.rutaFirmado && fs.existsSync(documento.rutaFirmado)) {
      try {
        fs.unlinkSync(documento.rutaFirmado);
        console.log('✅ Archivo firmado eliminado:', documento.rutaFirmado);
      } catch (fileError) {
        console.error('⚠️ Error eliminando archivo firmado:', fileError);
        // Continuar aunque falle la eliminación del archivo
      }
    }

    // Eliminar el documento de la base de datos
    await Documento.findByIdAndDelete(id);
    console.log('✅ Documento eliminado de la base de datos');

    res.status(200).json({ 
      mensaje: "Documento eliminado correctamente",
      documentoId: id
    });
    
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
    return next();
  }
};
