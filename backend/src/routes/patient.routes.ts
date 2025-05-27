import express, { Router } from 'express';
import {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    addDocument
} from '../controllers/patient.controller';
import { upload } from '../utils/fileUpload';

const router: Router = express.Router();

// Routes without authentication temporarily
router.route('/')
    .get(getPatients)
    .post(createPatient);

router.route('/:id')
    .get(getPatient)
    .put(updatePatient)
    .delete(deletePatient);

// File upload route without auth
router.post('/:id/documents', upload.single('document'), addDocument);

export default router;