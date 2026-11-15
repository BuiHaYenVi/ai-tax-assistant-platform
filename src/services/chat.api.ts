// ==============================================================================
// Dịch vụ API Trợ lý AI Thuế ThuTra (Tax Chat AI API Service)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api.types';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface AskChatRequestDto {
  message: string;
  history?: ChatHistoryItem[];
}

export interface AskChatResponseDto {
  reply: string;
  conversationId: string | null;
  legalReferences: string[];
}

export interface StoredChatMessageDto {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  legalReferences: string[];
  timestamp: string;
}

export interface ChatHistoryResponseDto {
  conversationId: string | null;
  messages: StoredChatMessageDto[];
}

export interface ResetChatResponseDto {
  conversationId: string | null;
}

export const chatApi = {
  /**
   * Gửi câu hỏi đến Trợ lý AI Thuế ThuTra
   * POST /chat/ask
   */
  async ask(payload: AskChatRequestDto): Promise<ApiResponse<AskChatResponseDto>> {
    return apiClient.post<AskChatResponseDto>('/chat/ask', payload);
  },

  /**
   * Tải lại lịch sử hội thoại gần nhất của người dùng từ CSDL PostgreSQL
   * GET /chat/history
   */
  async getHistory(): Promise<ApiResponse<ChatHistoryResponseDto>> {
    return apiClient.get<ChatHistoryResponseDto>('/chat/history');
  },

  /**
   * Khởi tạo phiên hội thoại mới khi người dùng bấm nút Làm mới
   * POST /chat/reset
   */
  async reset(): Promise<ApiResponse<ResetChatResponseDto>> {
    return apiClient.post<ResetChatResponseDto>('/chat/reset');
  },
};
