import { Request, Response } from 'express';
import Patient, { IPatient } from '../models/patient.model';

// Get all patients
export const getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[GET] /api/patients - Fetching all patients');
        const patients = await Patient.find() as IPatient[];
        console.log(`Found ${patients.length} patients`);
        res.json(patients);
    } catch (error: any) {
        console.error('[GET] /api/patients - Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get single patient
export const getPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[GET] /api/patients/${req.params.id} - Fetching patient`);
        const patient = await Patient.findById(req.params.id) as IPatient | null;
        if (!patient) {
            console.log(`Patient with ID ${req.params.id} not found`);
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        console.log('Patient found:', patient);
        res.json(patient);
    } catch (error: any) {
        console.error(`[GET] /api/patients/${req.params.id} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// Create patient
export const createPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[POST] /api/patients - Creating new patient');
        console.log('Request body:', req.body);
        
        const patient = await Patient.create(req.body) as IPatient;
        console.log('Patient created successfully:', patient);
        res.status(201).json(patient);
    } catch (error: any) {
        console.error('[POST] /api/patients - Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// Update patient
export const updatePatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ) as IPatient | null;
        
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json(patient);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Delete patient
export const deletePatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id) as IPatient | null;
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.json({ message: 'Patient removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Add medical document
export const addDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        const patient = await Patient.findById(req.params.id) as IPatient | null;
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        const document = {
            name: req.body.name,
            path: req.body.path,
            type: req.body.type,
            uploadDate: new Date()
        };

        if (!Array.isArray(patient.documents)) {
            patient.documents = [];
        }
        
        patient.documents = [...patient.documents, document];
        await patient.save();

        res.status(201).json(document);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};