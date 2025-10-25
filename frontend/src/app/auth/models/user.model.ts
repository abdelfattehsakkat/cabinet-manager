export type UserRole = 'ADMIN' | 'DOCTOR' | 'SECRETARY';

export interface User {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  specialization?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
}