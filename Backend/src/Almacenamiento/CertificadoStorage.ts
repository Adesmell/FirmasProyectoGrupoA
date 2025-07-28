import { fileURLToPath } from "url";
import multer from "multer";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que el directorio de uploads existe
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const CertificadoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Filtrar para solo aceptar archivos p12
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (path.extname(file.originalname).toLowerCase() === '.p12') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadCert = multer({ 
  storage: CertificadoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

export { uploadCert, CertificadoStorage };
