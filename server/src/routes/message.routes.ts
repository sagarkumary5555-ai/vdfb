import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/conversations', MessageController.getConversations);
router.post('/conversations/direct', MessageController.getOrCreateDirect);
router.post('/conversations/group', MessageController.createGroup);
router.get('/conversations/:id/participants', MessageController.getParticipants);
router.get('/', MessageController.getMessages);
router.get('/pinned', MessageController.getPinned);
router.get('/media', MessageController.getSharedMedia);
router.get('/search', MessageController.searchMessages);
router.post('/', MessageController.createMessage);
router.post('/read', MessageController.markAllAsRead);
router.post('/:id/react', MessageController.toggleReaction);
router.post('/:id/pin', MessageController.togglePin);
router.put('/:id', MessageController.editMessage);
router.delete('/:id', MessageController.deleteMessage);

export default router;
