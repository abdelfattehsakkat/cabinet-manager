import api from './client';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'SECRETARY';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  specialization?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phoneNumber?: string;
  specialization?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  phoneNumber?: string;
  specialization?: string;
}

const usersApi = {
  getUsers: async (): Promise<User[]> => {
    return api.get('/users');
  },

  getUser: async (id: string): Promise<User> => {
    return api.get(`/users/${id}`);
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    return api.post('/users', payload);
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    return api.put(`/users/${id}`, payload);
  },

  deleteUser: async (id: string): Promise<void> => {
    return api.del(`/users/${id}`);
  },
};

export default usersApi;
