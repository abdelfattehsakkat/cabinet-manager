import express, { Router } from 'express';
import {
    getPatients,
    getPatientsPage,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    addDocument
} from '../controllers/patient.controller';
import { upload } from '../utils/fileUpload';

const router: Router = express.Router();

// Specific routes first (before dynamic routes)
router.get('/search', getPatientsPage);
router.post('/:id/documents', upload.single('document'), addDocument);

// Base CRUD routes
router.get('/', getPatients);
router.post('/', createPatient);

// Dynamic ID routes (must be last)
router.get('/:id', getPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;