// ==============================================================================
// Định tuyến Endpoint Trợ lý AI Thuế (Tax Chat AI Routes)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { optionalAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/chat/ask
 * @desc    Tương tác với Trợ lý AI ThuTra để tư vấn quyết toán thuế TNCN
 * @access  Optional Auth (Nếu có token -> tự động lưu DB, chưa có -> chế độ khách)
 */
router.post('/ask', optionalAuthMiddleware, chatController.ask);

/**
 * @route   GET /api/chat/history
 * @desc    Tải lại lịch sử hội thoại gần nhất của người dùng
 * @access  Optional Auth
 */
router.get('/history', optionalAuthMiddleware, chatController.getHistory);

/**
 * @route   POST /api/chat/reset
 * @desc    Tạo phiên hội thoại mới khi người dùng bấm nút Làm mới
 * @access  Optional Auth
 */
router.post('/reset', optionalAuthMiddleware, chatController.reset);

export default router;
