import mongoose, { Schema, Document } from 'mongoose';

export interface IFirmante {
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  posicionFirma: {
    x: number;
    y: number;
    page: number;
  };
  estado: 'pendiente' | 'firmado' | 'rechazado';
  fechaFirma?: Date;
  certificadoId?: string;
}

export interface ISolicitudFirma extends Document {
  documentoId: string;
  remitenteId: string;
  remitenteNombre: string;
  firmantes: IFirmante[];
  estado: 'activa' | 'completada' | 'cancelada';
  fechaCreacion: Date;
  fechaCompletada?: Date;
  mensaje?: string;
  metadata: {
    documentoNombre: string;
    totalFirmantes: number;
    firmantesCompletados: number;
  };
}

const FirmanteSchema = new Schema<IFirmante>({
  userId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  posicionFirma: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, default: 1 }
  },
  estado: {
    type: String,
    enum: ['pendiente', 'firmado', 'rechazado'],
    default: 'pendiente'
  },
  fechaFirma: {
    type: Date
  },
  certificadoId: {
    type: String
  }
});

const SolicitudFirmaSchema = new Schema<ISolicitudFirma>({
  documentoId: {
    type: String,
    required: true
  },
  remitenteId: {
    type: String,
    required: true
  },
  remitenteNombre: {
    type: String,
    required: true
  },
  firmantes: [FirmanteSchema],
  estado: {
    type: String,
    enum: ['activa', 'completada', 'cancelada'],
    default: 'activa'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaCompletada: {
    type: Date
  },
  mensaje: {
    type: String
  },
  metadata: {
    documentoNombre: { type: String, required: true },
    totalFirmantes: { type: Number, required: true },
    firmantesCompletados: { type: Number, default: 0 }
  }
});

// Índices para mejorar el rendimiento
SolicitudFirmaSchema.index({ documentoId: 1 });
SolicitudFirmaSchema.index({ remitenteId: 1 });
SolicitudFirmaSchema.index({ 'firmantes.userId': 1 });
SolicitudFirmaSchema.index({ estado: 1 });
SolicitudFirmaSchema.index({ fechaCreacion: -1 });

// Métodos de instancia
SolicitudFirmaSchema.methods.actualizarProgreso = function() {
  const firmantesCompletados = this.firmantes.filter(f => f.estado === 'firmado').length;
  this.metadata.firmantesCompletados = firmantesCompletados;
  
  if (firmantesCompletados === this.metadata.totalFirmantes) {
    this.estado = 'completada';
    this.fechaCompletada = new Date();
  }
  
  return this.save();
};

SolicitudFirmaSchema.methods.agregarFirmante = function(firmante: IFirmante) {
  this.firmantes.push(firmante);
  this.metadata.totalFirmantes = this.firmantes.length;
  return this.save();
};

SolicitudFirmaSchema.methods.marcarFirmado = function(userId: string, certificadoId?: string) {
  const firmante = this.firmantes.find(f => f.userId === userId);
  if (firmante) {
    firmante.estado = 'firmado';
    firmante.fechaFirma = new Date();
    firmante.certificadoId = certificadoId;
    return this.actualizarProgreso();
  }
  return Promise.reject(new Error('Firmante no encontrado'));
};

SolicitudFirmaSchema.methods.marcarRechazado = function(userId: string) {
  const firmante = this.firmantes.find(f => f.userId === userId);
  if (firmante) {
    firmante.estado = 'rechazado';
    return this.save();
  }
  return Promise.reject(new Error('Firmante no encontrado'));
};

const SolicitudFirma = mongoose.model<ISolicitudFirma>('SolicitudFirma', SolicitudFirmaSchema);

export default SolicitudFirma; 