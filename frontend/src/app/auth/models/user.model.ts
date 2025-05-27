export type UserRole = 'ADMIN' | 'DOCTOR' | 'SECRETARY';

export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: Date;
  lastLogin?: Date;
}