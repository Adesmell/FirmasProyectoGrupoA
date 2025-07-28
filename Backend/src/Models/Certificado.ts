import mongoose, { Document, Schema } from "mongoose";

export interface ICertificate extends Document {
  userId: string;
  fileName: string;
  encryptionSalt?: string; // Opcional para certificados del sistema
  encryptionIV?: string; // Opcional para certificados del sistema
  certificateData: Buffer;
  type?: string;
  alias?: string; // Nombre descriptivo del certificado
  issuer?: string; // Emisor del certificado
  validFrom?: Date; // Fecha de inicio de validez
  validTo?: Date; // Fecha de expiración
  esCertificadoSistema?: boolean; // Indica si es certificado del sistema
  createdAt: Date;
}

const certificateSchema: Schema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  encryptionSalt: { type: String }, // Opcional
  encryptionIV: { type: String }, // Opcional
  certificateData: { type: Buffer, required: true },
  type: { type: String, default: "p12" },
  alias: { type: String }, // Nombre descriptivo del certificado
  issuer: { type: String }, // Emisor del certificado
  validFrom: { type: Date }, // Fecha de inicio de validez
  validTo: { type: Date }, // Fecha de expiración
  esCertificadoSistema: { type: Boolean, default: false }, // Indica si es certificado del sistema
  createdAt: { type: Date, default: Date.now },
});

// Eliminar cualquier índice único existente en userId y recrear índices correctos
certificateSchema.index({ userId: 1 });
// Índice compuesto único para evitar certificados duplicados con el mismo nombre
certificateSchema.index({ userId: 1, fileName: 1 }, { unique: true });

// Función para limpiar índices problemáticos al inicializar
certificateSchema.statics.fixIndexes = async function() {
  try {
    const collection = this.collection;
    // Intentar eliminar índice único problemático
    try {
      await collection.dropIndex('userId_1');
      console.log('✅ Índice único problemático eliminado');
    } catch (error: any) {
      if (error.code !== 27) {
        console.log('ℹ️ Índice único no encontrado o ya eliminado');
      }
    }
  } catch (error) {
    console.log('⚠️ Error al limpiar índices:', error);
  }
};

const Certificado = mongoose.model<ICertificate>(
  "Certificate",
  certificateSchema,
  "certificates"
);

export default Certificado;
