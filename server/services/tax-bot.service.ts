// ==============================================================================
// Dịch vụ Trợ lý AI Thuế TNCN (Tax AI Assistant Service)
// Hệ thống: ThuTra TNCN
// Tích hợp: Google Gemini 1.5 Flash (@google/generative-ai)
// ==============================================================================

import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { env } from '../config/env.config';
import { chatRepository } from '../repositories/chat.repository';
import { ragService } from './rag.service';

const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý Thuế ThuTra AI" - Người bạn đồng hành và Chuyên gia AI tư vấn pháp luật, quyết toán Thuế thu nhập cá nhân (TNCN) tại Việt Nam của nền tảng ThuTra TNCN.

1. NGUYÊN TẮC GIAO TIẾP & VĂN PHONG (TỰ NHIÊN, LINH HOẠT, KHÔNG RẬP KHUÔN):
- Giao tiếp thân thiện, ân cần, tự nhiên như một chuyên gia tư vấn giàu kinh nghiệm, tuyệt đối KHÔNG trả lời như máy móc hay ép cứng nhắc vào một khuôn mẫu cố định cho mọi câu hỏi.
- Phản xạ linh hoạt theo độ phức tạp của câu hỏi:
  + Khi người dùng chỉ chào hỏi hoặc hỏi câu xã giao (VD: "Chào bạn", "Bạn là ai?"): Trả lời ngắn gọn, lịch sự, giới thiệu vai trò Trợ lý ThuTra AI và niềm nở hỏi người dùng cần giải đáp điều gì về thuế TNCN.
  + Khi người dùng hỏi số liệu cụ thể (VD: "Mức giảm trừ gia cảnh là bao nhiêu?", "Hạn nộp thuế là ngày nào?"): Nêu trực diện câu trả lời và số liệu chính xác ngay câu đầu tiên, sau đó mới giải thích ngắn gọn thêm về điều kiện (nếu có).
  + Khi người dùng gặp tình huống thuế phức tạp (VD: làm việc 2 nơi, thu nhập freelance vãng lai bị trừ 10%, thiếu chứng từ công ty cũ, người phụ thuộc ngoài độ tuổi...): Trình bày giải pháp logic, thấu hiểu, phân tích tình huống thực tế và hướng dẫn cách kê khai đối soát trên ThuTra TNCN.
- Định dạng Markdown tự nhiên, thoáng mắt:
  + Sử dụng in đậm **số tiền**, **mốc thời gian**, **điều kiện quan trọng**.
  + Sử dụng gạch đầu dòng linh hoạt khi liệt kê điều kiện hoặc hồ sơ.
  + Có thể đưa ra lời khuyên hoặc mẹo tối ưu số thuế ("💡 Gợi ý:") khi phù hợp với ngữ cảnh câu hỏi, không bắt buộc câu nào cũng phải có.

2. CƠ SỞ PHÁP LÝ & SỐ LIỆU CHUẨN XÁC:
- Mức giảm trừ gia cảnh hiện hành (Nghị quyết 954/2020/UBTVQH14 & Thông tư 111/2013/TT-BTC):
  + Bản thân người nộp thuế: 11.000.000 VNĐ/tháng (132.000.000 VNĐ/năm).
  + Người phụ thuộc (được cấp MST/CCCD): 4.400.000 VNĐ/tháng/người (52.800.000 VNĐ/năm/người).
- Biểu thuế lũy tiến từng phần 7 bậc (thu nhập từ tiền lương, tiền công):
  + Bậc 1: Đến 5 triệu/tháng -> 5%
  + Bậc 2: Trên 5 đến 10 triệu/tháng -> 10%
  + Bậc 3: Trên 10 đến 18 triệu/tháng -> 15%
  + Bậc 4: Trên 18 đến 32 triệu/tháng -> 20%
  + Bậc 5: Trên 32 đến 52 triệu/tháng -> 25%
  + Bậc 6: Trên 52 đến 80 triệu/tháng -> 30%
  + Bậc 7: Trên 80 triệu/tháng -> 35%
