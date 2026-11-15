import React, { useState, useEffect, useId } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiClientError } from '../types/api.types';

export interface RegisterPageProps {
  onRegisterSuccess?: (userData: { fullName: string; email: string; taxCode?: string }) => void;
  onNavigateToLogin?: () => void;
  onOpenGuide?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onOpenGuide
}) => {
  const nameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const agreeTermsInputId = useId();

  // Multi-step Registration: 'info' (Bước 1: Điền thông tin) | 'otp' (Bước 2: Xác thực OTP)
  const [step, setStep] = useState<'info' | 'otp'>('info');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Countdown timer cho OTP (60s)
  const [countdown, setCountdown] = useState(60);

  // UI Interactive states
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { register, sendRegisterOtp } = useAuth();
  const { toast } = useToast();

  // Countdown timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Tính toán độ an toàn mật khẩu
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: 'Chưa nhập', color: 'text-slate-400', barColor: 'bg-slate-200' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd) || (pwd.length >= 10 && /[A-Z]/.test(pwd))) score += 1;

    if (score === 1) {
      return { score: 1, text: 'Yếu', color: 'text-amber-500', barColor: 'bg-amber-400' };
    }
    if (score === 2) {
      return { score: 2, text: 'Trung bình', color: 'text-yellow-500', barColor: 'bg-yellow-400' };
    }
    return { score: 3, text: 'Mạnh', color: 'text-emerald-600', barColor: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  // Xử lý Bước 1: Kiểm tra thông tin & Gửi mã OTP về email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Mật khẩu cần tối thiểu 8 ký tự, bao gồm cả số & chữ.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu đã tạo.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendRegisterOtp(email.trim());
      toast.success(
        'Mã OTP xác thực đã được gửi về email của bạn.',
        `Vui lòng kiểm tra hộp thư ${email.trim()} (hoặc terminal dev) để lấy mã gồm 6 số.`
      );
      setStep('otp');
      setCountdown(60);
      setOtpCode('');
    } catch (err: unknown) {
      const clientErr = ApiClientError.fromError(err);
      if (clientErr.errorCode === 'DUPLICATE_RESOURCE' || clientErr.statusCode === 409) {
        setErrorMessage('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
      } else {
        setErrorMessage(clientErr.message || 'Không thể gửi mã OTP xác thực. Vui lòng thử lại.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Xử lý gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isSendingOtp) return;
    setErrorMessage(null);
    setIsSendingOtp(true);
    try {
      await sendRegisterOtp(email.trim());
      toast.success(
        'Đã gửi lại mã OTP thành công!',
        `Mã OTP mới đã được chuyển tới ${email.trim()}.`
      );
      setCountdown(60);
      setOtpCode('');
    } catch (err: unknown) {
      const clientErr = ApiClientError.fromError(err);
      setErrorMessage(clientErr.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Xử lý Bước 2: Xác nhận OTP & Hoàn tất đăng ký tài khoản
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otpCode.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đúng mã OTP gồm 6 chữ số đã được gửi qua email.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        otpCode: cleanOtp,
      });

      // Lưu email vừa đăng ký vào localStorage để tự động điền ở màn hình Đăng nhập
      try {
        localStorage.setItem('thutra_registered_email', email.trim());
      } catch {}

      toast.success(
        'Đăng ký tài khoản thành công!',
        'Vui lòng đăng nhập để bắt đầu sử dụng không gian làm việc.'
      );

      if (onRegisterSuccess) {
        onRegisterSuccess({
          fullName: fullName.trim(),
          email: email.trim(),
        });
      } else if (onNavigateToLogin) {
        onNavigateToLogin();
      }
    } catch (err: unknown) {
      const clientErr = ApiClientError.fromError(err);
      setErrorMessage(clientErr.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between antialiased selection:bg-emerald-100 selection:text-emerald-900 font-sans text-slate-800">
      {/* ========================================================= */}
      {/* A. TOP HEADER BAR                                         */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-2xs shrink-0">
            <Calculator className="w-5 h-5 text-emerald-50" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900 text-[17px] tracking-tight">
              ThuTra TNCN
            </span>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-full border border-slate-200 select-none">
              SaaS v2.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setShowGuideModal(true);
              if (onOpenGuide) onOpenGuide();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-slate-100"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Hướng dẫn eTax</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToLogin}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Đăng nhập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER: Canh giữa toàn màn hình trang nhã           */}
      {/* ========================================================= */}
      <main className="flex-1 min-h-[calc(100vh-65px)] flex flex-col items-center justify-center py-10 px-4 bg-slate-50">
        <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Top Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Bảo mật chuẩn xác thực 2 lớp qua Email</span>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'info' ? 'w-8 bg-[#046a4e]' : 'w-4 bg-emerald-200'}`}></span>
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'otp' ? 'w-8 bg-[#046a4e]' : 'w-4 bg-slate-200'}`}></span>
          </div>

          {/* ========================================================= */}
          {/* BƯỚC 1: ĐIỀN THÔNG TIN TÀI KHOẢN (step === 'info')         */}
          {/* ========================================================= */}
          {step === 'info' && (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-left tracking-tight">
                Tạo tài khoản ThuTra
              </h1>
              <p className="text-xs text-slate-500 text-left mt-1 mb-6 leading-relaxed">
                Bước 1: Nhập thông tin để nhận mã xác thực OTP qua email
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {/* Họ và tên */}
                <div>
                  <label htmlFor={nameInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={nameInputId}
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Ví dụ: Nguyễn Hoàng Nam"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor={emailInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={emailInputId}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="vi-du@thutra.vn"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mã xác thực OTP sẽ được gửi về địa chỉ email này.
                  </p>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label htmlFor={passwordInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id={passwordInputId}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Tối thiểu 8 ký tự, gồm số & chữ"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 flex-1 max-w-[200px] mr-3">
                      <span className="text-slate-500 text-[11px] whitespace-nowrap">Độ an toàn:</span>
                      <div className="flex items-center gap-1 w-full">
                        <div className={`h-1.5 rounded-full flex-1 transition-all ${strength.score >= 1 ? strength.barColor : 'bg-slate-200'}`} />
                        <div className={`h-1.5 rounded-full flex-1 transition-all ${strength.score >= 2 ? strength.barColor : 'bg-slate-200'}`} />
                        <div className={`h-1.5 rounded-full flex-1 transition-all ${strength.score >= 3 ? strength.barColor : 'bg-slate-200'}`} />
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium ${strength.color}`}>
                      {strength.text}
                    </span>
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label htmlFor={confirmPasswordInputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id={confirmPasswordInputId}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Nhập lại mật khẩu vừa tạo"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Điều khoản dịch vụ checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      id={agreeTermsInputId}
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                    <span className="text-xs text-slate-600 leading-tight">
                      Tôi đồng ý với{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-emerald-700 font-medium hover:underline cursor-pointer"
                      >
                        Điều khoản dịch vụ
                      </button>{' '}
                      và{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-emerald-700 font-medium hover:underline cursor-pointer"
                      >
                        Chính sách bảo mật
                      </button>{' '}
                      của ThuTra.
                    </span>
                  </label>
                </div>

                {/* CTA Button: Nhận mã OTP */}
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full bg-[#046a4e] hover:bg-[#03543e] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-150 cursor-pointer text-xs sm:text-sm group disabled:opacity-75 disabled:cursor-wait mt-2"
                >
                  {isSendingOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Đang gửi mã OTP xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục nhận mã OTP</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 2: XÁC THỰC MÃ OTP EMAIL (step === 'otp')             */}
          {/* ========================================================= */}
          {step === 'otp' && (
            <>
              <div className="text-left mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#046a4e] flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Xác thực mã OTP
                </h1>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Mã xác thực 6 chữ số đã được gửi tới địa chỉ email:
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('info');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Thay đổi
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                    Nhập mã 6 chữ số <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="123456"
                    className="w-full text-center text-3xl font-mono tracking-[0.4em] font-bold py-3.5 px-4 bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl text-emerald-950 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Mã có hiệu lực trong 5 phút. Vui lòng kiểm tra hộp thư đến hoặc thư rác.
                  </p>
                </div>

                {/* Đếm ngược & Nút gửi lại */}
                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <span className="text-xs text-slate-500 font-medium">
                      Gửi lại mã sau: <strong className="text-emerald-700 font-mono font-bold">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="text-xs font-bold text-[#046a4e] hover:text-[#03543e] hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>{isSendingOtp ? 'Đang gửi lại mã...' : 'Gửi lại mã OTP mới'}</span>
                    </button>
                  )}
                </div>

                {/* Nút Xác nhận & Hoàn tất */}
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full bg-[#046a4e] hover:bg-[#03543e] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-150 cursor-pointer text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực & tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Xác nhận & Hoàn tất đăng ký</span>
                    </>
                  )}
                </button>

                {/* Nút quay lại Bước 1 */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('info');
                    setErrorMessage(null);
                  }}
                  className="w-full text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại chỉnh sửa thông tin</span>
                </button>
              </form>
            </>
          )}

          {/* Chuyển hướng Đăng nhập */}
          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Đã có tài khoản ThuTra?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[#046a4e] hover:text-[#03543e] font-bold hover:underline cursor-pointer"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>

        {/* Local Encryption Pill */}
        <div className="w-full max-w-[480px] mt-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[11.5px] text-slate-600">Dữ liệu được mã hóa cục bộ khi đối soát hóa đơn</span>
          </div>
          <span className="bg-slate-100 text-slate-700 font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded border border-slate-200 select-none">
            SHA-256
          </span>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 py-4 flex flex-col items-center justify-center text-center">
        <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed mb-2">
          Lưu ý: ThuTra là công cụ hỗ trợ tính toán và kiểm tra lỗi độc lập. Dữ liệu thuế do người dùng tự nhập và tự chịu trách nhiệm khi nộp lên cơ quan thuế.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-500">
          <span>© 2024 ThuTra TNCN. Bản quyền đã được bảo lưu.</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-3 text-slate-600">
            <button 
              type="button" 
              onClick={() => toast.info('Chính sách bảo mật: Toàn bộ dữ liệu được lưu trữ an toàn.')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Chính sách bảo mật
            </button>
            <span className="text-slate-300">•</span>
            <button 
              type="button" 
              onClick={() => toast.info('Điều khoản dịch vụ: ThuTra cam kết bảo vệ quyền riêng tư người dùng.')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Điều khoản dịch vụ
            </button>
            <span className="text-slate-300">•</span>
            <button 
              type="button" 
              onClick={() => toast.info('Hotline hỗ trợ kỹ thuật: 1900 6868 hoặc email support@thutra.vn')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Hỗ trợ kỹ thuật
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: Hướng dẫn eTax */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3 text-emerald-700">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Hướng dẫn Đăng ký & Kê khai eTax</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-800 mb-1">1. Đăng ký tài khoản ThuTra</p>
                <p>Nhập họ tên và địa chỉ email chính chủ. Hệ thống sẽ gửi mã OTP 6 số để kích hoạt tài khoản an toàn.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-800 mb-1">2. Mã hóa dữ liệu SHA-256</p>
                <p>Chứng từ điện tử XML được phân tích trực tiếp tại trình duyệt mà không yêu cầu lưu trữ mật khẩu eTax cấp cao.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="bg-[#046a4e] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#03543e] cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Điều khoản dịch vụ & Chính sách bảo mật */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3 text-emerald-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Điều khoản & Bảo mật ThuTra</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                ThuTra cung cấp giải pháp hỗ trợ tính toán thuế độc lập, đối soát chứng từ khấu trừ thuế điện tử và kết xuất hồ sơ theo định dạng chuẩn XML của Tổng cục Thuế.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>Bảo mật tuyệt đối thông tin thu nhập cá nhân.</li>
                <li>Không bán hoặc cung cấp dữ liệu cho bất kỳ đơn vị quảng cáo nào.</li>
                <li>Hỗ trợ người dùng xuất tờ khai nháp 02/QTT hợp lệ.</li>
              </ul>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Đồng ý & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
