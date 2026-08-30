import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  setAuthCredentials,
  setAuthModalOpen,
  setAuthMode,
} from "./authSlice";
import {
  useLoginMutation,
  useRegisterMutation,
  useGuestLoginMutation,
} from "./authApi";
import {
  KhmerLotusMedallion,
  KbachCorner,
} from "../../components/KhmerOrnaments";
import { toast } from "react-hot-toast";
import type { RootState } from "../../store";
import { cn } from "../../lib/utils";

const MODAL_I18N = {
  km: {
    portalTitle: "ចូលប្រើប្រាស់ SASTRA AI",
    portalSubtitle: "ច្រកទ្វារបញ្ញាសិប្បនិម្មិតកម្ពុជា",
    signIn: "ចូលគណនី",
    createAccount: "បង្កើតគណនី",
    fullName: "ឈ្មោះពេញ",
    fullNamePlaceholder: "ឧ. ពេជ្រ សុខា",
    email: "អាសយដ្ឋានអ៊ីមែល",
    emailPlaceholder: "name@example.com",
    password: "ពាក្យសម្ងាត់",
    confirmPassword: "ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់",
    submitSignIn: "ចូលប្រើប្រាស់ SASTRA AI",
    submitSignUp: "បង្កើតគណនី SASTRA AI",
    processing: "កំពុងដំណើរការ...",
    orInstant: "ឬចូលភ្លាមៗ",
    demoGuestMode: "សាកល្បងចូលជាភ្ញៀវ Demo",
    securityNote: "សុវត្ថិភាពទិន្នន័យត្រូវបានការពារ ១០០% គ្មានការលេចធ្លាយ",
    errName: "សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក",
    errPassLen: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ",
    errPassMatch: "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ",
    errEmailPass: "សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក",
  },
  en: {
    portalTitle: "Access SASTRA AI",
    portalSubtitle: "Cambodia's Sovereign Intelligence Portal",
    signIn: "Sign In",
    createAccount: "Create Account",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Sokha Pich",
    email: "Email Address",
    emailPlaceholder: "name@example.com",
    password: "Password",
    confirmPassword: "Confirm Password",
    submitSignIn: "Sign In to Sastra AI",
    submitSignUp: "Create Sastra AI Account",
    processing: "Processing...",
    orInstant: "or instant access",
    demoGuestMode: "1-Click Demo Guest Mode",
    securityNote: "End-to-End Ephemeral Encryption & Privacy Protected",
    errName: "Please enter your full name",
    errPassLen: "Password must be at least 6 characters",
    errPassMatch: "Passwords do not match",
    errEmailPass: "Please enter your email and password",
  },
};

