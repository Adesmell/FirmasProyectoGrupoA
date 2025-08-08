import mongoose, { Schema, Document } from 'mongoose';

export interface INotificacion extends Document {
  tipo: 'signature_request' | 'signature_completed' | 'system';
  remitente_id: string;
  destinatario_id: string;
  documento_id?: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: Date;
  fecha_lectura?: Date;
  datos_adicionales?: {
    documento_nombre?: string;
    remitente_nombre?: string;
    posicion_firma?: {
      x: number;
      y: number;
    };
  };
}

const NotificacionSchema = new Schema<INotificacion>({
  tipo: {
    type: String,
    enum: ['signature_request', 'signature_completed', 'system'],
    required: true
  },
  remitente_id: {
    type: String,
    required: true
  },
  destinatario_id: {
    type: String,
    required: true
  },
  documento_id: {
    type: String,
    required: function() {
      return this.tipo === 'signature_request' || this.tipo === 'signature_completed';
    }
  },
  mensaje: {
    type: String,
    required: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_lectura: {
    type: Date
  },
  datos_adicionales: {
    documento_nombre: String,
    remitente_nombre: String,
    posicion_firma: {
      x: Number,
      y: Number
    }
  }
});

// Índices para mejorar el rendimiento
NotificacionSchema.index({ destinatario_id: 1, leida: 1 });
NotificacionSchema.index({ fecha_creacion: -1 });
NotificacionSchema.index({ tipo: 1, documento_id: 1 });

const Notificacion = mongoose.model<INotificacion>('Notificacion', NotificacionSchema);

export default Notificacion; 