import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Interface para crear usuario
interface UsuarioAttributes {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  emailVerificado: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  fechaCreacion: Date;
  ultimoAcceso?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para crear usuario (sin id)
interface UsuarioCreationAttributes {
  nombre: string;
  apellido: string;
  email: string;
  contraseña: string;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  ultimoAcceso?: Date;
}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  declare id: number;
  declare nombre: string;
  declare apellido: string;
  declare email: string;
  declare contraseña: string;
  declare emailVerificado: boolean;
  declare verificationToken?: string;
  declare verificationTokenExpires?: Date;
  declare fechaCreacion: Date;
  declare ultimoAcceso?: Date;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Método para verificar si el token de verificación ha expirado
  public isVerificationTokenExpired(): boolean {
    if (!this.verificationTokenExpires) return true;
    return Date.now() > this.verificationTokenExpires.getTime();
  }

  // Método para limpiar token de verificación
  public clearVerificationToken(): void {
    this.verificationToken = undefined;
    this.verificationTokenExpires = undefined;
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true
      }
    },
    apellido: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [8, 255],
        notEmpty: true
      }
    },
    emailVerificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fechaCreacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ultimoAcceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['verificationToken']
      }
    ]
  }
);

export default Usuario; 