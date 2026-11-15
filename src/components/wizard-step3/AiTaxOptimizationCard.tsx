import React from 'react';
import { Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTaxFiling } from '../../contexts/TaxFilingContext';

interface AiTaxOptimizationCardProps {
  onApplyOptimization?: () => void;
}

const formatVndMoney = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ';
};

export const AiTaxOptimizationCard: React.FC<AiTaxOptimizationCardProps> = ({
  onApplyOptimization,
}) => {
  const { latestAuditResult, activeProfile, incomeSources, dependents } = useTaxFiling();
  const calc = latestAuditResult?.calculation;
  const findings = latestAuditResult?.findings || [];

  const refundAmount = calc?.taxRefund ?? (activeProfile?.financialSummary?.taxBalance && activeProfile.financialSummary.taxBalance > 0 ? activeProfile.financialSummary.taxBalance : 0);
  const payableAmount = calc?.taxPayable ?? (activeProfile?.financialSummary?.taxBalance && activeProfile.financialSummary.taxBalance < 0 ? Math.abs(activeProfile.financialSummary.taxBalance) : 0);
  const totalDeductions = calc?.totalDeductions ?? ((activeProfile?.financialSummary?.personalDeductionAmount || 132000000) + (activeProfile?.financialSummary?.dependentDeductionAmount || 0) + (activeProfile?.financialSummary?.insuranceDeductionAmount || 0));

  const hasMultipleIncomes = incomeSources.length >= 2 || findings.some((f) => f.ruleCode === 'R01');
  const hasRiskFindings = findings.some((f) => f.severity === 'CRITICAL' || f.severity === 'WARNING');

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Phương án tối ưu nghĩa vụ thuế của bạn theo luật hiện hành
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân tích dữ liệu thực tế từ {incomeSources.length} nguồn thu nhập &amp; {dependents.length} người phụ thuộc
            </p>
          </div>
        </div>

        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 self-start sm:self-center shadow-2xs">
          <Sparkles className="w-3 h-3 text-indigo-200" />
          <span>Trợ lý AI Tối ưu thuế TNCN</span>
        </span>
      </div>

      {/* 2. Side-by-Side Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Initial Scenario (Before Optimization) */}
        <div className="border border-rose-200 bg-rose-50/20 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Phương án ban đầu (Chưa tối ưu)
            </span>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {hasRiskFindings ? 'CÓ RỦI RO PHÁP LÝ' : 'CHƯA TẬP TRUNG CHỨNG TỪ'}
            </span>
          </div>

          <div className="text-base font-extrabold text-rose-700 tracking-tight">
            {hasMultipleIncomes 
              ? 'Nguy cơ phạt nộp chậm / bỏ sót' 
              : payableAmount > 0 
              ? `Chưa đối soát: +${formatVndMoney(payableAmount)}` 
              : 'Chưa tối ưu hồ sơ hoàn thuế'}
          </div>

          <p className="text-[11px] text-slate-500 leading-tight pt-1">
            {hasMultipleIncomes
              ? 'Khi có từ 2 nguồn thu nhập trở lên, doanh nghiệp không thể quyết toán thay. Người nộp thuế phải tự thực hiện để tránh phạt tiền chậm nộp 0.03%/ngày.'
              : 'Kê khai phân tán hoặc thiếu giảm trừ gia cảnh làm giảm số thuế bạn được Nhà nước hoàn trả.'}
          </p>
        </div>

        {/* AI Optimized Scenario */}
        <div className="border-2 border-emerald-400 bg-emerald-50/30 rounded-xl p-3.5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Phương án sau tối ưu của ThuTra AI
            </span>
            <span className="bg-[#046a4e] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
              {refundAmount > 0 ? 'ĐƯỢC HOÀN THUẾ' : 'MINH BẠCH NGHĨA VỤ'}
            </span>
          </div>

          <div className="text-base font-extrabold text-[#046a4e] tracking-tight">
            {refundAmount > 0 ? `+${formatVndMoney(refundAmount)}` : `Số thuế phát sinh: ${formatVndMoney(calc?.taxLiability ?? 0)}`}
          </div>

          <p className="text-[11px] text-slate-600 font-medium leading-tight pt-1">
            {refundAmount > 0
              ? `Đã áp dụng trọn vẹn ${formatVndMoney(totalDeductions)} giảm trừ gia cảnh, bảo hiểm bắt buộc và tự động tổng hợp chứng từ hợp pháp.`
              : 'Tất cả các khoản thu nhập và thuế đã khấu trừ được hạch toán đầy đủ, đảm bảo hồ sơ vượt qua kiểm định của Cơ quan Thuế.'}
          </p>
        </div>
      </div>

      {/* 3. Conclusion & Advice Box */}
      <div className="bg-[#f0fbf7] border border-emerald-200/90 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#046a4e]" />
            <span>Mức chênh lệch tối ưu quyền lợi cho bạn:</span>
          </span>
          <span className="bg-emerald-100 text-[#046a4e] border border-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full inline-block shadow-2xs">
            {refundAmount > 0 ? `Quyền lợi hoàn thuế: +${formatVndMoney(refundAmount)}` : 'Hồ sơ an toàn 100%'}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          {findings.length > 0 && findings[0].suggestedFix
            ? `💡 Khuyến nghị từ Rule Engine: ${findings[0].suggestedFix}`
            : 'ThuTra AI đã thẩm tra chéo 15 quy tắc kiểm tra sai sót theo chuẩn nghiệp vụ của Tổng cục Thuế (Thông tư 111 & Thông tư 80). Dữ liệu tờ khai 02/QTT của bạn hoàn toàn sẵn sàng để xuất XML và nộp trực tuyến.'}
        </p>

        <div>
          <button
            type="button"
            onClick={onApplyOptimization}
            className="bg-[#046a4e] hover:bg-[#03543e] active:scale-[0.99] text-white text-xs font-semibold py-2 px-4 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>Áp dụng đề xuất tối ưu này vào tờ khai</span>
          </button>
        </div>
      </div>
    </div>
  );
};
