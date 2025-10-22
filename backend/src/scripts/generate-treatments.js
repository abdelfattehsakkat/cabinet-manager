const mongoose = require('mongoose');

// Connection à MongoDB
async function connectDB() {
    try {
        await mongoose.connect('mongodb://root:password@localhost:27017/cabinetdb?authSource=admin');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

// Schéma Treatment pour test
const treatmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientNumber: { type: Number, required: true },
    patientName: { type: String, required: true },
    treatmentDate: { type: Date, required: true },
    description: { type: String, required: true },
    notes: { type: String },
    cost: { type: Number, min: 0 }
}, { timestamps: true });

const Treatment = mongoose.model('Treatment', treatmentSchema);

// Schéma Patient existant
const patientSchema = new mongoose.Schema({
    patientNumber: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    medicalHistory: {
        conditions: [String],
        allergies: [String],
        medications: [String],
        notes: String
    },
    documents: [{
        name: { type: String, required: true },
        path: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        type: { type: String, required: true }
    }]
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

// Données de test pour les traitements
const sampleTreatments = [
    {
        description: "Consultation générale + examen clinique",
        notes: "Patient en bonne santé générale. Tension artérielle normale.",
        cost: 50,
        daysAgo: 5
    },
    {
        description: "Vaccination COVID-19 (rappel)",
        notes: "Aucune réaction allergique observée. Patient informé des effets secondaires possibles.",
        cost: 0,
        daysAgo: 30
    },
    {
        description: "Traitement antibiotique pour infection respiratoire",
        notes: "Prescription: Amoxicilline 500mg 3x/jour pendant 7 jours. Revoir dans une semaine.",
        cost: 75,
        daysAgo: 15
    },
    {
        description: "Suture de plaie mineure au bras",
        notes: "Plaie de 3cm suturée avec 4 points. Retrait des points dans 10 jours.",
        cost: 120,
        daysAgo: 8
    },
    {
        description: "Contrôle diabète + bilan sanguin",
        notes: "HbA1c: 7.2%. Ajustement du traitement nécessaire. Revoir dans 3 mois.",
        cost: 90,
        daysAgo: 45
    },
    {
        description: "Nettoyage et pansement de brûlure",
        notes: "Brûlure du 2e degré sur la main. Pansement à changer quotidiennement.",
        cost: 65,
        daysAgo: 3
    }
];

async function generateTreatments() {
    try {
        await connectDB();
        
        console.log('🔍 Recherche des patients existants...');
        
        // Récupérer les premiers patients
        const patients = await Patient.find().limit(20);
        
        if (patients.length === 0) {
            console.log('❌ Aucun patient trouvé. Veuillez d\'abord générer des patients.');
            process.exit(1);
        }
        
        console.log(`✅ ${patients.length} patients trouvés`);
        
        // Supprimer les anciens traitements pour éviter les doublons
        await Treatment.deleteMany({});
        console.log('🧹 Anciens traitements supprimés');
        
        let totalTreatments = 0;
        
        // Générer des traitements pour chaque patient
        for (const patient of patients) {
            const numTreatments = Math.floor(Math.random() * 4) + 1; // 1 à 4 traitements par patient
            
            for (let i = 0; i < numTreatments; i++) {
                const treatmentTemplate = sampleTreatments[Math.floor(Math.random() * sampleTreatments.length)];
                
                // Date aléatoire dans les derniers mois
                const randomDaysAgo = Math.floor(Math.random() * 90) + 1; // 1 à 90 jours
                const treatmentDate = new Date();
                treatmentDate.setDate(treatmentDate.getDate() - randomDaysAgo);
                
                const treatment = new Treatment({
                    patientId: patient._id,
                    patientNumber: patient.patientNumber,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    treatmentDate: treatmentDate,
                    description: treatmentTemplate.description,
                    notes: treatmentTemplate.notes,
                    cost: Math.max(0, treatmentTemplate.cost + Math.floor(Math.random() * 20) - 10) // Assurer que le coût >= 0
                });
                
                await treatment.save();
                totalTreatments++;
            }
            
            console.log(`✅ Traitements créés pour ${patient.firstName} ${patient.lastName} (N°${patient.patientNumber})`);
        }
        
        console.log(`\n🎉 ${totalTreatments} traitements générés avec succès !`);
        console.log('\n📊 Statistiques:');
        
        const stats = await Treatment.aggregate([
            {
                $group: {
                    _id: null,
                    totalTreatments: { $sum: 1 },
                    totalCost: { $sum: '$cost' },
                    avgCost: { $avg: '$cost' }
                }
            }
        ]);
        
        if (stats.length > 0) {
            console.log(`   - Total traitements: ${stats[0].totalTreatments}`);
            console.log(`   - Coût total: ${stats[0].totalCost.toFixed(2)} TND`);
            console.log(`   - Coût moyen: ${stats[0].avgCost.toFixed(2)} TND`);
        }
        
        const recentTreatments = await Treatment.find()
            .sort({ treatmentDate: -1 })
            .limit(5)
            .select('patientName treatmentDate description cost');
            
        console.log('\n📋 Derniers traitements créés:');
        recentTreatments.forEach(treatment => {
            console.log(`   - ${treatment.patientName}: ${treatment.description} (${treatment.cost} TND) - ${treatment.treatmentDate.toLocaleDateString('fr-FR')}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération des traitements:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnexion de MongoDB');
    }
}

// Lancer la génération
generateTreatments();