export default function AuthModal() {
  const dispatch = useDispatch();
  const { authModalOpen, authMode } = useSelector((s: RootState) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<"en" | "km">(() => {
    return (localStorage.getItem("sastra_lang") as "en" | "km") || "km";
  });

  const t = MODAL_I18N[language];

  const handleToggleLanguage = (lang: "en" | "km") => {
    setLanguage(lang);
    localStorage.setItem("sastra_lang", lang);
    toast.success(lang === "km" ? "បានប្តូរទៅភាសាខ្មែរ" : "Switched to English");
  };

  const [loginApi, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerApi, { isLoading: isRegistering }] = useRegisterMutation();
  const [guestApi, { isLoading: isGuestLoggingIn }] = useGuestLoginMutation();

  const isLoading = isLoggingIn || isRegistering || isGuestLoggingIn;

  if (!authModalOpen) return null;

  const handleClose = () => {
    dispatch(setAuthModalOpen(false));
  };

  const handleGuestLogin = async () => {
    try {
      const res = await guestApi().unwrap();
      dispatch(
        setAuthCredentials({
          user: res.user,
          token: res.access_token,
          isGuest: true,
        }),
      );
      toast.success(
        language === "km"
          ? `សូមស្វាគមន៍មកកាន់ សាស្ត្រា អាយ, ${res.user.name}!`
          : `Welcome to Sastra AI, ${res.user.name}!`
      );
    } catch (err: any) {
      toast.error(err?.data?.detail || (language === "km" ? "ការចូលបរាជ័យ សូមព្យាយាមម្តងទៀត។" : "Guest login failed. Please try again."));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (authMode === "signup") {
      if (!name.trim()) {
        toast.error(t.errName);
        return;
      }
      if (password.length < 6) {
        toast.error(t.errPassLen);
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t.errPassMatch);
        return;
      }

      try {
        const res = await registerApi({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }).unwrap();

        dispatch(
          setAuthCredentials({
            user: res.user,
            token: res.access_token,
          }),
        );
        toast.success(
          language === "km"
            ? `គណនីត្រូវបានបង្កើត! សូមស្វាគមន៍ ${res.user.name}!`
            : `Account created! Welcome, ${res.user.name}!`
        );
      } catch (err: any) {
        toast.error(err?.data?.detail || (language === "km" ? "ការចុះឈ្មោះបរាជ័យ" : "Registration failed."));
      }
    } else {
      if (!email.trim() || !password) {
        toast.error(t.errEmailPass);
        return;
      }

      try {
        const res = await loginApi({
          email: email.trim().toLowerCase(),
          password,
        }).unwrap();

        dispatch(
          setAuthCredentials({
            user: res.user,
            token: res.access_token,
          }),
        );
        toast.success(
          language === "km"
            ? `សូមស្វាគមន៍ត្រឡប់មកវិញ ${res.user.name}!`
            : `Welcome back, ${res.user.name}!`
        );
      } catch (err: any) {
        toast.error(err?.data?.detail || (language === "km" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ" : "Invalid email or password."));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Main Modal Card */}
      <div className="relative z-10 flex w-full max-w-md flex-col rounded-3xl border border-[#4A3820] bg-[#120F0B]/98 shadow-2xl shadow-black/95 backdrop-blur-2xl overflow-hidden">
        {/* Ornate Corner Elements */}
        <div className="absolute top-2 left-2 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>
        <div className="absolute top-2 right-2 rotate-90 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>

        {/* ── Modal Header with Crest ── */}
        <div className="relative flex flex-col items-center border-b border-[#2C2114] p-5 pb-4 bg-gradient-to-b from-[#18130B] to-[#120E09] text-center">
          {/* Top Row: Language Toggle & Close */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full border border-gold/30 bg-black/60 p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleToggleLanguage("km")}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                language === "km"
                  ? "bg-gold text-black shadow-xs"
                  : "text-stone-400 hover:text-gold"
              }`}
            >
              🇰🇭 ខ្មែរ
            </button>
            <button
              type="button"
              onClick={() => handleToggleLanguage("en")}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                language === "en"
                  ? "bg-gold text-black shadow-xs"
                  : "text-stone-400 hover:text-gold"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#16120C] text-stone-400 hover:text-gold hover:border-gold/60 transition-all cursor-pointer"
            aria-label="Close auth modal"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Sastra Crest */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] via-[#1C150B] to-[#100C07] border border-gold/50 text-gold shadow-lg shadow-black/60 p-2 mb-2 mt-2">
            <KhmerLotusMedallion className="h-full w-full drop-shadow" />
          </div>

          <h2 className="font-khmer text-lg font-bold text-[#E5C058] tracking-tight flex items-center gap-1.5">
            <span>{t.portalTitle}</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            {t.portalSubtitle}
          </p>
        </div>

        {/* ── Tabs: Sign In / Create Account ── */}
        <div className="flex border-b border-[#2C2114] bg-[#15110B] p-1">
          <button
            type="button"
            onClick={() => dispatch(setAuthMode("signin"))}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              authMode === "signin"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs font-bold"
                : "text-stone-400 hover:text-stone-200",
            )}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{t.signIn}</span>
          </button>
          <button
            type="button"
            onClick={() => dispatch(setAuthMode("signup"))}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              authMode === "signup"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs font-bold"
                : "text-stone-400 hover:text-stone-200",
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t.createAccount}</span>
          </button>
        </div>

        {/* ── Auth Form ── */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {authMode === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
                {t.fullName}
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  required
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
              {t.email}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
              {t.password}
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 h-4 w-4 text-stone-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] pl-9 pr-9 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 uppercase tracking-wider mb-1">
                {t.confirmPassword}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[#3C301D] bg-[#0A0805] pl-9 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5D77F] via-[#D4AF37] to-[#996515] py-2.5 text-xs font-bold text-black shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>{t.processing}</span>
            ) : (
              <>
                <span>
                  {authMode === "signin"
                    ? t.submitSignIn
                    : t.submitSignUp}
                </span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#2C2114] w-full" />
            <span className="bg-[#120F0B] px-3 text-[10.5px] font-mono uppercase text-stone-400 absolute">
              {t.orInstant}
            </span>
          </div>

          {/* 1-Click Guest Login */}
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#423420] bg-[#1C160F] py-2 text-xs font-semibold text-gold hover:border-gold/60 hover:bg-[#251D12] transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>{t.demoGuestMode}</span>
          </button>

          {/* Security Note */}
          <p className="text-center text-[10.5px] text-stone-400 font-sans flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t.securityNote}</span>
          </p>
        </form>
      </div>
    </div>
  );
}
