import express, { Router } from 'express';
import {
    getAllTreatments,
    getPatientTreatments,
    getTreatment,
    createTreatment,
    updateTreatment,
    deleteTreatment,
    getPatientTreatmentStats
} from '../controllers/treatment.controller';

const router: Router = express.Router();

// Specific routes first (before dynamic routes)
router.get('/patient/:patientId', getPatientTreatments);
router.get('/patient/:patientId/stats', getPatientTreatmentStats);

// Base CRUD routes
router.get('/', getAllTreatments);
router.post('/', createTreatment);

// Dynamic ID routes (must be last)
router.get('/:id', getTreatment);
router.put('/:id', updateTreatment);
router.delete('/:id', deleteTreatment);

export default router;