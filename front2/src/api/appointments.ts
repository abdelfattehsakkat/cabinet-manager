import api from './client';

export type Appointment = {
  _id?: string;
  patientFirstName: string;
  patientLastName: string;
  patientName?: string;
  patientNumber?: string;
  doctor?: string;
  date: string;
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
};

export const getAppointments = async (opts: { startDate?: string | Date; endDate?: string | Date } = {}) => {
  const params = new URLSearchParams();
  if (opts.startDate) params.append('startDate', (opts.startDate as any).toString());
  if (opts.endDate) params.append('endDate', (opts.endDate as any).toString());
  const path = `/appointments?${params.toString()}`;
  return api.get(path) as Promise<Appointment[]>;
};

export const updateAppointment = async (id: string, data: Partial<Appointment>) => {
  return api.put(`/appointments/${id}`, data) as Promise<Appointment>;
};

export default { getAppointments, updateAppointment };
