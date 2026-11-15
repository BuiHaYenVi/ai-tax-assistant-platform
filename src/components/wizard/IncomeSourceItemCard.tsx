import React from 'react';
import { 
  Building2, 
  Trash2, 
  Pencil, 
  ShieldCheck, 
  Sparkles,
  FileText,
  Briefcase
} from 'lucide-react';
import type { IncomeSourceDto } from '../../types/business.types';

interface IncomeSourceItemCardProps {
  source: IncomeSourceDto;
  onEdit: (source: IncomeSourceDto) => void;
  onDelete: (id: string, name: string) => void;
  onViewScan?: (source: IncomeSourceDto) => void;
}

export const IncomeSourceItemCard: React.FC<IncomeSourceItemCardProps> = ({
  source,
  onEdit,
  onDelete,
  onViewScan
}) => {
  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const isLabor = source.category === 'salary_contract';
  const isFreelance = source.category === 'freelance_10pct';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all">
      {/* 1. Header: Tên đơn vị chi trả, Phân loại & Nút thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
            isLabor 
              ? 'bg-blue-50 border-blue-200/80 text-blue-700' 
              : 'bg-purple-50 border-purple-200/80 text-purple-700'
          }`}>
            {isLabor ? <Building2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {source.payerName}
              </h3>

              {/* Category Badge */}
              {isLabor ? (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  HĐLĐ Lũy tiến
                </span>
              ) : isFreelance ? (
                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Vãng lai khấu trừ 10%
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Nguồn thu nhập khác
                </span>
              )}

              {/* Personal Deduction Tag if applied */}
              {source.applyPersonalDeduction && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Giảm trừ bản thân</span>
                </span>
              )}

              {/* Digital Cert Badge */}
              {(source.isECertificateVerified || source.eCertificateCode) && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Đã ký số TT78</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              MST: {source.payerMst || 'Chưa cung cấp'}
              {source.taxAuthorityName && ` • ${source.taxAuthorityName}`}
              {source.workingMonthsCount ? ` • Thời gian làm việc: ${source.workingMonthsCount} tháng` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons: Sửa & Xóa */}
        <div className="flex items-center gap-2 self-end sm:self-start">
          {onViewScan && (
            <button
              type="button"
              onClick={() => onViewScan(source)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-[#046a4e] hover:bg-emerald-50/50 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Xem chứng từ đính kèm"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Chứng từ</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(source)}
            className="px-2.5 py-1 text-xs text-slate-600 hover:text-[#046a4e] hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors"
            title="Chỉnh sửa thông tin nguồn thu nhập"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-400" />
            <span>Sửa</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(source.id, source.payerName)}
            title="Xóa nguồn thu nhập này"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Body: Số liệu tài chính bóc tách */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Tổng thu nhập chịu thuế */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            Tổng thu nhập chịu thuế:
          </span>
          <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
            {formatCurrency(source.totalTaxableIncome || source.totalIncomeGross)} <span className="text-xs font-semibold text-slate-500">VNĐ</span>
          </div>
        </div>

        {/* Thuế TNCN đã khấu trừ */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
            Thuế TNCN đã khấu trừ tại nguồn:
          </span>
          <div className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono">
            {formatCurrency(source.taxWithheld)} <span className="text-xs font-semibold text-emerald-700">VNĐ</span>
          </div>
        </div>

        {/* Bảo hiểm bắt buộc trừ lương (nếu có) hoặc Tỷ lệ khấu trừ */}
        {isLabor ? (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              BHXH, BHYT, BHTN đã đóng:
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-700 font-mono">
              {formatCurrency(source.insuranceDeduction || 0)} <span className="text-xs font-semibold text-slate-500">VNĐ</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              Tỷ lệ khấu trừ áp dụng:
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-700 font-mono">
              {source.withholdingRate || 10}% <span className="text-xs font-medium text-slate-500">(Theo Thông tư 111/2013)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
