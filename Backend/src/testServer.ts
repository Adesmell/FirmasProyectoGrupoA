import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import router from "./Rutas/testRutas";
import dotenv from "dotenv";
import morgan from "morgan";
import Certificado from "./Models/Certificado";
import { CAService } from "./Services/CAService";

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(morgan("dev"));
const Puerto = process.env.PORT ? parseInt(process.env.PORT) : 3002;

// Conexión a MongoDB
await mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Documentos", {
  })
  .then(async () => {
    console.log("🔧 Conectado a MongoDB (Documentos) - MODO PRUEBA");
    // Limpiar índices problemáticos de certificados
    try {
      await (Certificado as any).fixIndexes();
      console.log("✅ Índices de certificados corregidos");
    } catch (error) {
      console.log("⚠️ Error al corregir índices:", error);
    }
    
    // Inicializar sistema CA
    try {
      await CAService.initializeCA();
    } catch (error) {
      console.log("⚠️ Error inicializando sistema CA:", error);
    }
  })
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

app.use(cors());
app.use(express.json());

app.use("/api/", router);

app.listen(Puerto, () => {
  console.log(`🔧 Servidor de PRUEBA corriendo en el puerto ${Puerto}`);
  console.log("⚠️  ADVERTENCIA: Este servidor usa autenticación de prueba");
}); 