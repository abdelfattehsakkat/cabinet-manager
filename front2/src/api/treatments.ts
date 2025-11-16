import api from './client';

export type Treatment = {
  _id: string;
  patientId: string;
  patientNumber?: number;
  patientName?: string; // full name fallback
  treatmentDate?: string;
  dent?: number;
  description?: string;
  honoraire?: number;
  recu?: number;
  createdAt?: string;
  updatedAt?: string;
  // optional embedded patient info (some endpoints may return this)
  patient?: {
    _id: string;
    patientNumber?: number;
    firstName?: string;
    lastName?: string;
  };
};

export type TreatmentPaginatedResponse = {
  treatments: Treatment[];
  patient?: {
    _id: string;
    patientNumber: number;
    firstName: string;
    lastName: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
};

export async function getAllTreatments(page = 1, limit = 10, search = ''): Promise<TreatmentPaginatedResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());
  return api.get(`/treatments?${params.toString()}`) as Promise<TreatmentPaginatedResponse>;
}

export async function getPatientTreatments(patientId: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return api.get(`/treatments/patient/${patientId}?${params.toString()}`) as Promise<TreatmentPaginatedResponse>;
}

export async function getTreatment(id: string) {
  return api.get(`/treatments/${id}`) as Promise<Treatment>;
}

export async function createTreatment(t: Partial<Treatment>) {
  return api.post('/treatments', t) as Promise<Treatment>;
}

export async function updateTreatment(id: string, t: Partial<Treatment>) {
  return api.put(`/treatments/${id}`, t) as Promise<Treatment>;
}

export async function deleteTreatment(id: string) {
  return api.del(`/treatments/${id}`);
}

export default { getAllTreatments, getPatientTreatments, getTreatment, createTreatment, updateTreatment, deleteTreatment };
