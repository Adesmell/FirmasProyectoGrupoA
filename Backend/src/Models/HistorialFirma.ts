import mongoose, { Schema, Document } from 'mongoose';

export interface IFirma {
  firmanteId: string;
  firmanteNombre: string;
  firmanteEmail: string;
  certificadoId?: string;
  certificadoInfo?: {
    nombre: string;
    emisor: string;
    fechaVencimiento: Date;
  };
  posicionFirma: {
    x: number;
    y: number;
    page: number;
  };
  fechaFirma: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata: {
    tipoFirma: 'individual' | 'multiple' | 'remota';
    metodo: 'certificado_local' | 'certificado_remoto' | 'qr';
    version: string;
  };
}

export interface IHistorialFirma extends Document {
  documentoId: string;
  documentoNombre: string;
  propietarioId: string;
  propietarioNombre: string;
  solicitudId?: string; // ID de la solicitud de firma múltiple
  firmas: IFirma[];
  estado: 'en_proceso' | 'completada' | 'cancelada';
  fechaCreacion: Date;
  fechaCompletada?: Date;
  metadata: {
    totalFirmas: number;
    firmasCompletadas: number;
    tipoDocumento: string;
    tamanoArchivo: number;
    hashDocumento?: string;
    versiones: {
      original: string;
      firmado: string;
    };
  };
  auditoria: {
    creadoPor: string;
    modificadoPor?: string;
    fechaModificacion?: Date;
    cambios: Array<{
      fecha: Date;
      usuario: string;
      accion: string;
      detalles: string;
    }>;
  };
}

const FirmaSchema = new Schema<IFirma>({
  firmanteId: {
    type: String,
    required: true
  },
  firmanteNombre: {
    type: String,
    required: true
  },
  firmanteEmail: {
    type: String,
    required: true
  },
  certificadoId: {
    type: String
  },
  certificadoInfo: {
    nombre: String,
    emisor: String,
    fechaVencimiento: Date
  },
  posicionFirma: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    page: { type: Number, default: 1 }
  },
  fechaFirma: {
    type: Date,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    tipoFirma: {
      type: String,
      enum: ['individual', 'multiple', 'remota'],
      default: 'individual'
    },
    metodo: {
      type: String,
      enum: ['certificado_local', 'certificado_remoto', 'qr'],
      default: 'certificado_local'
    },
    version: {
      type: String,
      default: '1.0'
    }
  }
});

const HistorialFirmaSchema = new Schema<IHistorialFirma>({
  documentoId: {
    type: String,
    required: true
  },
  documentoNombre: {
    type: String,
    required: true
  },
  propietarioId: {
    type: String,
    required: true
  },
  propietarioNombre: {
    type: String,
    required: true
  },
  solicitudId: {
    type: String
  },
  firmas: [FirmaSchema],
  estado: {
    type: String,
    enum: ['en_proceso', 'completada', 'cancelada'],
    default: 'en_proceso'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaCompletada: {
    type: Date
  },
  metadata: {
    totalFirmas: {
      type: Number,
      required: true
    },
    firmasCompletadas: {
      type: Number,
      default: 0
    },
    tipoDocumento: {
      type: String,
      default: 'pdf'
    },
    tamanoArchivo: {
      type: Number
    },
    hashDocumento: {
      type: String
    },
    versiones: {
      original: String,
      firmado: String
    }
  },
  auditoria: {
    creadoPor: {
      type: String,
      required: true
    },
    modificadoPor: {
      type: String
    },
    fechaModificacion: {
      type: Date
    },
    cambios: [{
      fecha: { type: Date, default: Date.now },
      usuario: { type: String, required: true },
      accion: { type: String, required: true },
      detalles: { type: String, required: true }
    }]
  }
});

// Índices para mejorar el rendimiento
HistorialFirmaSchema.index({ documentoId: 1 });
HistorialFirmaSchema.index({ propietarioId: 1 });
HistorialFirmaSchema.index({ 'firmas.firmanteId': 1 });
HistorialFirmaSchema.index({ estado: 1 });
HistorialFirmaSchema.index({ fechaCreacion: -1 });
HistorialFirmaSchema.index({ solicitudId: 1 });

// Métodos de instancia
HistorialFirmaSchema.methods.agregarFirma = function(firma: IFirma) {
  this.firmas.push(firma);
  this.metadata.firmasCompletadas = this.firmas.length;
  
  // Actualizar estado si todas las firmas están completadas
  if (this.metadata.firmasCompletadas >= this.metadata.totalFirmas) {
    this.estado = 'completada';
    this.fechaCompletada = new Date();
  }
  
  // Agregar entrada de auditoría
  this.auditoria.cambios.push({
    fecha: new Date(),
    usuario: firma.firmanteId,
    accion: 'firma_agregada',
    detalles: `Firma agregada por ${firma.firmanteNombre}`
  });
  
  return this.save();
};

HistorialFirmaSchema.methods.registrarCambio = function(usuarioId: string, accion: string, detalles: string) {
  this.auditoria.cambios.push({
    fecha: new Date(),
    usuario: usuarioId,
    accion,
    detalles
  });
  
  this.auditoria.modificadoPor = usuarioId;
  this.auditoria.fechaModificacion = new Date();
  
  return this.save();
};

HistorialFirmaSchema.methods.obtenerProgreso = function() {
  return {
    total: this.metadata.totalFirmas,
    completadas: this.metadata.firmasCompletadas,
    porcentaje: Math.round((this.metadata.firmasCompletadas / this.metadata.totalFirmas) * 100),
    pendientes: this.metadata.totalFirmas - this.metadata.firmasCompletadas
  };
};

HistorialFirmaSchema.methods.obtenerFirmantesPendientes = function() {
  const firmantesCompletados = this.firmas.map(f => f.firmanteId);
  // Aquí necesitarías obtener la lista completa de firmantes desde la solicitud
  // Por ahora retornamos un array vacío
  return [];
};

const HistorialFirma = mongoose.model<IHistorialFirma>('HistorialFirma', HistorialFirmaSchema);

export default HistorialFirma; 