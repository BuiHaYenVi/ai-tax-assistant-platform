// ==============================================================================
// Tầng Điều khiển Kho Tri thức RAG Pháp luật (RAG Controller)
// Hệ thống: ThuTra TNCN - Giai đoạn 4.2
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { ragService } from '../services/rag.service';
import type { ApiResponse } from '../types/api.types';
import { ValidationError, UnauthorizedError } from '../errors/app-error';

export class RagController {
  /**
   * Endpoint: GET /api/admin/rag/documents
   * Lấy danh sách văn bản trong kho tri thức kèm số lượng chunks
   */
  public async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Phiên xác thực không tồn tại.');
      }
      if (!req.dbClient) {
        throw new Error('Database Session Client không được khởi tạo.');
      }

      const docs = await ragService.getDocuments(req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Lấy danh mục văn bản tri thức RAG thành công.',
        data: docs,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: POST /api/admin/rag/documents/upload
   * Nhận tệp tải lên (PDF, DOCX, TXT), bóc tách, chia chunk, sinh vector embeddings và lưu DB
   */
  public async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('File nhận được:', req.file);
      console.log('Body nhận được:', req.body);

      if (!req.user) {
        throw new UnauthorizedError('Phiên xác thực không tồn tại.');
      }
      if (!req.dbClient) {
        throw new Error('Database Session Client không được khởi tạo.');
      }
      if (!req.file) {
        throw new ValidationError('Vui lòng chọn tệp văn bản pháp quy để tải lên.');
      }

      const options = {
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'), // Chuẩn hóa ký tự tiếng Việt
        code: req.body.code,
        title: req.body.title,
        category: req.body.category,
        userId: req.user.id,
      };

      const result = await ragService.ingestDocument(options, req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 201,
        message: `Đã nạp và sinh vector thành công cho ${result.chunksCount} phân đoạn văn bản.`,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: DELETE /api/admin/rag/documents/:id
   * Xóa văn bản pháp luật và cascade xóa toàn bộ chunks
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Phiên xác thực không tồn tại.');
      }
      if (!req.dbClient) {
        throw new Error('Database Session Client không được khởi tạo.');
      }

      const { id } = req.params;
      await ragService.deleteDocument(id, req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Đã xóa văn bản pháp lý và toàn bộ vector liên quan thành công.',
        data: { id },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: POST /api/admin/rag/query
   * Thử nghiệm truy vấn vector ngữ nghĩa (Semantic Search Playground)
   */
  public async query(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Phiên xác thực không tồn tại.');
      }
      if (!req.dbClient) {
        throw new Error('Database Session Client không được khởi tạo.');
      }

      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        throw new ValidationError('Nội dung câu hỏi truy vấn không được để trống.');
      }

      const results = await ragService.searchSimilarChunks(query.trim(), 3, req.dbClient);

      const response: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Truy vấn vector ngữ nghĩa RAG thành công.',
        data: results,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const ragController = new RagController();

