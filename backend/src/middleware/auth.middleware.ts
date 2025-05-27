import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

interface JwtPayload {
    id: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            res.status(401).json({ message: 'Not authorized - No token' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized - Invalid token' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
            return;
        }
        next();
    };
};