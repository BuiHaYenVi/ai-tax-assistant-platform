// ==============================================================================
// Tầng Truy cập Dữ liệu Lịch sử Chatbot AI (Chat Repository / DAO)
// Hệ thống: ThuTra TNCN
// ==============================================================================

import { PoolClient } from 'pg';
import { pool } from '../config/database';

export interface ChatConversationEntity {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageEntity {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'assistant';
  content: string;
  legal_references: string[];
  created_at: string;
}

export class ChatRepository {
  /**
   * Tìm hoặc tạo mới phiên hội thoại đang hoạt động cho người dùng
   */
  public async getOrCreateActiveConversation(
    userId: string,
    client?: PoolClient
  ): Promise<ChatConversationEntity> {
    const runner = client || pool;

    const findQuery = `
      SELECT id, user_id, title, is_active, created_at, updated_at
      FROM chat_conversations
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const findRes = await runner.query<ChatConversationEntity>(findQuery, [userId]);
    if (findRes.rows[0]) {
      return findRes.rows[0];
    }

    const insertQuery = `
      INSERT INTO chat_conversations (user_id, title, is_active)
      VALUES ($1, 'Tư vấn quyết toán thuế TNCN', TRUE)
      RETURNING id, user_id, title, is_active, created_at, updated_at;
    `;
    const insertRes = await runner.query<ChatConversationEntity>(insertQuery, [userId]);
    return insertRes.rows[0];
  }

  /**
   * Tạo phiên hội thoại hoàn toàn mới (đóng phiên cũ) khi người dùng bấm Làm mới
   */
  public async createNewConversation(
    userId: string,
    title: string = 'Tư vấn quyết toán thuế TNCN',
    client?: PoolClient
  ): Promise<ChatConversationEntity> {
    const runner = client || pool;

    // Đánh dấu các phiên trước đó là đã kết thúc
    await runner.query(
      `UPDATE chat_conversations SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE;`,
      [userId]
    );

    const insertQuery = `
      INSERT INTO chat_conversations (user_id, title, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING id, user_id, title, is_active, created_at, updated_at;
    `;
    const result = await runner.query<ChatConversationEntity>(insertQuery, [userId, title]);
    return result.rows[0];
  }

  /**
   * Lưu tin nhắn (Người dùng hoặc Trợ lý AI) vào cơ sở dữ liệu
   */
  public async saveMessage(
    conversationId: string,
    senderRole: 'user' | 'assistant',
    content: string,
    legalReferences: string[] = [],
    client?: PoolClient
  ): Promise<ChatMessageEntity> {
    const runner = client || pool;

    const query = `
      INSERT INTO chat_messages (conversation_id, sender_role, content, legal_references)
      VALUES ($1, $2, $3, $4)
      RETURNING id, conversation_id, sender_role, content, legal_references, created_at;
    `;
    const res = await runner.query<ChatMessageEntity>(query, [
      conversationId,
      senderRole,
      content,
      legalReferences,
    ]);

    // Cập nhật timestamp của conversation
    await runner.query(
      `UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
      [conversationId]
    );

    return res.rows[0];
  }

  /**
   * Lấy toàn bộ tin nhắn thuộc một cuộc hội thoại
   */
  public async getMessagesByConversationId(
    conversationId: string,
    client?: PoolClient
  ): Promise<ChatMessageEntity[]> {
    const runner = client || pool;

    const query = `
      SELECT id, conversation_id, sender_role, content, legal_references, created_at
      FROM chat_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC;
    `;
    const res = await runner.query<ChatMessageEntity>(query, [conversationId]);
    return res.rows;
  }

  /**
   * Lấy phiên hội thoại gần nhất kèm danh sách tin nhắn của người dùng
   */
  public async getLatestConversationWithMessages(
    userId: string,
    client?: PoolClient
  ): Promise<{
    conversation: ChatConversationEntity | null;
    messages: ChatMessageEntity[];
  }> {
    const runner = client || pool;

    const convQuery = `
      SELECT id, user_id, title, is_active, created_at, updated_at
      FROM chat_conversations
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const convRes = await runner.query<ChatConversationEntity>(convQuery, [userId]);
    const conversation = convRes.rows[0] || null;

    if (!conversation) {
      return { conversation: null, messages: [] };
    }

    const messages = await this.getMessagesByConversationId(conversation.id, runner);
    return { conversation, messages };
  }
}

export const chatRepository = new ChatRepository();

