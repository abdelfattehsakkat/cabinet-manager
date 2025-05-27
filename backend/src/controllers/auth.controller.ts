import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { Types } from 'mongoose';

const generateToken = (id: string | Types.ObjectId): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id: id.toString() }, secret);
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, password, role, phoneNumber, specialization } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role,
            phoneNumber,
            specialization
        }) as IUser;

        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id as Types.ObjectId)
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).exec() as IUser | null;
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id as Types.ObjectId)
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id).select('-password').exec() as IUser | null;
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};