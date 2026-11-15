// ==============================================================================
// Định tuyến Endpoint Kho Tri thức RAG Pháp lý Thuế (RAG Routes)
// Hệ thống: ThuTra TNCN - Giai đoạn 4.2
// ==============================================================================

import { Router } from 'express';
import multer from 'multer';
import { ragController } from '../controllers/rag.controller';
import { authMiddleware, requireRoles } from '../middlewares/auth.middleware';
import { dbSessionMiddleware } from '../middlewares/db-session.middleware';

const router = Router();

// Cấu hình Multer lưu tạm trong bộ nhớ RAM (Memory Storage) để parse buffer trực tiếp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // Giới hạn kích thước tệp 30MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt|md)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tệp văn bản định dạng PDF, DOCX, DOC hoặc TXT.'));
    }
  },
});

/**
 * @route   GET /api/admin/rag/documents
 * @desc    Lấy danh mục văn bản trong kho tri thức RAG kèm số lượng chunks
 * @access  Private (admin_manager, super_admin)
 */
router.get(
  '/documents',
  authMiddleware,
  requireRoles('admin_manager', 'super_admin'),
  dbSessionMiddleware,
  ragController.getDocuments
);

/**
 * @route   POST /api/admin/rag/documents/upload
 * @desc    Tải lên tệp văn bản pháp lý, tự động bóc tách, chunking và sinh vector embeddings lưu DB
 * @access  Private (admin_manager, super_admin)
 */
router.post(
  '/documents/upload',
  authMiddleware,
  requireRoles('admin_manager', 'super_admin'),
  upload.single('document'), // Dùng đúng 1 key khớp với Frontend
  dbSessionMiddleware,
  ragController.upload
);

/**
 * @route   DELETE /api/admin/rag/documents/:id
 * @desc    Xóa văn bản và tự động cascade xóa toàn bộ các chunks trong kho tri thức
 * @access  Private (admin_manager, super_admin)
 */
router.delete(
  '/documents/:id',
  authMiddleware,
  requireRoles('admin_manager', 'super_admin'),
  dbSessionMiddleware,
  ragController.delete
);

/**
 * @route   POST /api/admin/rag/query
 * @desc    Truy vấn vector ngữ nghĩa (Semantic Search Playground)
 * @access  Private (admin_manager, super_admin)
 */
router.post(
  '/query',
  authMiddleware,
  requireRoles('admin_manager', 'super_admin'),
  dbSessionMiddleware,
  ragController.query
);

export const ragRouter = router;

