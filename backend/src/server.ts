import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/database';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import treatmentRoutes from './routes/treatment.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// CORS configuration - allow all origins temporarily
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes without auth middleware
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
app.get('/', (_req: Request, res: Response) => {
    res.send('Cabinet AI API is running');
});

// Error handling
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
};

app.use(errorHandler);

// Handle 404 routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});