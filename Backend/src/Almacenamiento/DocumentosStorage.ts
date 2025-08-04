import { fileURLToPath } from "url";
import multer from "multer";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DocumentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Filtro para solo aceptar PDFs
const fileFilter = (req, file, cb) => {
  console.log("🔍 Verificando archivo:", file.originalname, "Tipo:", file.mimetype);
  
  if (file.mimetype === 'application/pdf') {
    console.log("✅ Archivo PDF válido");
    cb(null, true);
  } else {
    console.log("❌ Tipo de archivo no válido:", file.mimetype);
    cb(new Error('Solo se permiten archivos PDF'), false);
  }
};

// Límites de archivo
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 1 // Solo un archivo por vez
};

const uploadDoc = multer({ 
  storage: DocumentStorage,
  fileFilter: fileFilter,
  limits: limits
});

export { uploadDoc, DocumentStorage };
