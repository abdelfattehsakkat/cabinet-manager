// Script pour générer des données de test pour les traitements avec nouveau modèle
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = 'mongodb://root:password@localhost:27017/cabinetdb?authSource=admin';

// Schéma Treatment avec nouveau modèle
const treatmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientNumber: { type: Number, required: true },
    patientName: { type: String, required: true },
    treatmentDate: { type: Date, required: true },
    dent: { type: Number, required: true, min: 1, max: 48 },
    description: { type: String, required: true },
    honoraire: { type: Number, required: true, min: 0 },
    recu: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const Treatment = mongoose.model('Treatment', treatmentSchema);

// Schéma Patient
const patientSchema = new mongoose.Schema({
    patientNumber: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    email: { type: String }
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);

// Descriptions de soins dentaires
const treatmentDescriptions = [
    'Consultation et examen clinique',
    'Détartrage et polissage',
    'Soin de carie',
    'Extraction dentaire',
    'Couronne céramique',
    'Plombage composite',
    'Traitement de canal',
    'Pose d\'implant',
    'Prothèse partielle',
    'Blanchiment dentaire',
    'Orthodontie - pose de bagues',
    'Dévitalisation',
    'Reconstruction coronaire',
    'Gingivectomie',
    'Chirurgie parodontale'
];

// Fonction pour générer une date aléatoire dans les 6 derniers mois
function getRandomDate() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const now = new Date();
    
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime);
}

// Fonction pour générer un numéro de dent aléatoire (1-48)
function getRandomToothNumber() {
    return Math.floor(Math.random() * 48) + 1;
}

// Fonction pour générer des honoraires et reçu réalistes
function generatePayment() {
    const honoraire = Math.floor(Math.random() * 500) + 50; // Entre 50 et 550 DT
    const recu = Math.random() > 0.2 ? honoraire : Math.floor(honoraire * 0.7); // 80% payé intégralement
    return { honoraire, recu };
}

async function generateNewTreatments() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connecté à MongoDB');

        // Vider la collection treatments
        await Treatment.deleteMany({});
        console.log('Collection treatments vidée');

        // Récupérer tous les patients
        const patients = await Patient.find({});
        console.log(`${patients.length} patients trouvés`);

        if (patients.length === 0) {
            console.log('Aucun patient trouvé!');
            return;
        }

        const treatments = [];

        // Générer 2-4 traitements par patient
        for (const patient of patients) {
            const numTreatments = Math.floor(Math.random() * 3) + 2; // 2 à 4 traitements
            
            for (let i = 0; i < numTreatments; i++) {
                const payment = generatePayment();
                
                const treatment = {
                    patientId: patient._id,
                    patientNumber: patient.patientNumber,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    treatmentDate: getRandomDate(),
                    dent: getRandomToothNumber(),
                    description: treatmentDescriptions[Math.floor(Math.random() * treatmentDescriptions.length)],
                    honoraire: payment.honoraire,
                    recu: payment.recu
                };
                
                treatments.push(treatment);
            }
        }

        // Insérer tous les traitements
        const result = await Treatment.insertMany(treatments);
        console.log(`${result.length} traitements créés avec succès`);

        // Afficher quelques statistiques
        const totalHonoraires = treatments.reduce((sum, t) => sum + t.honoraire, 0);
        const totalRecu = treatments.reduce((sum, t) => sum + t.recu, 0);
        const impayeTotal = totalHonoraires - totalRecu;
        
        console.log(`\nStatistiques:`);
        console.log(`- Total honoraires: ${totalHonoraires} DT`);
        console.log(`- Total reçu: ${totalRecu} DT`);
        console.log(`- Impayé total: ${impayeTotal} DT`);
        console.log(`- Taux de paiement: ${((totalRecu / totalHonoraires) * 100).toFixed(1)}%`);

        await mongoose.disconnect();
        console.log('\nDéconnecté de MongoDB');
        
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

// Exécuter
generateNewTreatments();