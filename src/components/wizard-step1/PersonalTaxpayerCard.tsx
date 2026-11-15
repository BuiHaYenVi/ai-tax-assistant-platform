import React from 'react';
import { User, ShieldCheck, Lock } from 'lucide-react';
import type { PersonalTaxpayer } from '../../data/mockWizardStep1';

interface PersonalTaxpayerCardProps {
  taxpayer: PersonalTaxpayer;
  onChangeTaxpayer?: (field: keyof PersonalTaxpayer, value: string) => void;
}

export const PersonalTaxpayerCard: React.FC<PersonalTaxpayerCardProps> = ({
  taxpayer,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <span>1. Thông tin Người nộp thuế (Bản thân)</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                <Lock className="w-2.5 h-2.5" /> Khóa bảo vệ
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Thông tin được đồng bộ tự động từ VNeID &amp; Hồ sơ tài khoản. Để thay đổi, vui lòng cập nhật tại mục <span className="font-medium text-blue-600">Cài đặt tài khoản</span>.
            </p>
          </div>
        </div>

        <span className="bg-emerald-50 text-[#046a4e] border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đã xác thực CCCD / VNeID</span>
        </span>
      </div>

      {/* 2. Grid Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        {/* Họ và tên */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            value={taxpayer.fullName}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>

        {/* Số CCCD gắn chip */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Số CCCD gắn chip
          </label>
          <input
            type="text"
            value={taxpayer.cccd}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>

        {/* Mã số thuế cá nhân */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">
            Mã số thuế cá nhân
          </label>
          <input
            type="text"
            value={taxpayer.mst}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>

        {/* Số điện thoại liên lạc */}
        <div className="md:col-span-1">
          <label className="block text-slate-600 font-medium mb-1">
            Số điện thoại liên lạc
          </label>
          <input
            type="text"
            value={taxpayer.phone}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>

        {/* Email nhận thông báo CQT */}
        <div className="md:col-span-2">
          <label className="block text-slate-600 font-medium mb-1">
            Email nhận thông báo CQT
          </label>
          <input
            type="email"
            value={taxpayer.email}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>

        {/* Địa chỉ thường trú theo CCCD */}
        <div className="col-span-full">
          <label className="block text-slate-600 font-medium mb-1">
            Địa chỉ thường trú theo CCCD
          </label>
          <input
            type="text"
            value={taxpayer.address}
            readOnly={true}
            disabled={true}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-not-allowed select-none focus:outline-none focus:ring-0 focus:border-slate-200 transition-all"
          />
        </div>
      </div>

      {/* 3. Personal Deduction Notice Box */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 px-3.5 flex items-start gap-2.5 text-xs text-slate-700">
        <ShieldCheck className="w-4 h-4 text-[#046a4e] shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] text-slate-600">
          <strong className="text-slate-900 font-bold">Mức giảm trừ gia cảnh cho bản thân: 11.000.000 VNĐ/tháng (132.000.000 VNĐ/năm)</strong> được tự động áp dụng trọn 12 tháng theo quy định tại Nghị quyết số 954/2020/UBTVQH14 của Ủy ban Thường vụ Quốc hội.
        </p>
      </div>
    </div>
  );
};
