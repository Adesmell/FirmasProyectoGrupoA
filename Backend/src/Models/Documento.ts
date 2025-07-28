import { Schema, model, Document } from 'mongoose';

export interface IDocumento extends Document {
  nombre_original: string;
  nombre_archivo: string;
  ruta: string;
  tamano: number;
  tipo_archivo: string;
  fecha_subida: Date;
  usuario_id?: string;
  // Campos adicionales para firma
  estado?: string;
  fechaFirma?: Date;
  firmadoPor?: string;
  rutaFirmado?: string;
  datosSignatura?: any;
}

const DocumentoSchema = new Schema<IDocumento>({
  nombre_original: { type: String, required: true },
  nombre_archivo: { type: String, required: true },
  ruta: { type: String, required: true },
  tamano: { type: Number, required: true },
  tipo_archivo: { type: String, required: true },
  fecha_subida: { type: Date, default: Date.now },
  usuario_id: { type: String, required: true },
  // Campos adicionales para firma
  estado: { type: String, default: 'pendiente' },
  fechaFirma: { type: Date },
  firmadoPor: { type: String },
  rutaFirmado: { type: String },
  datosSignatura: { type: Schema.Types.Mixed }
});

export default model<IDocumento>('Doc', DocumentoSchema, 'Doc');
