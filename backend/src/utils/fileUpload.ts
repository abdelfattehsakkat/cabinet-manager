import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept images and documents
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and documents are allowed'));
    }
};

// Export upload middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});