import React from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  ShieldCheck, 
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTaxFiling } from '../../contexts/TaxFilingContext';

interface RealtimeTaxSidebarProps {
  onViewTaxFormula?: () => void;
}

export const RealtimeTaxSidebar: React.FC<RealtimeTaxSidebarProps> = ({
  onViewTaxFormula
}) => {
  const { activeProfile, incomeSources, dependents } = useTaxFiling();

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Math.round(Number(val) || 0);
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // 1. Tổng thu nhập chịu thuế tích lũy
  const totalIncomeToDate = incomeSources.length > 0
    ? incomeSources.reduce((sum, s) => sum + (Number(s.totalTaxableIncome || s.totalIncomeGross) || 0), 0)
    : (activeProfile?.financialSummary?.totalTaxableIncome || 0);

  // 2. Tổng thuế TNCN đã tạm khấu trừ tại nguồn
  const totalTaxWithheldToDate = incomeSources.length > 0
    ? incomeSources.reduce((sum, s) => sum + (Number(s.taxWithheld) || 0), 0)
    : (activeProfile?.financialSummary?.taxWithheldTotal || 0);

  // 3. Giảm trừ bản thân (132 triệu/năm - 11tr x 12 tháng)
  const personalDeduction = totalIncomeToDate > 0
    ? (activeProfile?.financialSummary?.personalDeductionAmount || 132000000)
    : 0;

  // 4. Giảm trừ người phụ thuộc (4.4tr/tháng/người = 52.8tr/năm/người)
  const dependentsDeduction = activeProfile?.financialSummary?.dependentDeductionAmount 
    ?? (dependents.length * 52800000);

  // 5. Bảo hiểm bắt buộc trừ lương
  const insuranceDeduction = incomeSources.length > 0
    ? incomeSources.reduce((sum, s) => sum + (Number(s.insuranceDeduction) || 0), 0)
    : (activeProfile?.financialSummary?.insuranceDeductionAmount || 0);

  // 6. Thu nhập tính thuế (Assessable Income)
  const totalDeductions = personalDeduction + dependentsDeduction + insuranceDeduction;
  const assessableIncome = Math.max(0, totalIncomeToDate - totalDeductions);

  // 7. Tính thuế phải nộp theo biểu thuế lũy tiến từng phần (Thông tư 111/2013/TT-BTC)
  const calculateProgressiveTax = (assessable: number): number => {
    if (assessable <= 0) return 0;
    if (assessable <= 60000000) return assessable * 0.05;
    if (assessable <= 120000000) return assessable * 0.10 - 3000000;
    if (assessable <= 216000000) return assessable * 0.15 - 9000000;
    if (assessable <= 384000000) return assessable * 0.20 - 19800000;
    if (assessable <= 624000000) return assessable * 0.25 - 39000000;
    if (assessable <= 960000000) return assessable * 0.30 - 70200000;
    return assessable * 0.35 - 118200000;
  };

  const taxPayable = activeProfile?.financialSummary?.taxPayable ?? calculateProgressiveTax(assessableIncome);

  // Chênh lệch: Số tạm nộp - Số thực tế phải nộp
  const taxBalance = totalTaxWithheldToDate - taxPayable;
  const isRefund = taxBalance > 0;
  const isPayMore = taxBalance < 0;
  const isBalanced = taxBalance === 0;

  return (
    <div className="space-y-4">
      {/* 1. Main Calculation Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#046a4e]" />
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Ước tính số liệu sau Bước 2
            </h3>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Real-time DB</span>
          </span>
        </div>

        {/* Highlight Result Card */}
        <div 
          onClick={onViewTaxFormula}
          className={`border rounded-2xl p-4 text-center shadow-2xs space-y-1.5 cursor-pointer transition-colors ${
            isRefund 
              ? 'bg-[#f0fbf7] border-emerald-200/90 hover:border-emerald-300' 
              : isPayMore
                ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            DỰ KIẾN TRẠNG THÁI QUYẾT TOÁN
          </span>

          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
            isRefund 
              ? 'text-[#046a4e]' 
              : isPayMore 
                ? 'text-amber-700' 
                : 'text-slate-800'
          }`}>
            {isRefund && '+'}
            {formatCurrency(taxBalance)} VNĐ
          </div>

          <div>
            {isRefund && (
              <span className="bg-[#046a4e] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Ước tính hoàn thuế</span>
              </span>
            )}
            {isPayMore && (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                <span>Cần nộp thêm</span>
              </span>
            )}
            {isBalanced && (
              <span className="bg-slate-700 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                <Check className="w-3 h-3 stroke-[2]" />
                <span>Đã khấu trừ đủ</span>
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Items List */}
        <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-slate-600">
            <span>Tổng thu nhập tính đến hiện tại:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatCurrency(totalIncomeToDate)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Tổng thuế TNCN đã tạm nộp:</span>
            <span className="font-bold text-emerald-700 font-mono">
              {formatCurrency(totalTaxWithheldToDate)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Giảm trừ bản thân (11tr x 12th):</span>
            <span className="font-bold text-slate-700 font-mono">
              - {formatCurrency(personalDeduction)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Giảm trừ người phụ thuộc ({dependents.length} người):</span>
            <span className="font-bold text-slate-700 font-mono">
              - {formatCurrency(dependentsDeduction)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>BHXH, BHYT bắt buộc đã trừ:</span>
            <span className="font-bold text-slate-700 font-mono">
              - {formatCurrency(insuranceDeduction)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-800 pt-1.5 border-t border-slate-100 font-semibold">
            <span>Thu nhập tính thuế:</span>
            <span className="font-bold font-mono">
              {formatCurrency(assessableIncome)} VNĐ
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-800 font-semibold">
            <span>Thuế TNCN thực tế phải nộp:</span>
            <span className="font-bold text-blue-700 font-mono">
              {formatCurrency(taxPayable)} VNĐ
            </span>
          </div>
        </div>

        {/* Legal Note Box */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-600">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            Theo Điều 22 Luật Thuế TNCN: Các khoản thu nhập được quyết toán gộp chung theo biểu thuế lũy tiến từng phần; thuế đã tạm khấu trừ 10% tại các nguồn vãng lai sẽ được bù trừ hoàn trả nếu chưa đến mức chịu thuế.
          </p>
        </div>
      </div>

      {/* 2. Preparation for Step 3 Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Chuẩn bị cho Bước 3</span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Tự động đối soát mã số thuế bên chi trả trên cơ sở dữ liệu TCT</span>
          </div>

          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Kiểm tra trùng lặp chứng từ khấu trừ thuế điện tử TT78</span>
          </div>

          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Kích hoạt 15 quy tắc Rule Engine chuẩn hóa hồ sơ hoàn thuế</span>
          </div>
        </div>
      </div>
    </div>
  );
};