- Các khoản được trừ hợp pháp: Bảo hiểm bắt buộc (BHXH 8%, BHYT 1.5%, BHTN 1%), quỹ hưu trí tự nguyện, đóng góp từ thiện/nhân đạo có hóa đơn chứng từ.
- Thu nhập miễn thuế: Phần tiền lương làm thêm giờ/ban đêm cao hơn ban ngày theo luật lao động; phụ cấp trang phục, tiền ăn trưa theo quy định; bồi thường bảo hiểm...
- Nguyên tắc quyết toán cá nhân làm 2 nơi: Nếu trong năm có nhiều nguồn thu nhập từ tiền lương/tiền công, cá nhân tự quyết toán trực tiếp với cơ quan thuế. Không được ủy quyền quyết toán nếu có từ 2 nguồn thu nhập trở lên trừ trường hợp vãng lai dưới 10 triệu/tháng đã khấu trừ 10% và không có nhu cầu quyết toán khoản đó.
- Hạn nộp quyết toán: Đối với cá nhân tự quyết toán là ngày cuối cùng của tháng thứ 4 kể từ khi kết thúc năm dương lịch (thường là 30/4). Trường hợp có số thuế nộp thừa đề nghị hoàn, nộp sau thời hạn này KHÔNG bị xử phạt chậm nộp hồ sơ.

3. KẾT NỐI VỚI HỆ THỐNG THUTRA TNCN:
Khi người dùng cần hướng dẫn thực hiện, hãy chỉ dẫn 4 bước tối ưu trên nền tảng:
- Bước 1: Khai báo thông tin cá nhân & người phụ thuộc (hỗ trợ đồng bộ VNeID/CCCD).
- Bước 2: Tải lên chứng từ khấu trừ thuế điện tử (hệ thống có OCR đọc tự động).
- Bước 3: Xem Bảng kê quyết toán & Đối soát tự động (hệ thống tự động tính số thuế được hoàn hoặc phải nộp thêm).
- Bước 4: Tải file XML chuẩn Tổng cục Thuế (Mẫu 02/QTT-TNCN) để nộp trực tuyến qua eTax Mobile / canhan.gdt.gov.vn.
`;

export interface ChatMessagePart {
  text: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
}

export class TaxBotService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.GEMINI.apiKey) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI.apiKey);
    }
  }

  /**
   * Khởi tạo lại client nếu API key được cập nhật runtime
   */
  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!env.GEMINI.apiKey) {
        throw new Error('Chưa cấu hình GEMINI_API_KEY trong hệ thống.');
      }
      this.genAI = new GoogleGenerativeAI(env.GEMINI.apiKey);
    }
    return this.genAI;
  }

  /**
   * Tương tác với Gemini Model để tư vấn quyết toán thuế TNCN (Tích hợp RAG)
   */
  public async chatWithBot(
    userMessage: string,
    history: ChatHistoryItem[] = []
  ): Promise<{ responseText: string; ragReferences: string[] }> {
    if (!userMessage || !userMessage.trim()) {
      throw new Error('Nội dung câu hỏi không được để trống.');
    }

    const client = this.getClient();

    // 1. Bước RAG: Tìm kiếm Top 3 chunks có độ tương đồng Cosine cao nhất từ kho tri thức
    let ragContext = '';
    const ragReferences: string[] = [];
    try {
      const topChunks = await ragService.searchSimilarChunks(userMessage.trim(), 3);
      if (topChunks && topChunks.length > 0) {
        ragContext = topChunks
          .map(
            (c, i) =>
              `[Căn cứ ${i + 1} - ${c.documentCode} (${c.documentTitle}) - Độ tương đồng: ${(c.similarity * 100).toFixed(1)}%]:\n${c.content}`
          )
          .join('\n\n');

        topChunks.forEach((c) => {
          if (c.documentCode && !ragReferences.includes(c.documentCode)) {
            ragReferences.push(c.documentCode);
          }
        });
      }
    } catch (ragErr) {
      console.warn('[TaxBotService RAG]: Bỏ qua truy vấn RAG do cảnh báo:', ragErr);
    }

    // Ghép RAG context vào System Instruction
    let systemInstructionWithRag = SYSTEM_INSTRUCTION;
    if (ragContext) {
      systemInstructionWithRag += `\n\n4. CĂN CỨ VĂN BẢN QUY PHẠM PHÁP LUẬT ĐƯỢC TRÍCH XUẤT TỪ KHO TRI THỨC RAG:
