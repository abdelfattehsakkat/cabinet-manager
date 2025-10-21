const { faker } = require('@faker-js/faker');

// Prénoms arabes
const arabicMaleNames = [
  'Mohamed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Khalil', 'Samir', 'Karim', 
  'Hassen', 'Mehdi', 'Amin', 'Farid', 'Nabil', 'Tarek', 'Walid', 'Sami',
  'Rami', 'Zied', 'Slim', 'Maher', 'Adel', 'Fadi', 'Bassem', 'Hichem'
];

const arabicFemaleNames = [
  'Fatma', 'Aicha', 'Amina', 'Salma', 'Leila', 'Nour', 'Yasmine', 'Sarra', 
  'Rania', 'Nesrine', 'Sihem', 'Wafa', 'Manel', 'Meriem', 'Ines', 'Rim',
  'Dorra', 'Emna', 'Sabrine', 'Mouna', 'Latifa', 'Hela', 'Nadia', 'Samia'
];

const arabicLastNames = [
  'Ben Ali', 'Trabelsi', 'Gharbi', 'Sassi', 'Mahmoudi', 'Boussaid', 'Sakkat',
  'Guedria', 'Dridi', 'Khelifi', 'Mansouri', 'Bouazizi', 'Chemli', 'Tlili',
  'Ben Salem', 'Hamdi', 'Chedly', 'Belkacem', 'Oueslati', 'Sfaxi', 'Jebali',
  'Chaouachi', 'Ben Abdallah', 'Mekki', 'Zitouni', 'Ben Othman'
];

function randomGender() {
  return faker.helpers.arrayElement(['male', 'female']);
}

function randomDateOfBirth() {
  const year = faker.number.int({ min: 1940, max: 2010 });
  const month = faker.number.int({ min: 0, max: 11 });
  const day = faker.number.int({ min: 1, max: 28 });
  return new Date(Date.UTC(year, month, day));
}

function randomMedicalHistory() {
  return {
    conditions: [],
    allergies: [],
    medications: [],
    notes: faker.lorem.sentence()
  };
}

function randomPatient(i) {
  const gender = randomGender();
  const firstName = gender === 'male' 
    ? faker.helpers.arrayElement(arabicMaleNames)
    : faker.helpers.arrayElement(arabicFemaleNames);
  const lastName = faker.helpers.arrayElement(arabicLastNames);
  
  return {
    patientNumber: i + 1, // ID incrémental commençant par 1
    firstName: firstName,
    lastName: lastName,
    dateOfBirth: randomDateOfBirth(),
    gender,
    email: `${lastName.toLowerCase().replace(/\s+/g, '')}.${firstName.toLowerCase()}@gmail.com`,
    phoneNumber: faker.string.numeric(8),
    address: faker.location.streetAddress(),
    medicalHistory: randomMedicalHistory(),
    documents: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  };
}

const patients = [];
for (let i = 0; i < 500; i++) {
  patients.push(randomPatient(i));
}

console.log(JSON.stringify(patients, null, 2));