# Generate Patients Script

## Purpose
Generates 100 fake patients with Arabic names for testing the CabinetAI application.

## Usage
```bash
cd backend
node src/scripts/generate-patients.js > patients.json
```

## Output Format
- **Names**: Arabic first/last names (Mohamed, Fatma, Ben Ali, etc.)
- **Email**: `lastname.firstname@gmail.com` format
- **Phone**: 8-digit numbers
- **Date of Birth**: Random dates between 1940-2010
- **Gender**: male/female
- **Address**: Random street addresses
- **Medical History**: Empty conditions/allergies/medications with random notes

## MongoDB Import
Use the generated JSON file to import into MongoDB:
```js
const patients = require('./patients.json');
db.getCollection('patients').insertMany(patients);
```