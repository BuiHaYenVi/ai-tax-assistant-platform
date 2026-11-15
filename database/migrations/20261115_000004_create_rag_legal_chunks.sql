-- ==============================================================================
-- BẢNG RAG_LEGAL_CHUNKS (Lưu trữ Vector Embedding Phân đoạn Văn bản Pháp luật)
-- Hệ thống: ThuTra TNCN - Giai đoạn RAG Tri thức Động
-- ==============================================================================

CREATE TABLE IF NOT EXISTS rag_legal_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_legal_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding FLOAT8[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CLOCK_TIMESTAMP()
);

-- Chỉ mục tối ưu truy vấn theo văn bản nguồn và số thứ tự chunk
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_legal_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc_chunk_idx ON rag_legal_chunks(document_id, chunk_index);

COMMENT ON TABLE rag_legal_chunks IS 'Lưu trữ các phân đoạn văn bản quy phạm pháp luật và vector embedding 768 chiều cho RAG AI';
COMMENT ON COLUMN rag_legal_chunks.document_id IS 'Mã văn bản nguồn (Khóa ngoại tham chiếu rag_legal_documents, ON DELETE CASCADE)';
COMMENT ON COLUMN rag_legal_chunks.chunk_index IS 'Thứ tự của đoạn văn bản trong tài liệu nguồn';
COMMENT ON COLUMN rag_legal_chunks.content IS 'Nội dung chi tiết của đoạn văn bản pháp luật';
COMMENT ON COLUMN rag_legal_chunks.embedding IS 'Mảng vector số thực 768 chiều sinh từ Gemini text-embedding-004';

-- Thiết lập bảo mật Row-Level Security (RLS) đồng bộ với rag_legal_documents
ALTER TABLE rag_legal_chunks ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin: Toàn quyền
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rag_legal_chunks' AND policyname = 'rls_rag_chunks_super_admin') THEN
        CREATE POLICY rls_rag_chunks_super_admin ON rag_legal_chunks
            FOR ALL TO PUBLIC
            USING (is_super_admin())
            WITH CHECK (is_super_admin());
    END IF;
END $$;

-- 2. Admin Manager: Toàn quyền quản trị tri thức
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rag_legal_chunks' AND policyname = 'rls_rag_chunks_admin_manager') THEN
        CREATE POLICY rls_rag_chunks_admin_manager ON rag_legal_chunks
            FOR ALL TO PUBLIC
            USING (is_admin_manager())
            WITH CHECK (is_admin_manager());
    END IF;
END $$;

-- 3. Người dùng bình thường / Chatbot: Đọc dữ liệu phục vụ tư vấn
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rag_legal_chunks' AND policyname = 'rls_rag_chunks_user') THEN
        CREATE POLICY rls_rag_chunks_user ON rag_legal_chunks
            FOR SELECT TO PUBLIC
            USING (current_app_user_role() = 'user');
    END IF;
END $$;

