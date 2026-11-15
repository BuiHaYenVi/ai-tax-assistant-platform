// ==============================================================================
// Tầng Điều khiển Trợ lý AI Thuế (Tax Chat AI Controller)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import { Request, Response, NextFunction } from 'express';
import { taxBotService } from '../services/tax-bot.service';
import type { ApiResponse } from '../types/api.types';
import { BadRequestError } from '../errors/app-error';

export class ChatController {
  /**
   * Endpoint: POST /api/chat/ask
   * Nhận câu hỏi và ngữ cảnh hội thoại, trả về tư vấn thuế từ Trợ lý AI ThuTra
   * Tự động lưu trữ lịch sử vào CSDL nếu người dùng đã đăng nhập
   */
  public async ask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history } = req.body;
      const userId = req.user?.id;

      if (!message || typeof message !== 'string' || !message.trim()) {
        throw new BadRequestError('Vui lòng cung cấp nội dung câu hỏi.');
      }

      const result = await taxBotService.askAndPersist(
        userId,
        message.trim(),
        Array.isArray(history) ? history : []
      );

      const response: ApiResponse<{
        reply: string;
        conversationId: string | null;
        legalReferences: string[];
      }> = {
        success: true,
        statusCode: 200,
        message: 'Trợ lý AI đã trả lời thành công.',
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: GET /api/chat/history
   * Tải lại lịch sử tin nhắn của phiên hội thoại gần nhất
   */
  public async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse<{ conversationId: string | null; messages: any[] }> = {
          success: true,
          statusCode: 200,
          message: 'Chế độ khách (chưa đăng nhập), không có lịch sử lưu trên máy chủ.',
          data: { conversationId: null, messages: [] },
          timestamp: new Date().toISOString(),
        };
        res.status(200).json(response);
        return;
      }

      const data = await taxBotService.getHistory(userId);

      const response: ApiResponse<typeof data> = {
        success: true,
        statusCode: 200,
        message: 'Lấy lịch sử hội thoại thành công.',
        data,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: POST /api/chat/reset
   * Tạo phiên hội thoại mới khi người dùng bấm nút Làm mới
   */
  public async reset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse<{ conversationId: string | null }> = {
          success: true,
          statusCode: 200,
          message: 'Đã làm mới phiên hội thoại tạm thời (chế độ khách).',
          data: { conversationId: null },
          timestamp: new Date().toISOString(),
        };
        res.status(200).json(response);
        return;
      }

      const data = await taxBotService.resetSession(userId);

      const response: ApiResponse<typeof data> = {
        success: true,
        statusCode: 200,
        message: 'Đã khởi tạo phiên hội thoại mới thành công.',
        data,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
