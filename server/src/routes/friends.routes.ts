import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FriendsController } from '../controllers/friends.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', FriendsController.getOverview);
router.post('/request', FriendsController.sendRequest);
router.post('/accept', FriendsController.acceptRequest);
router.post('/decline', FriendsController.declineRequest);
router.post('/remove', FriendsController.removeFriend);

export const friendsRouter = router;
