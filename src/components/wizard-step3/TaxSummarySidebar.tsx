import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useTaxFiling } from '../../contexts/TaxFilingContext';

const formatVndMoney = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ';
};

export const TaxSummarySidebar: React.FC = () => {
  const { activeProfile, dependents, latestAuditResult } = useTaxFiling();
  const [showBracketsDetail, setShowBracketsDetail] = useState(false);

  const calc = latestAuditResult?.calculation;
  const summary = activeProfile?.financialSummary;

  // Dữ liệu từ Audit Service thật (ưu tiên calc nếu đã chạy audit)
  const totalIncome = calc?.grossIncome ?? summary?.totalTaxableIncome ?? 0;
  const personalDeduction = calc?.personalDeduction ?? summary?.personalDeductionAmount ?? 132000000;
  const dependentDeduction = calc?.dependentDeduction ?? summary?.dependentDeductionAmount ?? 0;
  const insuranceDeduction = calc?.insuranceDeduction ?? summary?.insuranceDeductionAmount ?? 0;
  const charityDeduction = calc?.charityDeduction ?? 0;
  const totalDeductions = calc?.totalDeductions ?? (personalDeduction + dependentDeduction + insuranceDeduction + charityDeduction);
  
  const taxableIncome = calc?.taxableIncome ?? summary?.assessableIncome ?? Math.max(0, totalIncome - totalDeductions);
  const calculatedTax = calc?.taxLiability ?? summary?.taxPayable ?? 0;
  const withheldTax = calc?.taxDeducted ?? summary?.taxWithheldTotal ?? 0;

  const refundAmount = calc ? calc.taxRefund : (withheldTax > calculatedTax ? withheldTax - calculatedTax : 0);
  const payableAmount = calc ? calc.taxPayable : (calculatedTax > withheldTax ? calculatedTax - withheldTax : 0);
  const isRefund = refundAmount > 0;
  const isDue = payableAmount > 0;

  // Chi tiết 7 bậc thuế lũy tiến
  const bracketDetails = calc?.bracketDetails || [];
  const activeBrackets = bracketDetails.filter((b) => b.taxableAmountInBracket > 0);

  return (
    <div className="space-y-4">
      {/* 1. Main Tax Summary Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
            Tóm tắt số liệu quyết toán
          </h3>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
            Tờ khai 02/QTT
          </span>
        </div>

        {/* Lines */}
        <div className="space-y-2 text-xs">
          {/* Dòng 1: Tổng thu nhập */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Tổng thu nhập chịu thuế:</span>
            <span className="font-bold text-slate-900 font-mono">
              {formatVndMoney(totalIncome)}
            </span>
          </div>

          {/* Dòng 2: Giảm trừ bản thân */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Giảm trừ bản thân (12 tháng):</span>
            <span className="font-bold text-slate-900 font-mono">
              - {formatVndMoney(personalDeduction)}
            </span>
          </div>

          {/* Dòng 3: Giảm trừ NPT */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Giảm trừ người phụ thuộc ({dependents.length} NPT):</span>
            <span className="font-bold text-slate-900 font-mono">
              - {formatVndMoney(dependentDeduction)}
            </span>
          </div>

          {/* Dòng 4: Bảo hiểm bắt buộc */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Bảo hiểm bắt buộc đã trừ:</span>
            <span className="font-bold text-slate-900 font-mono">
              - {formatVndMoney(insuranceDeduction)}
            </span>
          </div>

          {/* Dòng 5: Giảm trừ từ thiện (nếu có) */}
          {charityDeduction > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Đóng góp từ thiện, nhân đạo:</span>
              <span className="font-bold text-slate-900 font-mono">
                - {formatVndMoney(charityDeduction)}
              </span>
            </div>
          )}

          {/* Divider: Thu nhập tính thuế */}
          <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-bold text-xs text-slate-800">
            <span>Thu nhập tính thuế (TNTT):</span>
            <span className="font-mono text-slate-900">
              {formatVndMoney(taxableIncome)}
            </span>
          </div>

          {/* Dòng 6: Thuế TNCN phát sinh theo 7 bậc */}
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <span>Thuế TNCN theo 7 bậc:</span>
              {activeBrackets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBracketsDetail(!showBracketsDetail)}
                  className="text-[#046a4e] hover:underline text-[10px] inline-flex items-center gap-0.5 cursor-pointer ml-1 font-semibold"
                >
                  <Layers className="w-3 h-3" />
                  <span>{showBracketsDetail ? 'Thu gọn' : 'Chi tiết bậc'}</span>
                  {showBracketsDetail ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
              )}
            </span>
            <span className="font-semibold text-slate-800 font-mono">
              {formatVndMoney(calculatedTax)}
            </span>
          </div>

          {/* Bảng chi tiết 7 bậc lũy tiến (nếu bấm mở rộng) */}
          {showBracketsDetail && activeBrackets.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 my-1 space-y-1.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-slate-600 block uppercase">
                Chi tiết thu nhập tính thuế theo từng bậc:
              </span>
              {activeBrackets.map((b) => (
                <div key={b.bracket} className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>
                    Bậc {b.bracket} ({b.rate}%): {formatVndMoney(b.taxableAmountInBracket)}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatVndMoney(b.taxAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Dòng 7: Thuế đã khấu trừ */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Thuế TNCN đã khấu trừ:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {formatVndMoney(withheldTax)}
            </span>
          </div>

          {/* Dòng 8: Box kết quả chênh lệch */}
          <div className={`border-t border-dashed pt-2.5 mt-2 rounded-xl p-2.5 px-3 flex items-center justify-between ${
            isRefund
              ? 'border-emerald-300 bg-emerald-50/40 text-[#046a4e]'
              : isDue
              ? 'border-rose-300 bg-rose-50/40 text-rose-700'
              : 'border-slate-300 bg-slate-50 text-slate-700'
          }`}>
            <div>
              <span className="text-[11px] font-bold uppercase block">
                {isRefund
                  ? 'SỐ THUẾ ĐƯỢC HOÀN:'
                  : isDue
                  ? 'SỐ THUẾ PHẢI NỘP THÊM:'
                  : 'CÂN BẰNG NGHĨA VỤ THUẾ:'}
              </span>
              <span className="text-[10px] text-slate-500">
                {isRefund
                  ? 'Kho Bạc Nhà Nước hoàn trả'
                  : isDue
                  ? 'Nộp vào Ngân sách Nhà Nước'
                  : 'Không phát sinh chênh lệch'}
              </span>
            </div>
            <div className="text-lg font-extrabold font-mono">
              {isRefund
                ? `+${formatVndMoney(refundAmount)}`
                : isDue
                ? `-${formatVndMoney(payableAmount)}`
                : '0 đ'}
            </div>
          </div>
        </div>

        {/* Progressive Tax Bracket Progress */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 text-[11px]">Bậc thuế cao nhất:</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
              {calc?.appliedBracket ? `Bậc ${calc.appliedBracket}` : taxableIncome > 0 ? 'Lũy tiến 7 bậc' : '0% (Chưa phát sinh)'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#046a4e] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, ((calc?.appliedBracket || 1) / 7) * 100))}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Áp dụng theo Luật Thuế TNCN số 04/2007/QH12 &amp; Thông tư 111/2013/TT-BTC
          </p>
        </div>
      </div>

      {/* 2. Legal Safety Guarantee Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1.5 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Đảm bảo an toàn pháp lý</span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          ThuTra áp dụng 15 quy tắc kiểm tra theo đúng chuẩn kê khai ngành thuế. Hồ sơ tải về đáp ứng đầy đủ Thông tư 80/2021/TT-BTC để nộp trực tuyến mà không cần đến trực tiếp cơ quan thuế.
        </p>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Hỗ trợ đối soát chứng từ:</span>
          <span className="text-slate-800 font-bold">24/7 Miễn phí</span>
        </div>
      </div>
    </div>
  );
};