Sử dụng các trích dẫn luật pháp sau đây (nếu liên quan) để tư vấn chính xác, dẫn chứng rõ ràng số hiệu điều khoản cho người nộp thuế:
${ragContext}
`;
    }

    // Danh sách model ưu tiên (Google đã nâng cấp v1beta lên dòng Flash-lite latest)
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-1.5-flash',
    ];

    // Chuẩn hóa và làm sạch lịch sử hội thoại
    const validHistory: Content[] = history
      .filter((item) => item && (item.role === 'user' || item.role === 'model') && Array.isArray(item.parts))
      .map((item) => ({
        role: item.role,
        parts: item.parts.map((p) => ({ text: p.text || '' })),
      }));

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstructionWithRag,
        });

        const chat = model.startChat({
          history: validHistory,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        });

        const result = await chat.sendMessage(userMessage.trim());
        const response = await result.response;
        const responseText = response.text();

        if (responseText) {
          return { responseText, ragReferences };
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`[TaxBotService]: Thử model ${modelName} không thành công (${error?.message?.slice(0, 100)}), đang chuyển tiếp model khả dụng...`);
      }
    }

    console.error('[TaxBotService Error]:', lastError);
    
    // Xử lý thông báo lỗi chi tiết, dễ hiểu
    if (lastError?.status === 400 || lastError?.message?.includes('API_KEY_INVALID')) {
      throw new Error('Khóa API Gemini không hợp lệ. Vui lòng kiểm tra lại cấu hình GEMINI_API_KEY.');
    }
    if (lastError?.status === 429 || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Hệ thống AI hiện đang tiếp nhận lượng lớn câu hỏi (Rate limit). Vui lòng đợi trong giây lát và thử lại.');
    }
    throw new Error(lastError?.message || 'Không thể kết nối đến Trợ lý AI Thuế. Vui lòng thử lại sau.');
  }

  /**
   * Tự động trích xuất các căn cứ pháp lý từ nội dung câu trả lời và RAG context
   */
  public extractLegalReferences(text: string, ragReferences: string[] = []): string[] {
    const matches = new Set<string>(ragReferences);
    const patterns = [
      /Thông tư\s+\d+[\/\w\.-]*/gi,
      /Nghị quyết\s+\d+[\/\w\.-]*/gi,
      /Nghị định\s+\d+[\/\w\.-]*/gi,
      /Luật\s+[\w\s]{2,20}(?:TNCN|QLT|\d{4})/gi,
    ];

    for (const regex of patterns) {
      const found = text.match(regex);
      if (found) {
        found.slice(0, 3).forEach((item) => matches.add(item.trim()));
      }
    }

    if (matches.size === 0) {
      return ['Thông tư 111/2013/TT-BTC', 'Nghị quyết 954/2020/UBTVQH14', 'Nghị định 126/2020/NĐ-CP'];
    }

    return Array.from(matches).slice(0, 5);
  }

  /**
   * Hỏi đáp và tự động lưu trữ phiên hội thoại vào CSDL PostgreSQL nếu có userId
   */
  public async askAndPersist(
    userId?: string,
    userMessage: string = '',
    history: ChatHistoryItem[] = []
  ): Promise<{ reply: string; conversationId: string | null; legalReferences: string[] }> {
    let conversationId: string | null = null;

    if (userId) {
      const conversation = await chatRepository.getOrCreateActiveConversation(userId);
      conversationId = conversation.id;
      await chatRepository.saveMessage(conversation.id, 'user', userMessage.trim(), []);
    }

    const { responseText, ragReferences } = await this.chatWithBot(userMessage, history);
    const legalReferences = this.extractLegalReferences(responseText, ragReferences);

    if (userId && conversationId) {
      await chatRepository.saveMessage(conversationId, 'assistant', responseText, legalReferences);
    }

    return {
      reply: responseText,
      conversationId,
      legalReferences,
    };
  }

  /**
   * Tải lại lịch sử cuộc trò chuyện của phiên gần nhất
   */
  public async getHistory(userId: string) {
    const { conversation, messages } = await chatRepository.getLatestConversationWithMessages(userId);

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      sender: m.sender_role === 'user' ? ('user' as const) : ('bot' as const),
      text: m.content,
      legalReferences: m.legal_references || [],
      timestamp: new Date(m.created_at).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    return {
      conversationId: conversation ? conversation.id : null,
      messages: formattedMessages,
    };
  }

  /**
   * Làm mới phiên hội thoại (tạo conversation mới rỗng)
   */
  public async resetSession(userId: string) {
    const newConv = await chatRepository.createNewConversation(userId);
    return {
      conversationId: newConv.id,
    };
  }
}

export const taxBotService = new TaxBotService();
