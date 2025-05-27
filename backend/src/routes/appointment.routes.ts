import express, { Router } from 'express';
import {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus
} from '../controllers/appointment.controller';

const router: Router = express.Router();

// Routes without authentication temporarily
router.route('/')
    .get(getAppointments)
    .post(createAppointment);

router.route('/:id')
    .get(getAppointment)
    .put(updateAppointment)
    .delete(deleteAppointment);

router.patch('/:id/status', updateStatus);

export default router;