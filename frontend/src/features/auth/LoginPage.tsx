import { useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { setAuthCredentials, setAuthMode } from "./authSlice";
import { useLoginMutation, useRegisterMutation, useGuestLoginMutation } from "./authApi";
import { toast } from "react-hot-toast";
import type { RootState } from "../../store";

export function AngkorWatEmblem({ className = "h-14 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="angkorGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="40%" stopColor="#E5C058" />
          <stop offset="80%" stopColor="#B38714" />
          <stop offset="100%" stopColor="#7E5C05" />
        </linearGradient>
      </defs>
      {/* 5 Towers Silhouette with tiers */}
      {/* Center Tower (Tallest) */}
      <path d="M60 4 L64 16 L65 30 L67 48 L53 48 L55 30 L56 16 Z" fill="url(#angkorGold)" />
      <path d="M59 1 L61 1 L61 4 L59 4 Z" fill="#FFF2B2" />
      {/* Mid Left Tower */}
      <path d="M44 14 L47 24 L48 34 L50 48 L38 48 L40 34 L41 24 Z" fill="url(#angkorGold)" />
      {/* Mid Right Tower */}
      <path d="M76 14 L79 24 L80 34 L82 48 L70 48 L72 34 L73 24 Z" fill="url(#angkorGold)" />
      {/* Outer Left Tower */}
      <path d="M28 24 L31 32 L32 40 L34 48 L22 48 L24 40 L25 32 Z" fill="url(#angkorGold)" />
      {/* Outer Right Tower */}
      <path d="M92 24 L95 32 L96 40 L98 48 L86 48 L88 40 L89 32 Z" fill="url(#angkorGold)" />
      {/* Base tiered gallery & colonnade */}
      <rect x="14" y="48" width="92" height="6" rx="1.5" fill="url(#angkorGold)" />
      <rect x="8" y="54" width="104" height="6" rx="2" fill="url(#angkorGold)" />
      <rect x="4" y="60" width="112" height="5" rx="1" fill="url(#angkorGold)" />
      {/* Lotus finials on tower tips */}
      <circle cx="60" cy="5" r="1.8" fill="#FFF8D6" />
      <circle cx="44" cy="15" r="1.5" fill="#FFF8D6" />
      <circle cx="76" cy="15" r="1.5" fill="#FFF8D6" />
      <circle cx="28" cy="25" r="1.2" fill="#FFF8D6" />
      <circle cx="92" cy="25" r="1.2" fill="#FFF8D6" />
    </svg>
  );
}

export function GoldenLotusIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="lotusG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#C59B28" />
        </linearGradient>
      </defs>
      {/* Center petal */}
      <path d="M25 4 C27 12 31 20 25 32 C19 20 23 12 25 4 Z" fill="url(#lotusG)" />
      {/* Left petals */}
      <path d="M22 10 C16 16 12 24 23 33 C14 30 11 20 22 10 Z" fill="url(#lotusG)" opacity="0.9" />
      <path d="M16 18 C10 24 8 30 20 34 C10 32 7 24 16 18 Z" fill="url(#lotusG)" opacity="0.75" />
      {/* Right petals */}
      <path d="M28 10 C34 16 38 24 27 33 C36 30 39 20 28 10 Z" fill="url(#lotusG)" opacity="0.9" />
      <path d="M34 18 C40 24 42 30 30 34 C40 32 43 24 34 18 Z" fill="url(#lotusG)" opacity="0.75" />
      {/* Base water line */}
      <path d="M12 35 Q25 38 38 35" stroke="url(#lotusG)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const I18N = {
  en: {
    brand: "SASTRA AI",
    tagline: "Cambodia's Sovereign AI Assistant",
    subtitle: "Bridging ancient wisdom with next-generation intelligence.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    createAccount: "Create Account",
    processing: "Processing...",
    or: "OR",
    googleSignIn: "Sign in with Google",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    alreadyHaveAccount: "Already have an account?",
    signInLink: "Sign in",
    wisdomQuote: "«ចំណេះដឹងគឺជាអំណាច»",
    wisdomSub: "Knowledge is Power",
    copyright: "© 2026 Sastra AI. All rights reserved.",
    publicWebsite: "Public Website",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contactUs: "Contact Us",
    errName: "Please enter your full name",
    errPassLen: "Password must be at least 6 characters",
    errPassMatch: "Passwords do not match",
    errEmailPass: "Please enter your email and password",
    forgotToast: "Password reset instructions will be sent to your registered email.",
  },
  km: {
    brand: "SASTRA AI (សាស្ត្រា)",
    tagline: "ជំនួយការបញ្ញាសិប្បនិម្មិតកម្ពុជា",
    subtitle: "ផ្សារភ្ជាប់បញ្ញាបុរាណ ជាមួយបច្ចេកវិទ្យាបញ្ញាសិប្បនិម្មិតជំនាន់ថ្មី។",
    fullName: "ឈ្មោះពេញ",
    fullNamePlaceholder: "បញ្ចូលឈ្មោះពេញរបស់អ្នក",
    email: "អាសយដ្ឋានអ៊ីមែល",
    emailPlaceholder: "បញ្ចូលអ៊ីមែលរបស់អ្នក",
    password: "ពាក្យសម្ងាត់",
    passwordPlaceholder: "បញ្ចូលពាក្យសម្ងាត់",
    confirmPassword: "ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់",
    confirmPasswordPlaceholder: "បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត",
    rememberMe: "ចងចាំខ្ញុំ",
    forgotPassword: "ភ្លេចពាក្យសម្ងាត់?",
    signIn: "ចូលប្រើប្រាស់",
    createAccount: "បង្កើតគណនីថ្មី",
    processing: "កំពុងដំណើរការ...",
    or: "ឬ",
    googleSignIn: "ចូលតាមរយៈ Google",
    noAccount: "មិនទាន់មានគណនីមែនទេ?",
    createOne: "បង្កើតគណនីថ្មី",
    alreadyHaveAccount: "មានគណនីរួចហើយ?",
    signInLink: "ចូលគណនី",
    wisdomQuote: "«ចំណេះដឹងគឺជាអំណាច»",
    wisdomSub: "ចំណេះវិជ្ជាបង្កើតអនាគត",
    copyright: "© ២០២៦ សាស្ត្រា អាយ។ រក្សាសិទ្ធិគ្រប់យ៉ាង។",
    publicWebsite: "គេហទំព័រផ្លូវការ",
    privacyPolicy: "គោលការណ៍ឯកជនភាព",
    termsOfService: "លក្ខខណ្ឌប្រើប្រាស់",
    contactUs: "ទំនាក់ទំនង",
    errName: "សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក",
    errPassLen: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ",
    errPassMatch: "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ",
    errEmailPass: "សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក",
    forgotToast: "សេចក្តីណែនាំដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញនឹងត្រូវផ្ញើទៅអ៊ីមែលរបស់អ្នក។",
  },
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const { authMode } = useSelector((s: RootState) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [language, setLanguage] = useState<"en" | "km">(() => {
    return (localStorage.getItem("sastra_lang") as "en" | "km") || "km";
  });

  const t = I18N[language];

  const handleToggleLanguage = (lang: "en" | "km") => {
    setLanguage(lang);
    localStorage.setItem("sastra_lang", lang);
    toast.success(lang === "km" ? "បានប្តូរទៅភាសាខ្មែរ" : "Switched to English");
  };

  const [loginApi, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerApi, { isLoading: isRegistering }] = useRegisterMutation();
  const [guestApi, { isLoading: isGuestLoggingIn }] = useGuestLoginMutation();

  const isLoading = isLoggingIn || isRegistering || isGuestLoggingIn;

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
            ? `គណនីត្រូវបានបង្កើត! សូមស្វាគមន៍ ${res.user.name}`
            : `Account created! Welcome, ${res.user.name}`
        );
      } catch (err: any) {
        toast.error(err?.data?.detail || (language === "km" ? "ការចុះឈ្មោះបរាជ័យ អ៊ីមែលប្រហែលជាត្រូវបានប្រើប្រាស់រួចហើយ។" : "Registration failed. Email may already be in use."));
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
        toast.error(err?.data?.detail || (language === "km" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ" : "Invalid email or password"));
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#080604] text-stone-200 font-sans selection:bg-gold/30 selection:text-gold p-3 sm:p-6 lg:p-8 select-none relative overflow-x-hidden">
      {/* Master Outer Container Card */}
      <div className="relative mx-auto w-full max-w-6xl flex-1 flex flex-col justify-center my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-[28px] border-2 border-[#4A381C] bg-[#0E0C09] shadow-2xl shadow-black overflow-hidden relative">
          {/* Authentic Khmer Corner Filigree Decor (Asset 1) */}
          <img
            src="/images/khmer-assets/khmer-corner-1.png"
            alt="Khmer Corner Decor"
            className="absolute top-0 left-0 h-12 w-12 object-contain pointer-events-none z-20 opacity-85 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          <img
            src="/images/khmer-assets/khmer-corner-1.png"
            alt="Khmer Corner Decor"
            className="absolute top-0 right-0 h-12 w-12 object-contain pointer-events-none z-20 opacity-85 -scale-x-100 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          <img
            src="/images/khmer-assets/khmer-corner-1.png"
            alt="Khmer Corner Decor"
            className="absolute bottom-0 left-0 h-12 w-12 object-contain pointer-events-none z-20 opacity-85 -scale-y-100 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          <img
            src="/images/khmer-assets/khmer-corner-1.png"
            alt="Khmer Corner Decor"
            className="absolute bottom-0 right-0 h-12 w-12 object-contain pointer-events-none z-20 opacity-85 -scale-x-100 -scale-y-100 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          
          {/* ================= LEFT COLUMN: FORM ================= */}
          <div className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 z-10 bg-[#0E0C09] overflow-hidden">
            {/* Header / Brand */}
            <div className="text-center space-y-3 pt-2 relative z-10">
              {/* Grand Golden Angkor Wat Monument Silhouette (Asset 6) */}
              <div className="flex justify-center">
                <img
                  src="/images/khmer-assets/khmer-angkor-monument-6.png"
                  alt="Angkor Wat Monument"
                  className="h-14 sm:h-18 w-auto object-contain drop-shadow-[0_6px_20px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal font-heading text-transparent bg-clip-text bg-gradient-to-b from-[#FFF0C2] via-[#E5C058] to-[#B88E1B]">
                  {t.brand}
                </h1>

                {/* Khmer Royal Lotus Crest Divider (Asset 2) */}
                <div className="flex justify-center py-1">
                  <img
                    src="/images/khmer-assets/khmer-crest-lotus-2.png"
                    alt="Khmer Lotus Crest"
                    className="h-5 sm:h-6 w-auto object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]"
                  />
                </div>

                <p className="text-xs sm:text-sm font-semibold text-stone-300 pt-1 font-heading">
                  {t.tagline}
                </p>
                <p className="text-[11.5px] text-stone-400 font-sans">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-6 relative z-10">
              {authMode === "signup" && (
                <div className="space-y-1.5 text-left">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                    <User className="h-3.5 w-3.5 text-gold/80" />
                    <span>{t.fullName}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full rounded-xl border border-[#3C301D] bg-[#14100C] py-2.5 px-3.5 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                  <Mail className="h-3.5 w-3.5 text-gold/80" />
                  <span>{t.email}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full rounded-xl border border-[#3C301D] bg-[#14100C] py-2.5 px-3.5 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                  <Lock className="h-3.5 w-3.5 text-gold/80" />
                  <span>{t.password}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full rounded-xl border border-[#3C301D] bg-[#14100C] py-2.5 pl-3.5 pr-10 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <div className="space-y-1.5 text-left">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                    <Lock className="h-3.5 w-3.5 text-gold/80" />
                    <span>{t.confirmPassword}</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full rounded-xl border border-[#3C301D] bg-[#14100C] py-2.5 px-3.5 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
                  />
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              {authMode === "signin" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-stone-400 cursor-pointer hover:text-stone-200">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#3C301D] bg-[#14100C] text-gold focus:ring-gold"
                    />
                    <span>{t.rememberMe}</span>
                  </label>

                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      toast(t.forgotToast, { icon: "🔑" });
                    }}
                    className="text-gold hover:underline font-semibold"
                  >
                    {t.forgotPassword}
                  </a>
                </div>
              )}

              {/* Primary Sign In / Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E5C058] via-[#D4AF37] to-[#B38714] py-3 text-xs sm:text-sm font-bold text-black shadow-lg shadow-gold/20 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                <AngkorWatEmblem className="h-4 w-6 -mr-0.5" />
                <span>
                  {isLoading
                    ? t.processing
                    : authMode === "signin"
                      ? t.signIn
                      : t.createAccount}
                </span>
              </button>
            </form>

            {/* OR Divider with Diamond Filigree */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#3C301D] to-gold/40" />
              <span className="text-[11px] font-semibold text-gold/70 flex items-center gap-1.5 font-mono">
                <span>◇</span>
                <span>{t.or}</span>
                <span>◇</span>
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#3C301D] to-gold/40" />
            </div>

            {/* Google / Guest Access Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#3C301D] bg-[#14100C] py-2.5 text-xs font-semibold text-stone-200 hover:border-gold/50 hover:bg-[#1A140F] transition-all cursor-pointer shadow-sm"
              >
                {/* Google Multi-Color G Icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{t.googleSignIn}</span>
              </button>
            </div>

            {/* Toggle Switch */}
            <div className="pt-5 text-center text-xs text-stone-400">
              {authMode === "signin" ? (
                <p>
                  {t.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => dispatch(setAuthMode("signup"))}
                    className="text-gold font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.createOne}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              ) : (
                <p>
                  {t.alreadyHaveAccount}{" "}
                  <button
                    type="button"
                    onClick={() => dispatch(setAuthMode("signin"))}
                    className="text-gold font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.signInLink}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ANGKOR SUNSET HERO ================= */}
          <div className="relative min-h-[380px] lg:min-h-full bg-stone-900 overflow-hidden flex flex-col justify-between p-6 sm:p-8">
            {/* Background Cinematic Artwork Image */}
            <img
              src="/images/angkor-bayon-full-bg.png"
              alt="Angkor Wat Sunset Sanctuary"
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            {/* Warm Sunset Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C09] via-transparent to-black/30 pointer-events-none" />

            {/* Top Right: Multi-Language Selector Switcher */}
            <div className="relative z-10 flex justify-end">
              <div className="inline-flex items-center rounded-full border border-gold/40 bg-black/75 p-1 backdrop-blur-md shadow-xl shadow-black/80">
                <button
                  type="button"
                  onClick={() => handleToggleLanguage("km")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    language === "km"
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-md font-bold"
                      : "text-stone-300 hover:text-gold"
                  }`}
                >
                  <span className="text-sm">🇰🇭</span>
                  <span>ភាសាខ្មែរ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLanguage("en")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black shadow-md font-bold"
                      : "text-stone-300 hover:text-gold"
                  }`}
                >
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Bottom Floating Wisdom Card */}
            <div className="relative z-10 rounded-2xl border border-gold/40 bg-black/75 p-4 sm:p-5 backdrop-blur-md shadow-2xl shadow-black max-w-sm ml-auto">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 border border-gold/50 text-gold p-1 overflow-hidden">
                  <img
                    src="/images/khmer-assets/khmer-medallion-lotus-4.png"
                    alt="Khmer Lotus"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="font-khmer text-xs sm:text-sm font-bold text-gold tracking-wide">
                    {t.wisdomQuote}
                  </p>
                  <p className="text-[11px] text-stone-300 font-sans">
                    {t.wisdomSub}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-center text-gold/40 text-[9px] tracking-widest">
                ✦───────✦
              </div>
            </div>
          </div>
        </div>

        {/* Outer Bottom Footer */}
        <div className="pt-6 pb-2 text-center text-xs text-stone-500 space-y-2 relative z-10">
          <p>{t.copyright}</p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-stone-400">
            <a href="http://localhost:5175" className="hover:text-gold transition-colors">{t.publicWebsite}</a>
            <span>•</span>
            <a href="#privacy" onClick={(e) => { e.preventDefault(); toast("Privacy Policy: 100% Zero-Egress On-Premises Protection."); }} className="hover:text-gold transition-colors">{t.privacyPolicy}</a>
            <span>•</span>
            <a href="#terms" onClick={(e) => { e.preventDefault(); toast("Terms of Service: Sovereign AI usage guidelines."); }} className="hover:text-gold transition-colors">{t.termsOfService}</a>
            <span>•</span>
            <a href="#contact" onClick={(e) => { e.preventDefault(); toast("Contact: support@sastra.ai"); }} className="hover:text-gold transition-colors">{t.contactUs}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
