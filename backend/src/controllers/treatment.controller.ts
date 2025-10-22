import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Treatment, { ITreatment } from '../models/treatment.model';
import Patient from '../models/patient.model';

// Get treatments for a specific patient
export const getPatientTreatments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        console.log(`[GET] /api/treatments/patient/${patientId} - Fetching treatments`);

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        // Get treatments with pagination
        const treatments = await Treatment.find({ patientId })
            .sort({ treatmentDate: -1 }) // Most recent first
            .skip(skip)
            .limit(limit);

        const totalCount = await Treatment.countDocuments({ patientId });
        const totalPages = Math.ceil(totalCount / limit);

        console.log(`Found ${treatments.length} treatments for patient ${patientId}`);

        res.json({
            treatments,
            patient: {
                _id: patient._id,
                patientNumber: patient.patientNumber,
                firstName: patient.firstName,
                lastName: patient.lastName
            },
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            }
        });
    } catch (error: any) {
        console.error(`[GET] /api/treatments/patient/${req.params.patientId} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get all treatments with search and pagination
export const getAllTreatments = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || '';
        const skip = (page - 1) * limit;

        console.log(`[GET] /api/treatments - Fetching all treatments`);

        // Build search query
        let searchQuery: any = {};
        
        if (search && search.trim()) {
            const searchTerm = search.trim();
            const isNumber = !isNaN(Number(searchTerm));
            
            const searchConditions: any[] = [
                { patientName: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { notes: { $regex: searchTerm, $options: 'i' } }
            ];
            
            if (isNumber) {
                searchConditions.push({ patientNumber: Number(searchTerm) });
            }
            
            searchQuery = { $or: searchConditions };
        }

        const treatments = await Treatment.find(searchQuery)
            .sort({ treatmentDate: -1 })
            .skip(skip)
            .limit(limit);

        const totalCount = await Treatment.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limit);

        console.log(`Found ${treatments.length} treatments (page ${page}/${totalPages})`);

        res.json({
            treatments,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit
            }
        });
    } catch (error: any) {
        console.error('[GET] /api/treatments - Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get single treatment
export const getTreatment = async (req: Request, res: Response): Promise<void> => {
    try {
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            res.status(404).json({ message: 'Treatment not found' });
            return;
        }
        console.log(`[GET] /api/treatments/${req.params.id} - Treatment found`);
        res.json(treatment);
    } catch (error: any) {
        console.error(`[GET] /api/treatments/${req.params.id} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// Create treatment
export const createTreatment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[POST] /api/treatments - Creating new treatment');
        console.log('Request body:', req.body);

        const { patientId } = req.body;

        // Verify patient exists and get patient info
        const patient = await Patient.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        // Add patient info to treatment data
        const treatmentData = {
            ...req.body,
            patientNumber: patient.patientNumber,
            patientName: `${patient.firstName} ${patient.lastName}`
        };

        const treatment = await Treatment.create(treatmentData);
        console.log('Treatment created successfully:', treatment);
        res.status(201).json(treatment);
    } catch (error: any) {
        console.error('[POST] /api/treatments - Error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// Update treatment
export const updateTreatment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[PUT] /api/treatments/${req.params.id} - Updating treatment`);
        
        const treatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!treatment) {
            res.status(404).json({ message: 'Treatment not found' });
            return;
        }

        console.log('Treatment updated successfully:', treatment);
        res.json(treatment);
    } catch (error: any) {
        console.error(`[PUT] /api/treatments/${req.params.id} - Error:`, error.message);
        res.status(400).json({ message: error.message });
    }
};

// Delete treatment
export const deleteTreatment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`[DELETE] /api/treatments/${req.params.id} - Deleting treatment`);
        
        const treatment = await Treatment.findByIdAndDelete(req.params.id);
        if (!treatment) {
            res.status(404).json({ message: 'Treatment not found' });
            return;
        }

        console.log('Treatment deleted successfully');
        res.json({ message: 'Treatment removed' });
    } catch (error: any) {
        console.error(`[DELETE] /api/treatments/${req.params.id} - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get treatment statistics for a patient
export const getPatientTreatmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        
        console.log(`[GET] /api/treatments/patient/${patientId}/stats - Fetching stats`);

        const stats = await Treatment.aggregate([
            { $match: { patientId: new mongoose.Types.ObjectId(patientId) } },
            {
                $group: {
                    _id: null,
                    totalTreatments: { $sum: 1 },
                    totalCost: { $sum: '$cost' },
                    lastTreatmentDate: { $max: '$treatmentDate' },
                    firstTreatmentDate: { $min: '$treatmentDate' }
                }
            }
        ]);

        const result = stats.length > 0 ? stats[0] : {
            totalTreatments: 0,
            totalCost: 0,
            lastTreatmentDate: null,
            firstTreatmentDate: null
        };

        console.log('Treatment stats:', result);
        res.json(result);
    } catch (error: any) {
        console.error(`[GET] /api/treatments/patient/${req.params.patientId}/stats - Error:`, error.message);
        res.status(500).json({ message: error.message });
    }
};