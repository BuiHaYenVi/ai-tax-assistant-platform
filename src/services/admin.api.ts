// ==============================================================================
// Dịch vụ API Phân hệ Quản trị & Tham số Hệ thống (Admin & Settings API Service)
// Hệ thống: ThuTra TNCN - Tầng 2: Typed API Services
// ==============================================================================

import { apiClient } from './apiClient';
import type { ApiResponse } from '../types/api.types';
import type {
  PublicSettingsDto,
  UpdateSettingsRequestDto,
  TaxRuleDto,
  UpdateTaxRuleDto,
  AuditLogQueryDto,
  AuditLogsResponseDto,
} from '../types/business.types';

export const adminApi = {
  /**
   * Lấy danh mục tham số thuế công khai và biểu lũy tiến 7 bậc (Public, không cần Bearer token)
   * GET /settings/public
   */
  async getPublicSettings(): Promise<ApiResponse<PublicSettingsDto>> {
    return apiClient.get<PublicSettingsDto>('/settings/public');
  },

  /**
   * Cập nhật tham số hệ thống (chỉ Super Admin có quyền)
   * PUT /settings
   */
  async updateSettings(payload: UpdateSettingsRequestDto): Promise<ApiResponse<any>> {
    return apiClient.put<any>('/settings', payload);
  },

  /**
   * Lấy danh mục toàn bộ 15 quy tắc thẩm tra kèm trạng thái và căn cứ pháp lý
   * GET /admin/rules (Dành cho admin_manager & super_admin)
   */
  async getAdminRules(): Promise<ApiResponse<TaxRuleDto[]>> {
    return apiClient.get<TaxRuleDto[]>('/admin/rules');
  },

  /**
   * Xem chi tiết cấu hình và ngưỡng kiểm tra của 1 quy tắc theo ID hoặc Code (ví dụ: R01, R10)
   * GET /admin/rules/:id
   */
  async getAdminRuleById(id: string): Promise<ApiResponse<TaxRuleDto>> {
    return apiClient.get<TaxRuleDto>(`/admin/rules/${id}`);
  },

  /**
   * Cập nhật quy tắc thẩm tra, tự động tăng version và ghi bản ghi vào tax_rule_history
   * PUT /admin/rules/:id (Chỉ Super Admin có quyền)
   */
  async updateAdminRule(id: string, payload: UpdateTaxRuleDto): Promise<ApiResponse<TaxRuleDto>> {
    return apiClient.put<TaxRuleDto>(`/admin/rules/${id}`, payload);
  },

  /**
   * Xem nhật ký kiểm toán hệ thống có phân trang và đã che mờ CCCD/MST/Email theo Nghị định 13/2023
   * GET /admin/audit-logs
   */
  async getAuditLogs(query?: AuditLogQueryDto): Promise<ApiResponse<AuditLogsResponseDto>> {
    return apiClient.get<AuditLogsResponseDto>('/admin/audit-logs', {
      params: query,
    });
  },

  /**
   * ============================================================================
   * PHÂN HỆ KHO TRI THỨC PHÁP LÝ RAG (RAG KNOWLEDGE BASE)
   * ============================================================================
   */

  /**
   * Lấy danh mục văn bản trong kho tri thức RAG kèm số lượng chunks
   * GET /admin/rag/documents
   */
  async getRagDocuments(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/admin/rag/documents');
  },

  /**
   * Tải lên tài liệu pháp luật (PDF, Word, Text) để bóc tách, chia chunk và sinh vector
   * POST /admin/rag/documents/upload
   */
  async uploadRagDocument(formData: FormData): Promise<ApiResponse<any>> {
    return apiClient.upload<any>('/admin/rag/documents/upload', formData);
  },

  /**
   * Xóa văn bản pháp luật và các vector chunks liên quan
   * DELETE /admin/rag/documents/:id
   */
  async deleteRagDocument(id: string): Promise<ApiResponse<any>> {
    return apiClient.delete<any>(`/admin/rag/documents/${id}`);
  },

  /**
   * Thử nghiệm truy vấn vector ngữ nghĩa (Semantic Search Tester)
   * POST /admin/rag/query
   */
  async queryRag(query: string): Promise<ApiResponse<any[]>> {
    return apiClient.post<any[]>('/admin/rag/query', { query });
  },
};

export default adminApi;
