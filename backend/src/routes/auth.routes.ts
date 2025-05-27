import express, { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

export default router;