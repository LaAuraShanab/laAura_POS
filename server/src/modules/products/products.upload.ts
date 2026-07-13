import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { ValidationError } from "../../errors/AppError";

export const PRODUCTS_UPLOAD_DIR = path.join(process.cwd(), "uploads", "products");
fs.mkdirSync(PRODUCTS_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCTS_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = randomUUID().slice(0, 8);
    cb(null, `${req.params.id}-${unique}${ext}`);
  },
});

export const productImageUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new ValidationError([{ field: "image", message: "Only JPEG, PNG, or WEBP images are allowed" }]));
    }
    cb(null, true);
  },
});
