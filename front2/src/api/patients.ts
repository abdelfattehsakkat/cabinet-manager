import api from './client';

export type Patient = {
  _id: string;
  patientNumber?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  documents?: any[];
  createdAt?: string;
  updatedAt?: string;
};

export async function getPatients(): Promise<Patient[]> {
  return api.get('/patients');
}

export type PaginatedResponse = {
  patients: Patient[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
};

export async function searchPatients(page = 1, limit = 10, search = ''): Promise<PaginatedResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());
  return api.get(`/patients/search?${params.toString()}`) as Promise<PaginatedResponse>;
}

export async function getPatient(id: string): Promise<Patient> {
  return api.get(`/patients/${id}`) as Promise<Patient>;
}

export async function createPatient(patient: Partial<Patient>): Promise<Patient> {
  return api.post('/patients', patient) as Promise<Patient>;
}

export async function updatePatient(id: string, patient: Partial<Patient>): Promise<Patient> {
  return api.put(`/patients/${id}`, patient) as Promise<Patient>;
}

export async function deletePatient(id: string): Promise<void> {
  await api.del(`/patients/${id}`);
}

export default { getPatients, searchPatients, getPatient, createPatient, updatePatient, deletePatient };
