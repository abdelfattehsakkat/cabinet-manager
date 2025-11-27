import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';

// GET /api/users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber, specialization } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }
    const user = new User({ firstName, lastName, email, password, role, phoneNumber, specialization });
    await user.save();
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber, specialization } = req.body;
    
    // Find user first
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (specialization !== undefined) user.specialization = specialization;
    
    // Update password if provided (will be hashed by pre-save hook)
    if (password && password.trim().length >= 6) {
      user.password = password;
    }
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    res.json(userResponse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
