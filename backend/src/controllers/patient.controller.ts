import { Request, Response } from 'express';
import Patient, { IPatient } from '../models/patient.model';

// Generate next patient number
const generateNextPatientNumber = async (): Promise<number> => {
    try {
        // Find the patient with the highest patientNumber
        const lastPatient = await Patient.findOne().sort({ patientNumber: -1 }).exec();
        
        if (!lastPatient || !lastPatient.patientNumber) {
            // If no patients exist or no patientNumber field, start with 1
            return 1;
        }
        
        // Return the next number
        return lastPatient.patientNumber + 1;
    } catch (error) {
        console.error('Error generating patient number:', error);
        // Fallback to 1 if there's an error
        return 1;
    }
};

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

// Get patients with pagination and search
export const getPatientsPage = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[GET] /api/patients/paginated - Fetching patients with pagination');
        
        // Extract query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || '';
        
        console.log(`Pagination params: page=${page}, limit=${limit}, search="${search}"`);
        
        // Build search query
        let searchQuery: any = {};
        
        if (search && search.trim()) {
            const searchTerm = search.trim();
            
            // Check if search term is a number (for patient number or phone)
            const isNumber = !isNaN(Number(searchTerm));
            
            const searchConditions: any[] = [
                // Search in firstName and lastName (case insensitive)
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                // Search in phone number (partial match)
                { phoneNumber: { $regex: searchTerm, $options: 'i' } }
            ];
            
            // If it's a number, also search in patientNumber
            if (isNumber) {
                searchConditions.push({ patientNumber: Number(searchTerm) });
                // Also search partial match in patientNumber by converting to string
                searchConditions.push({ 
                    $expr: { 
                        $regexMatch: { 
                            input: { $toString: "$patientNumber" }, 
                            regex: searchTerm, 
                            options: "i" 
                        } 
                    } 
                });
            }
            
            searchQuery = { $or: searchConditions };
        }
        
        console.log('Search query:', JSON.stringify(searchQuery, null, 2));
        
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        
        // Execute query with pagination
        const patients = await Patient.find(searchQuery)
            .sort({ _id: -1 }) // Sort by newest first (latest created)
            .skip(skip)
            .limit(limit) as IPatient[];
        
        // Get total count for pagination info
        const totalCount = await Patient.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalCount / limit);
        
        console.log(`Found ${patients.length} patients (page ${page}/${totalPages}, total: ${totalCount})`);
        
        res.json({
            patients,
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
        console.error('[GET] /api/patients/paginated - Error:', error.message);
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
        
        // Generate the next patient number automatically
        const patientNumber = await generateNextPatientNumber();
        console.log('Generated patient number:', patientNumber);
        
        // Add the patient number to the request body
        const patientData = {
            ...req.body,
            patientNumber: patientNumber
        };
        
        const patient = await Patient.create(patientData) as IPatient;
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