import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Appointment, { IAppointment } from '../models/appointment.model';

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[GET] /appointments - Query params:', req.query);
        const filter: any = {};
        
        // Filtrage par doctorId désactivé (application monopratique)
        // if (req.query.doctorId) {
        //     filter.doctor = req.query.doctorId;
        // }
        
        if (req.query.patientId) {
            filter.patient = req.query.patientId;
        }
        
        if (req.query.startDate && req.query.endDate) {
            filter.date = {
                $gte: new Date(req.query.startDate as string),
                $lte: new Date(req.query.endDate as string)
            };
        }

        console.log('Applying filter:', filter);
        const appointments = await Appointment.find(filter)
            .populate('doctor', 'firstName lastName');

        // Add patient full name to each appointment using stored patient names
        const appointmentsWithNames = appointments.map(appointment => {
            return {
                ...appointment.toObject(),
                patientName: `${appointment.patientFirstName} ${appointment.patientLastName}`,
                patientNumber: appointment.patientNumber || ''
            };
        });
            
        console.log(`Found ${appointments.length} appointments`);
        res.json(appointmentsWithNames);
    } catch (error: any) {
        console.error('[GET] /appointments - Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[GET] /appointments/${req.params.id}`);
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctor', 'firstName lastName') as IAppointment | null;
            
        if (!appointment) {
            console.log(`Appointment ${req.params.id} not found`);
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        
        // Add patient name to the appointment object using stored first and last name
        const appointmentWithName = {
            ...appointment.toObject(),
            patientName: `${appointment.patientFirstName} ${appointment.patientLastName}`,
            patientNumber: appointment.patientNumber || ''
        };
        
        console.log('Found appointment:', appointmentWithName);
        res.json(appointmentWithName);
    } catch (error: any) {
        console.error(`[GET] /appointments/${req.params.id} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

const isDoctorAvailable = async (doctorId: string, date: Date, duration: number, excludeAppointmentId?: string): Promise<boolean> => {
    console.log('Checking doctor availability:', { doctorId, date, duration, excludeAppointmentId });
    const appointmentDate = new Date(date);
    const endDate = new Date(appointmentDate.getTime() + duration * 60000);

    const query: any = {
        doctor: doctorId,
        date: {
            $lt: endDate,
            $gt: new Date(appointmentDate.getTime() - (30 * 60000)) // Check 30 minutes before
        },
        $or: [
            { status: 'scheduled' },
            { status: 'confirmed' }
        ]
    };

    if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
    }

    const conflictingAppointments = await Appointment.find(query);
    console.log('Found conflicting appointments:', conflictingAppointments);
    
    // Check if any appointment overlaps with the requested time slot
    const hasConflict = conflictingAppointments.some(existing => {
        const existingStart = new Date(existing.date);
        const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);
        
        return (
            // New appointment starts during an existing appointment
            (appointmentDate >= existingStart && appointmentDate < existingEnd) ||
            // New appointment ends during an existing appointment
            (endDate > existingStart && endDate <= existingEnd) ||
            // New appointment completely encompasses an existing appointment
            (appointmentDate <= existingStart && endDate >= existingEnd)
        );
    });

    const isAvailable = !hasConflict;
    console.log('Doctor availability result:', isAvailable);
    return isAvailable;
}

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[POST] /appointments - Request body:', req.body);
        const { patient, patientId, patientFirstName, patientLastName, doctor, date, duration = 30 } = req.body;

        const isAvailable = await isDoctorAvailable(doctor, date, duration);
        if (!isAvailable) {
            console.log('Doctor is not available at requested time');
            res.status(400).json({ message: 'Doctor is not available at this time' });
            return;
        }

        let appointmentData: any = {
            ...req.body,
            doctor,
            date,
            duration
        };

        // Check if we have an existing patient or a new patient
        const actualPatientId = patient || patientId;
        
        if (actualPatientId) {
            // Existing patient - fetch details from database
            const Patient = mongoose.model('Patient');
            const patientDetails = await Patient.findById(actualPatientId);
            
            if (!patientDetails) {
                console.log('Patient not found');
                res.status(400).json({ message: 'Patient not found' });
                return;
            }
            
            appointmentData.patient = actualPatientId;
            appointmentData.patientFirstName = patientDetails.firstName;
            appointmentData.patientLastName = patientDetails.lastName;
            appointmentData.patientNumber = patientDetails.patientNumber || '';
        } else {
            // New patient - use provided names
            if (!patientFirstName || !patientLastName) {
                console.log('Patient first name and last name are required for new patients');
                res.status(400).json({ message: 'Patient first name and last name are required' });
                return;
            }
            
            appointmentData.patientFirstName = patientFirstName;
            appointmentData.patientLastName = patientLastName;
            appointmentData.patientNumber = ''; // Pas de numéro de fiche pour les nouveaux patients
            // No patient ID for new patients
            delete appointmentData.patient;
            delete appointmentData.patientId;
        }

        const appointment = await Appointment.create(appointmentData) as IAppointment;
        console.log('Created appointment:', appointment);
        res.status(201).json(appointment);
    } catch (error: any) {
        console.error('[POST] /appointments - Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[PUT] /appointments/${req.params.id} - Request body:`, req.body);
        const { patient, doctor, date, duration = 30 } = req.body;

        if (date || doctor) {
            const isAvailable = await isDoctorAvailable(
                doctor,
                date,
                duration,
                req.params.id
            );
            if (!isAvailable) {
                console.log('Doctor is not available at requested time');
                res.status(400).json({ message: 'Doctor is not available at this time' });
                return;
            }
        }

        // Prepare update data
        let updateData = { ...req.body };
        
        // If patient ID is changing, update patient names
        if (patient) {
            const Patient = mongoose.model('Patient');
            const patientDetails = await Patient.findById(patient);
            
            if (!patientDetails) {
                console.log('Patient not found');
                res.status(400).json({ message: 'Patient not found' });
                return;
            }
            
            // Add patient first name and last name to the update
            updateData.patientFirstName = patientDetails.firstName;
            updateData.patientLastName = patientDetails.lastName;
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('patient', 'firstName lastName')
         .populate('doctor', 'firstName lastName') as IAppointment | null;

        if (!appointment) {
            console.log(`Appointment ${req.params.id} not found`);
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        console.log('Updated appointment:', appointment);
        res.json(appointment);
    } catch (error: any) {
        console.error(`[PUT] /appointments/${req.params.id} - Error:`, error.message);
        res.status(400).json({ message: error.message });
    }
};

export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[DELETE] /appointments/${req.params.id}`);
        const appointment = await Appointment.findByIdAndDelete(req.params.id) as IAppointment | null;
        if (!appointment) {
            console.log(`Appointment ${req.params.id} not found`);
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        console.log('Deleted appointment:', appointment);
        res.json({ message: 'Appointment removed' });
    } catch (error: any) {
        console.error(`[DELETE] /appointments/${req.params.id} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[PATCH] /appointments/${req.params.id}/status - Request body:`, req.body);
        const { status } = req.body;
        
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('patient', 'firstName lastName')
         .populate('doctor', 'firstName lastName') as IAppointment | null;

        if (!appointment) {
            console.log(`Appointment ${req.params.id} not found`);
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        console.log('Updated appointment status:', appointment);
        res.json(appointment);
    } catch (error: any) {
        console.error(`[PATCH] /appointments/${req.params.id}/status - Error:`, error.message);
        res.status(400).json({ message: error.message });
    }
};