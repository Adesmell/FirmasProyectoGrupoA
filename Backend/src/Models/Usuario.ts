import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  emailVerificado: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  fechaCreacion: Date;
  ultimoAcceso?: Date;
}

const UsuarioSchema = new Schema<IUsuario>({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  },
  emailVerificado: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
UsuarioSchema.index({ email: 1 });
UsuarioSchema.index({ verificationToken: 1 });

// Método para verificar si el token de verificación ha expirado
UsuarioSchema.methods.isVerificationTokenExpired = function(): boolean {
  if (!this.verificationTokenExpires) return true;
  return Date.now() > this.verificationTokenExpires.getTime();
};

// Método para limpiar token de verificación
UsuarioSchema.methods.clearVerificationToken = function(): void {
  this.verificationToken = undefined;
  this.verificationTokenExpires = undefined;
};

const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);

export default Usuario;
export { IUsuario };
