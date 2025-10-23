export type UserRole = 'ADMIN' | 'DOCTOR' | 'SECRETARY';

export interface User {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  specialization?: string;
  createdAt?: Date;
  lastLogin?: Date;
}