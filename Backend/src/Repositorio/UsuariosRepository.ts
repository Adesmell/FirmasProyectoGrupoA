import { Client } from 'pg'
import 'dotenv/config'
import type Usuario from '../Models/Usuario'

export class UsuariosRepository {
  private client: Client

  constructor() {
    this.client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    })
    this.connect()
  }

  private async connect() {
    try {
      await this.client.connect()
      console.log('Connected to PostgreSQL database!')
      await this.initializeTable()
    } catch (error) {
      console.error('Error connecting to the database:', error)
      throw error
    }
  }
  private async initializeTable() {
    try {
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          apellido VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          contraseña VARCHAR(255) NOT NULL
        )
      `)
      console.log('Table usuarios has been initialized')
    } catch (error) {
      console.error('Error initializing table:', error)
      throw error
    }
  }

  async getUsuarios() {
    try {
      console.log('Fetching all usuarios...')
      const result = await this.client.query('SELECT * FROM usuarios')
      console.log(`Found ${result.rows.length} usuarios`)
      return result.rows
    } catch (error) {
      console.error('Error getting usuarios:', error)
      throw error
    }
  }

  async getUsuarioById(id: number) {
    try {
      console.log(`Fetching usuario with id ${id}...`)
      const result = await this.client.query('SELECT * FROM usuarios WHERE id = $1', [id])
      console.log(`Found usuario: ${result.rows[0] ? 'yes' : 'no'}`)
      return result.rows[0]
    } catch (error) {
      console.error('Error getting usuario by id:', error)
      throw error
    }
  }
  async createUsuario(usuario: Usuario) {
    try {
      console.log('Creating new usuario:', { ...usuario, contraseña: '***' })
      const result = await this.client.query(
        'INSERT INTO usuarios (nombre, apellido, email, contraseña) VALUES ($1, $2, $3, $4) RETURNING *',
        [usuario.nombre, usuario.apellido, usuario.email, usuario.contraseña]
      )
      console.log('Usuario created with id:', result.rows[0].id)
      return result.rows[0]
    } catch (error) {
      console.error('Error creating usuario:', error)
      throw error
    }
  }

  async updateUsuario(id: number, usuario: { nombre?: string; email?: string }) {
    try {
      const fields = []
      const values = []
      let index = 1

      if (usuario.nombre) {
        fields.push(`nombre = $${index++}`)
        values.push(usuario.nombre)
      }
      if (usuario.email) {
        fields.push(`email = $${index++}`)
        values.push(usuario.email)
      }

      if (fields.length === 0) return null

      values.push(id)
      const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`
      
      const result = await this.client.query(query, values)
      return result.rows[0]
    } catch (error) {
      console.error('Error updating usuario:', error)
      throw error
    }
  }

  async deleteUsuario(id: number) {
    try {
      const result = await this.client.query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id])
      return result.rows[0]
    } catch (error) {
      console.error('Error deleting usuario:', error)
      throw error
    }
  }
}
