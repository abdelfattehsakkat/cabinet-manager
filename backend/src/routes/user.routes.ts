import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, authorize('ADMIN'), getUsers);
router.get('/:id', protect, authorize('ADMIN'), getUser);
router.post('/', protect, authorize('ADMIN'), createUser);
router.put('/:id', protect, authorize('ADMIN'), updateUser);
router.delete('/:id', protect, authorize('ADMIN'), deleteUser);

export default router;
