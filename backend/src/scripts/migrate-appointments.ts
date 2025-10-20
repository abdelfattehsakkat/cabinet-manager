import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AppointmentModel from '../models/appointment.model';
import PatientModel from '../models/patient.model';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/cabinetdb?authSource=admin')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateAppointments() {
  console.log('Starting appointment migration...');
  
  try {
    // Get all appointments
    const appointments = await AppointmentModel.find({});
    console.log(`Found ${appointments.length} appointments to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const appointment of appointments) {
      try {
        // Skip appointments that already have patient names
        if (appointment.patientFirstName && appointment.patientLastName) {
          console.log(`Appointment ${appointment._id} already has patient names, skipping`);
          successCount++;
          continue;
        }
        
        // Get patient information
        const patient = await PatientModel.findById(appointment.patient);
        
        if (!patient) {
          console.warn(`Patient not found for appointment ${appointment._id}, skipping`);
          errorCount++;
          continue;
        }
        
        // Update appointment with patient names
        appointment.patientFirstName = patient.firstName;
        appointment.patientLastName = patient.lastName;
        await appointment.save();
        
        console.log(`Updated appointment ${appointment._id} with patient names: ${patient.firstName} ${patient.lastName}`);
        successCount++;
      } catch (err) {
        console.error(`Error updating appointment ${appointment._id}:`, err);
        errorCount++;
      }
    }
    
    console.log('Migration completed:');
    console.log(`- Successfully processed: ${successCount} appointments`);
    console.log(`- Errors: ${errorCount} appointments`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateAppointments()
  .then(() => console.log('Migration script completed'))
  .catch(err => console.error('Migration script failed:', err));
