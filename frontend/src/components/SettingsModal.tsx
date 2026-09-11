import { memo, useState, useEffect, useRef } from "react";
import { API_BASE } from "../config/api";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  Sparkles,
  Cpu,
  Cloud,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Trash2,
  Zap,
  User as UserIcon,
  LogOut,
  LogIn,
  Volume2,
  Calendar,
  Key,
  BadgeCheck,
  Camera,
  Upload,
  Check,
  Edit3,
  Palette,
  Play,
  Square,
  Type,
  Languages,
} from "lucide-react";
import { selectModel } from "../features/provider/providerSlice";
import { resetChat, setResponseLanguage } from "../features/chat/chatSlice";
import { SUPPORTED_LANGUAGES } from "./LanguageDropdown";
import { clearAllConversations } from "../features/conversations/conversationsSlice";
import { setAuthModalOpen, logout, updateUserProfile } from "../features/auth/authSlice";
import { useUpdateProfileMutation } from "../features/auth/authApi";
import {
  setBackgroundId,
  setBackgroundOpacity,
  setTheme,
  setFontFamily,
} from "../features/theme/themeSlice";
import { BACKGROUND_PRESETS, getBackgroundById } from "../data/backgrounds";
import { KHMER_FONT_PRESETS, getFontById } from "../data/fonts";
import { KbachCorner } from "./KhmerOrnaments";
import { KhmerProfileAvatar } from "./KhmerProfileAvatar";
import { toast } from "react-hot-toast";
import type { RootState } from "../store";
import { cn } from "../lib/utils";
import { useTranslation } from "../i18n/useTranslation";

export type SettingsTab = "profile" | "appearance" | "provider" | "privacy";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

const PRESET_AVATARS = [
  { id: "apsara", name: "Apsara Celestial", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Apsara" },
  { id: "bayon", name: "Bayon Sage", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Bayon" },
  { id: "angkor", name: "Angkor Guardian", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Angkor" },
  { id: "lotus", name: "Lotus Blossom", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Lotus" },
  { id: "cybermonk", name: "Cyber Monk", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberMonk" },
  { id: "pioneer", name: "Tech Pioneer", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Sokha" },
];

interface VoicePersona {
  id: string;
  name: string;
  role: string;
  category: "educator" | "elder" | "professional" | "youth" | "monastic" | "english";
  desc: string;
  sampleText: string;
}

const KHMER_VOICE_PERSONAS: VoicePersona[] = [
  // 1. Professors & Teachers
  { id: "prof-chan", name: "សាស្ត្រាចារ្យ ច័ន្ទ (Prof. Chan)", role: "Senior Professor", category: "educator", desc: "សំឡេងសាស្ត្រាចារ្យជាន់ខ្ពស់ ធ្ងន់ និងប្រកបដោយគតិបណ្ឌិត", sampleText: "សួស្តីប្អូនៗនិស្សិត ខ្ញុំបាទសាស្ត្រាចារ្យ ច័ន្ទ។" },
  { id: "teacher-sokha", name: "លោកគ្រូ សុខា (Teacher Sokha)", role: "Tech & STEM Educator", category: "educator", desc: "សំឡេងគ្រូបង្រៀនបច្ចេកវិទ្យា ស្វាហាប់ ច្បាស់ និងរស់រវើក", sampleText: "សួស្តីទាំងអស់គ្នា! ខ្ញុំបាទលោកគ្រូ សុខា ផ្នែកបច្ចេកវិទ្យា។" },
  { id: "teacher-bopha", name: "អ្នកគ្រូ បុប្ផា (Teacher Bopha)", role: "Literature Educator", category: "educator", desc: "សំឡេងអ្នកគ្រូអក្សរសាស្ត្រខ្មែរ ស្រទន់ ច្បាស់ និងកក់ក្តៅ", sampleText: "សួស្តីកូនៗសិស្សានុសិស្ស អ្នកគ្រូឈ្មោះ បុប្ផា។" },
  { id: "km-KH-PisethNeural", name: "លោកគ្រូ ពិសិដ្ឋ (Piseth)", role: "Standard Male Voice", category: "educator", desc: "សំឡេងគ្រូបង្រៀនបុរសធម្មជាតិ ស្តង់ដារទូទៅ", sampleText: "ជម្រាបសួរ! ខ្ញុំបាទឈ្មោះ ពិសិដ្ឋ សូមស្វាគមន៍មកកាន់ សាស្ត្រា AI។" },
  { id: "km-KH-SreymomNeural", name: "អ្នកគ្រូ ស្រីមុំ (Sreymom)", role: "Standard Female Voice", category: "educator", desc: "សំឡេងគ្រូបង្រៀននារីធម្មជាតិ ស្តង់ដារទូទៅ", sampleText: "ជម្រាបសួរ! នាងខ្ញុំឈ្មោះ ស្រីមុំ រីករាយណាស់ដែលបានជួយលោកអ្នក។" },

  // 2. Elders & Traditional Storytellers
  { id: "grandpa-kong", name: "លោកតា គង់ (Grandpa Kong)", role: "Elder Historian", category: "elder", desc: "សំឡេងព្រឹទ្ធាចារ្យនិទានរឿងប្រវត្តិសាស្ត្រ និងសាស្ត្រាស្លឹករឹត", sampleText: "ឱចៅៗអើយ! ថ្ងៃនេះតាមានរឿងប្រវត្តិសាស្ត្រនិទានឱ្យស្តាប់។" },
  { id: "grandma-mao", name: "លោកយាយ ម៉ៅ (Grandma Mao)", role: "Folk Storyteller", category: "elder", desc: "សំឡេងលោកយាយចាស់ទុំនិទានរឿងព្រេង និងដំបូន្មានជីវិត", sampleText: "ស្តាប់ដំបូន្មានយាយណា៎ចៅ ធ្វើការអ្វីត្រូវមានចិត្តអំណត់។" },

  // 3. Monastic & Serenity
  { id: "monk-dhammo", name: "ព្រះតេជគុណ ធម្មរង្សី (Ven. Dhammo)", role: "Dhamma & Serenity", category: "monastic", desc: "សំឡេងធម្មទេសនា ស្ងប់ស្ងាត់ សន្តិភាព និងតម្រង់ផ្លូវចិត្ត", sampleText: "ចម្រើនពរញាតិញោមពុទ្ធបរិស័ទ សូមឱ្យមានសេចក្តីស្ងប់ក្នុងចិត្ត។" },

  // 4. Broadcasters & Executives
  { id: "news-sopheap", name: "កញ្ញា សុភាព (Presenter Sopheap)", role: "News Broadcaster", category: "professional", desc: "សំឡេងពិធីការិនី និងអ្នកអានព័ត៌មានផ្លូវការច្បាស់ៗ", sampleText: "ជម្រាបសួរលោកអ្នកនាងកញ្ញា នាងខ្ញុំ សុភាព ពីកម្មវិធីផ្សាយព័ត៌មាន។" },
  { id: "biz-vaddhana", name: "លោក វឌ្ឍនា (Entrepreneur Vaddhana)", role: "Executive & Tech", category: "professional", desc: "សំឡេងសហគ្រិន និងអ្នកជំនួញស្វាហាប់ មានទំនុកចិត្តខ្ពស់", sampleText: "សួស្តីដៃគូអាជីវកម្ម! ខ្ញុំបាទ វឌ្ឍនា ស្វាគមន៍មកកាន់យុទ្ធសាស្ត្រថ្មី។" },

  // 5. Youth & Learners
  { id: "youth-dara", name: "យុវជន តារា (Youth Dara)", role: "Modern Youth", category: "youth", desc: "សំឡេងយុវជនជំនាន់ថ្មី ស្រស់ស្រាយ រហ័ស និងទាន់សម័យ", sampleText: "សួស្តីបងប្អូន! ខ្ញុំ តារា មកពីសហគមន៍យុវជនឌីជីថល។" },
  { id: "young-devi", name: "កុមារី ទេវី (Young Devi)", role: "Young Learner", category: "youth", desc: "សំឡេងកុមារីរៀនសូត្រ ស្រស់ថ្លា គួរឱ្យស្រឡាញ់", sampleText: "ចាសជម្រាបសួរ! អូនឈ្មោះ ទេវី អូនចូលចិត្តរៀនភាសាខ្មែរណាស់។" },

  // 6. English Narrator
  { id: "en-US-AvaNeural", name: "Ava Neural HD", role: "English Narrator", category: "english", desc: "Expressive English narrator & multilingual voice", sampleText: "Hello, I am Ava, your English narrator for Sastra AI." },
];

export default memo(function SettingsModal({ open, onClose, initialTab = "profile" }: SettingsModalProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const responseLanguage = useSelector((s: RootState) => s.chat.responseLanguage || "km");
  const { selectedModelId, models } = useSelector((s: RootState) => s.provider);
  const { user, isAuthenticated, isGuest } = useSelector((s: RootState) => s.auth);
  const { backgroundId, backgroundOpacity, current: currentTheme, fontFamilyId } = useSelector((s: RootState) => s.theme);
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Profile Edit State
  const [updateProfileApi, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem("sastra_voice") || "km-KH-PisethNeural";
  });
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handlePreviewVoice = async (v: VoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewingVoice === v.id) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(v.id);
    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v.sampleText, voice: v.id }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        previewAudioRef.current = audio;
        audio.onended = () => {
          setPreviewingVoice(null);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setPreviewingVoice(null);
          URL.revokeObjectURL(url);
        };
        await audio.play();
      } else {
        setPreviewingVoice(null);
      }
    } catch {
      setPreviewingVoice(null);
    }
  };

  useEffect(() => {
    if (open) {
      if (initialTab) setActiveTab(initialTab);
      setNameInput(user?.name || "");
      setAvatarPreview(user?.avatar || "");
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingVoice(null);
    }
  }, [open, initialTab, user]);

  if (!open) return null;

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all conversation history?")) {
      dispatch(resetChat());
      dispatch(clearAllConversations());
      toast.success("Chat history cleared");
    }
  };

  // Image Upload Handler with Canvas Compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarPreview(compressedDataUrl);
          toast.success("Custom image loaded! Click Save to apply.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      if (isAuthenticated && !isGuest) {
        await updateProfileApi({
          name: nameInput.trim(),
          avatar: avatarPreview,
        }).unwrap();
      }
      dispatch(updateUserProfile({
        name: nameInput.trim(),
        avatar: avatarPreview,
      }));
      toast.success("Profile picture and name updated successfully!");
    } catch {
      // Fallback local update for offline/demo mode
      dispatch(updateUserProfile({
        name: nameInput.trim(),
        avatar: avatarPreview,
      }));
      toast.success("Profile updated locally!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      {/* Dark Solid Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Settings Modal Card (Solid Basalt Background) */}
      <div className="relative z-10 flex h-[88vh] max-h-[760px] w-full max-w-3xl flex-col rounded-3xl border-2 border-[#523E1E] bg-[#14100C] shadow-2xl shadow-black overflow-hidden">
        {/* Ornate Corner Elements */}
        <div className="absolute top-2 left-2 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>
        <div className="absolute top-2 right-2 rotate-90 text-gold/30 pointer-events-none">
          <KbachCorner className="h-5 w-5" />
        </div>

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-[#2C2114] p-4 sm:p-5 bg-gradient-to-b from-[#1E170F] to-[#14100C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D2111] to-[#161108] border border-gold/50 text-gold shadow-md">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg font-bold text-[#E5C058] tracking-tight flex items-center gap-2">
                <span>{t.settings.title}</span>
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#18130C] text-stone-400 hover:text-gold hover:border-gold/60 transition-all cursor-pointer"
            aria-label={t.settings.close}
            title={t.settings.close}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ── Tab Selector Navigation ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#2C2114] bg-[#120E0A] px-3 sm:px-6 py-2.5 shrink-0 overflow-x-auto scrollbar-none">
          {/* Tab 1: Profile */}
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
              activeTab === "profile"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-[#1E170F]",
            )}
          >
            <UserIcon className="h-3.5 w-3.5 text-gold" />
            <span>{t.settings.tabs.profile}</span>
          </button>

          {/* Tab 2: Wallpapers & Theme */}
          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
              activeTab === "appearance"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-[#1E170F]",
            )}
          >
            <Palette className="h-3.5 w-3.5 text-gold" />
            <span>{t.settings.tabs.appearance}</span>
          </button>

          {/* Tab 3: Provider */}
          <button
            type="button"
            onClick={() => setActiveTab("provider")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
              activeTab === "provider"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-[#1E170F]",
            )}
          >
            <Zap className="h-3.5 w-3.5 text-gold" />
            <span>{t.settings.tabs.models}</span>
          </button>

          {/* Tab 4: Privacy */}
          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
              activeTab === "privacy"
                ? "bg-gold/20 text-gold border border-gold/50 shadow-xs"
                : "text-stone-400 hover:text-stone-200 hover:bg-[#1E170F]",
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold" />
            <span>Privacy & Storage</span>
          </button>
        </div>

        {/* ── Scrollable Tab Content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-5 bg-[#14100C]">
          {/* TAB 1: USER PROFILE & PICTURE UPDATE */}
          {activeTab === "profile" && (
            <div className="space-y-5 animate-fade-in">
              {/* Profile Card & Avatar Editor */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2114]">
                  <div className="flex items-center gap-4">
                    {/* Main Avatar with Khmer Art Halo & Edit Badge */}
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <KhmerProfileAvatar
                        name={nameInput || user?.name}
                        avatar={avatarPreview}
                        size="xl"
                        role={user?.role as "admin" | "user"}
                        showCrown={user?.role === "admin"}
                        glow={true}
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-gold transition-opacity duration-200 z-20">
                        <Camera className="h-5 w-5" />
                        <span className="text-[9px] font-bold">Change</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-stone-100 font-sans">
                          {user?.name || "Guest User"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                          <BadgeCheck className="h-3 w-3" />
                          {isGuest ? "Guest Access" : user?.role === "admin" ? "Administrator" : "Verified Member"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 font-mono">
                        {user?.email || "guest@sastra.ai"}
                      </p>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> Member since August 2026
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(logout());
                          onClose();
                          window.location.href = "http://localhost:5175";
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          dispatch(setAuthModalOpen(true));
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/20 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/30 transition-all cursor-pointer"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Sign In</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4 pt-1">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Display Name (ឈ្មោះអ្នកប្រើប្រាស់)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-xl border border-[#3C2D18] bg-[#120E0A] px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none transition-all font-sans"
                      />
                      <Edit3 className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
                    </div>
                  </div>

                  {/* Upload Custom Photo Button (Hidden File Input) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-gold/50 bg-gold/15 px-3.5 py-2 text-xs font-semibold text-gold hover:bg-gold/25 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Custom Photo (JPG / PNG)</span>
                    </button>
                    <span className="text-[11px] text-stone-500 font-sans">
                      Max 5MB • Automatically scaled
                    </span>
                  </div>

                  {/* Preset Avatars Selection */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-stone-300 mb-2">
                      Or Choose a Sacred Cambodian & AI Avatar Preset:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                      {PRESET_AVATARS.map((preset) => {
                        const isSelected = avatarPreview === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setAvatarPreview(preset.url);
                              toast.success(`Selected ${preset.name}`);
                            }}
                            className={cn(
                              "relative flex flex-col items-center rounded-2xl border p-2 cursor-pointer transition-all",
                              isSelected
                                ? "border-gold bg-gold/20 shadow-md shadow-gold/10 scale-105"
                                : "border-[#2E2314] bg-[#120E09] hover:border-gold/50 hover:bg-[#18130C]",
                            )}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="h-11 w-11 rounded-full object-cover bg-[#1B140E] border border-gold/30"
                            />
                            <span className="text-[10px] font-semibold text-stone-300 mt-1.5 text-center truncate w-full">
                              {preset.name.split(" ")[0]}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-black shadow-xs">
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <div className="pt-3 border-t border-[#2C2114] flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdatingProfile}
                      onClick={handleSaveProfile}
                      className="inline-flex items-center gap-2 rounded-xl border border-gold/60 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] px-5 py-2 text-xs font-bold text-black shadow-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{isUpdatingProfile ? "Saving..." : "Save Profile & Picture"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Speech & Neural Voice Preferences */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gold" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-200">
                        Neural Voice Synthesis (សំឡេងអាន AI — ១២ សំឡេងខ្មែរ)
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        ជ្រើសរើសសំឡេងសាស្ត្រាចារ្យ លោកគ្រូ-អ្នកគ្រូ លោកតា-លោកយាយ ឬយុវជន
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gold font-mono bg-gold/10 px-2 py-0.5 rounded-full border border-gold/30">
                    12+ Personas HD
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-[440px] overflow-y-auto pr-1">
                  {KHMER_VOICE_PERSONAS.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    const isPreviewing = previewingVoice === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedVoice(v.id);
                          localStorage.setItem("sastra_voice", v.id);
                          toast.success(`បានកំណត់សំឡេង៖ ${v.name}`);
                        }}
                        className={cn(
                          "group relative rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between select-none",
                          isSelected
                            ? "border-gold bg-gold/15 shadow-sm shadow-gold/20"
                            : "border-[#2E2314] bg-[#120E09] hover:border-gold/40 hover:bg-[#18130C]",
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-stone-100 group-hover:text-gold transition-colors truncate">
                              {v.name}
                            </span>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold/10 text-gold font-medium border border-gold/20">
                              {v.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed line-clamp-2">
                            {v.desc}
                          </p>
                        </div>

                        {/* Audition Play Button */}
                        <div className="mt-2.5 pt-2 border-t border-[#261C10] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-stone-400 italic truncate max-w-[160px]">
                            "{v.sampleText}"
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handlePreviewVoice(v, e)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0",
                              isPreviewing
                                ? "bg-gold text-black border-gold shadow-xs"
                                : "bg-[#1E1710] text-gold/90 border-[#3D2D18] hover:bg-gold/20 hover:border-gold/50",
                            )}
                            title="ចុចដើម្បីស្តាប់សំណាកសំឡេង"
                          >
                            {isPreviewing ? (
                              <>
                                <Square className="h-2.5 w-2.5 fill-current" />
                                <span>កំពុងចាក់...</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-2.5 w-2.5 fill-current" />
                                <span>ស្តាប់</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security & Session */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gold" />
                  <h4 className="text-xs sm:text-sm font-bold text-stone-200">
                    Security & Session Credentials
                  </h4>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400 bg-[#120E09] p-3 rounded-xl border border-[#2C2114]">
                  <div>
                    <p className="text-stone-200 font-semibold">JWT Session Security</p>
                    <p className="text-[11px] text-stone-400">HMAC-SHA256 authenticated cryptographic token</p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">Active & Encrypted</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WALLPAPERS & APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-5 animate-fade-in">
              {/* Interface & Response Language Picker */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-4 sm:p-5 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C2114]">
                  <div>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-gold flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      <span>{t.settings.languageLabel}</span>
                    </h3>
                    <p className="text-xs text-stone-400 font-sans mt-0.5">
                      {t.settings.languageDesc}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = responseLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          dispatch(setResponseLanguage(lang.code));
                          toast.success(`Language set to ${lang.name} (${lang.enName})`);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-gold bg-gold/15 text-gold shadow-md shadow-gold/10 font-bold"
                            : "border-[#3A2C18] bg-[#120E0A] text-stone-300 hover:border-gold/50 hover:bg-[#1C1610]"
                        )}
                      >
                        <span className="text-2xl mb-1">{lang.flag}</span>
                        <span className="text-xs font-bold font-khmer">{lang.name}</span>
                        <span className="text-[10px] text-stone-400">{lang.enName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Header & Atmosphere Control Card */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C2114]">
                  <div>
                    <h3 className="font-khmer text-sm sm:text-base font-bold text-gold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span>ផ្ទាំងរូបភាពប្រាសាទខ្មែរ (Khmer Art Wallpapers)</span>
                    </h3>
                    <p className="text-xs text-stone-400 font-sans mt-0.5">
                      Personalize your Sastra AI workspace with sacred Cambodian temple artwork. Changes apply instantly.
                    </p>
                  </div>

                  {/* Active Indicator */}
                  <div className="inline-flex items-center gap-2 rounded-xl bg-gold/15 border border-gold/40 px-3 py-1.5 shrink-0 self-start sm:self-auto">
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Active:</span>
                    <span className="text-xs font-bold text-gold">
                      {getBackgroundById(backgroundId).nameEn}
                    </span>
                  </div>
                </div>

                {/* Atmosphere & Opacity Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Wallpaper Atmosphere & Visibility (កម្រិតពន្លឺផ្ទៃខាងក្រោយ)
                    </span>
                    <span className="text-[11px] text-stone-400 font-sans">
                      Adjust background artwork intensity for optimal reading comfort
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#120E0A] p-1 rounded-xl border border-[#2E2314]">
                    {[
                      { label: "Subtle (25%)", value: 0.25 },
                      { label: "Balanced (50%)", value: 0.5 },
                      { label: "Vivid (75%)", value: 0.75 },
                    ].map((lvl) => {
                      const active = Math.abs(backgroundOpacity - lvl.value) < 0.1;
                      return (
                        <button
                          key={lvl.label}
                          type="button"
                          onClick={() => {
                            dispatch(setBackgroundOpacity(lvl.value));
                            toast.success(`Wallpaper intensity: ${lvl.label}`);
                          }}
                          className={cn(
                            "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                            active
                              ? "bg-gold text-black shadow-sm font-bold"
                              : "text-stone-400 hover:text-stone-200 hover:bg-[#1E170F]"
                          )}
                        >
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day / Night Theme Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2C2114]">
                  <div>
                    <span className="text-xs font-bold text-stone-200 block">
                      Theme Color Mode (របៀបបង្ហាញពណ៌)
                    </span>
                    <span className="text-[11px] text-stone-400 font-sans">
                      Switch between Sacred Basalt Dark and Khmer Sandstone Light
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#120E0A] p-1 rounded-xl border border-[#2E2314]">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setTheme("dark"));
                        toast.success("Dark Mode activated");
                      }}
                      className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                        currentTheme === "dark"
                          ? "bg-gold text-black shadow-sm font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      )}
                    >
                      Dark (រាត្រី)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setTheme("light"));
                        toast.success("Light Mode activated");
                      }}
                      className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                        currentTheme === "light"
                          ? "bg-gold text-black shadow-sm font-bold"
                          : "text-stone-400 hover:text-stone-200"
                      )}
                    >
                      Light (ទិវា)
                    </button>
                  </div>
                </div>
              </div>

              {/* Khmer Typography & Chat Font Selection Card */}
              <div className="rounded-2xl border border-[#3C2D18] bg-[#1A140E] p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C2114]">
                  <div>
                    <h3 className="font-khmer text-sm sm:text-base font-bold text-gold flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      <span>ពុម្ពអក្សរខ្មែរសម្រាប់សារសន្ទនា (Khmer Response Typography)</span>
                    </h3>
                    <p className="text-xs text-stone-400 font-sans mt-0.5">
                      Choose your favorite Khmer typography for chat responses, documents, and headings. Instant live preview.
                    </p>
                  </div>

                  {/* Active Font Badge */}
                  <div className="inline-flex items-center gap-2 rounded-xl bg-gold/15 border border-gold/40 px-3 py-1.5 shrink-0 self-start sm:self-auto">
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider">Active Font:</span>
                    <span className="text-xs font-bold text-gold">
                      {getFontById(fontFamilyId).nameEn}
                    </span>
                  </div>
                </div>

                {/* Font Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {KHMER_FONT_PRESETS.map((item) => {
                    const isSelected = fontFamilyId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          dispatch(setFontFamily(item.id));
                          toast.success(`Khmer font set to "${item.nameEn}" (${item.nameKhmer})`);
                        }}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-xl border p-3.5 cursor-pointer transition-all duration-200",
                          isSelected
                            ? "border-gold bg-[#241A0E] shadow-md shadow-gold/20 ring-1 ring-gold/60"
                            : "border-[#2E2314] bg-[#120E0A] hover:border-gold/50 hover:bg-[#18120B]"
                        )}
                      >
                        <div>
                          {/* Font Header */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-sm font-bold text-gold truncate"
                              style={{ fontFamily: item.cssFamily }}
                            >
                              {item.nameKhmer}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1F180F] border border-gold/30 text-amber-300 shrink-0 font-medium">
                              {item.categoryKhmer}
                            </span>
                          </div>

                          {/* English Subtitle & Role */}
                          <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                            <span className="font-mono">{item.nameEn}</span>
                            <span className="text-stone-400 text-[10.5px] italic">{item.bestFor}</span>
                          </div>

                          {/* Live Render Preview in the Exact Font */}
                          <div className="mt-2.5 p-2.5 rounded-lg bg-[#0D0A07] border border-[#261B0E]">
                            <p
                              className="text-stone-100 text-sm sm:text-[14.5px] leading-relaxed font-normal"
                              style={{ fontFamily: item.cssFamily }}
                            >
                              «{item.sampleKhmer}»
                            </p>
                          </div>
                        </div>

                        {/* Status Footer */}
                        <div className="mt-2.5 pt-2 border-t border-[#261B0E] flex items-center justify-between text-[11px]">
                          <span
                            className={cn(
                              "font-semibold flex items-center gap-1.5",
                              isSelected ? "text-gold font-bold" : "text-stone-500 group-hover:text-stone-300"
                            )}
                          >
                            {isSelected ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                                <span>កំពុងប្រើប្រាស់ (Currently Active)</span>
                              </>
                            ) : (
                              <span>ចុចដើម្បីជ្រើសរើស (Click to Apply)</span>
                            )}
                          </span>
                          <span className="text-stone-400 text-[10px] font-mono">
                            OFL Khmer Font
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 10 Wallpapers Gallery Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-stone-300">
                    All Available Sanctuary Wallpapers (ផ្ទាំងរូបភាពទាំង ១០)
                  </span>
                  <span className="text-[11px] text-gold font-mono">
                    10 Authentic Presets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {BACKGROUND_PRESETS.map((item, idx) => {
                    const isSelected = backgroundId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          dispatch(setBackgroundId(item.id));
                          toast.success(`Wallpaper set to "${item.nameEn}"`);
                        }}
                        className={cn(
                          "group relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200",
                          isSelected
                            ? "border-gold bg-[#221A0F] shadow-lg shadow-gold/25 scale-[1.02] ring-2 ring-gold/50"
                            : "border-[#2E2314] bg-[#14100C] hover:border-gold/60 hover:bg-[#1A140E] hover:scale-[1.01]"
                        )}
                      >
                        {/* Image Thumbnail Aspect Ratio */}
                        <div className="relative h-32 w-full overflow-hidden bg-black/60">
                          <img
                            src={item.src}
                            alt={item.nameEn}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          {/* Dark Gradient Overlay for contrast */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#14100C] via-transparent to-black/30" />

                          {/* Index Badge */}
                          <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-md bg-black/80 text-[10px] font-bold text-gold/90 font-mono border border-gold/30">
                            {idx + 1}
                          </div>

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-black shadow-md">
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>Active</span>
                            </div>
                          )}
                        </div>

                        {/* Card Info Details */}
                        <div className="p-3 flex flex-col flex-1 justify-between">
                          <div>
                            <p className="font-khmer text-xs font-bold text-gold truncate">
                              {item.nameKm}
                            </p>
                            <p className="font-sans text-xs font-bold text-stone-100 truncate mt-0.5">
                              {item.nameEn}
                            </p>
                            <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#261B0E] flex items-center justify-between text-[10.5px]">
                            <span className={isSelected ? "text-gold font-bold" : "text-stone-500 group-hover:text-stone-300"}>
                              {isSelected ? "Currently Active" : "Click to Apply"}
                            </span>
                            <span className="text-stone-500 text-[10px] font-mono">
                              HD Angkor Art
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI ENGINE & PROVIDER */}
          {activeTab === "provider" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-100 font-sans">
                    Select Active AI Model & Local Engine
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Choose which sovereign model or 100% offline on-premise local Ollama model powers your chat.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-gold px-2.5 py-0.5 rounded-full bg-[#1F180F] border border-gold/40 shadow-xs">
                  Active: {models.find(m => m.id === selectedModelId)?.name || selectedModelId}
                </span>
              </div>

              {/* Models List */}
              <div className="space-y-4 pt-1">
                {/* 1. Google Gemini Cloud */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5 px-1">
                    <Sparkles className="w-3 h-3 text-gold" />
                    Sovereign Cloud Engine (Google Gemini)
                  </p>
                  <div className="space-y-2">
                    {models.filter(m => m.provider === "gemini").map((prov) => {
                      const isSelected = selectedModelId === prov.id;
                      return (
                        <div
                          key={prov.id}
                          onClick={() => {
                            dispatch(selectModel(prov.id));
                            toast.success(`Switched AI Engine to ${prov.name}`);
                          }}
                          className={cn(
                            "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-lg",
                            isSelected
                              ? "border-gold bg-[#1F170D] shadow-gold/5 ring-1 ring-gold/50"
                              : "border-[#2E2314] bg-[#18130B] hover:border-gold/40 hover:bg-[#1D160E]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                                  isSelected
                                    ? "border-gold bg-gold/20 text-gold shadow-md"
                                    : "border-[#3A2C18] bg-[#120E08] text-stone-400 group-hover:text-gold",
                                )}
                              >
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-stone-100 font-sans">
                                    {prov.name}
                                  </h4>
                                  <span
                                    className={cn(
                                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                      prov.badge_color || "border-gold/50 bg-gold/15 text-gold",
                                    )}
                                  >
                                    {prov.badge || "Flagship"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-stone-400 font-sans leading-relaxed">
                                  {prov.description}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 pt-1">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-gold" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border border-stone-600 group-hover:border-gold/60" />
                              )}
                            </div>
                          </div>

                          {/* Feature Tags */}
                          {prov.tags && (
                            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-[#261E13]">
                              {prov.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-[#130E07] px-2 py-0.5 text-[10px] text-stone-400 font-mono border border-[#2B2011]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 100% Offline Local Ollama Models */}
                {models.filter(m => m.type === "local").length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        100% Offline On-Premise Models (Ollama localhost:11434)
                      </p>
                      <span className="text-[10px] text-emerald-400/80 font-mono">Zero Cloud Egress</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {models.filter(m => m.type === "local").map((prov) => {
                        const isSelected = selectedModelId === prov.id;
                        return (
                          <div
                            key={prov.id}
                            onClick={() => {
                              dispatch(selectModel(prov.id));
                              toast.success(`Switched AI Engine to ${prov.name}`);
                            }}
                            className={cn(
                              "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-lg",
                              isSelected
                                ? "border-emerald-500 bg-emerald-950/25 shadow-emerald-500/5 ring-1 ring-emerald-500/50"
                                : "border-[#2E2314] bg-[#18130B] hover:border-emerald-500/40 hover:bg-[#1D160E]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md"
                                      : "border-[#3A2C18] bg-[#120E08] text-stone-400 group-hover:text-emerald-400",
                                  )}
                                >
                                  <Cpu className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm text-stone-100 font-sans">
                                      {prov.name}
                                    </h4>
                                    <span
                                      className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                        prov.badge_color || "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                                      )}
                                    >
                                      {prov.badge || "Local"}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      💾 {prov.size_formatted} ({prov.param_size})
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-stone-400 font-sans leading-relaxed">
                                    {prov.description}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 pt-1">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-stone-600 group-hover:border-emerald-500/60" />
                                )}
                              </div>
                            </div>

                            {/* Feature Tags */}
                            {prov.tags && (
                              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-[#261E13]">
                                {prov.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-md bg-[#130E07] px-2 py-0.5 text-[10px] text-stone-400 font-mono border border-[#2B2011]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Ollama Cloud Models */}
                {models.filter(m => m.type === "cloud" && m.provider !== "gemini").length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 px-1">
                      <Cloud className="w-3.5 h-3.5 text-sky-400" />
                      Ollama Cloud-Routed High Capacity Models
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      {models.filter(m => m.type === "cloud" && m.provider !== "gemini").map((prov) => {
                        const isSelected = selectedModelId === prov.id;
                        return (
                          <div
                            key={prov.id}
                            onClick={() => {
                              dispatch(selectModel(prov.id));
                              toast.success(`Switched AI Engine to ${prov.name}`);
                            }}
                            className={cn(
                              "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-lg",
                              isSelected
                                ? "border-sky-500 bg-sky-950/25 shadow-sky-500/5 ring-1 ring-sky-500/50"
                                : "border-[#2E2314] bg-[#18130B] hover:border-sky-500/40 hover:bg-[#1D160E]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all",
                                    isSelected
                                      ? "border-sky-500 bg-sky-500/20 text-sky-400 shadow-md"
                                      : "border-[#3A2C18] bg-[#120E08] text-stone-400 group-hover:text-sky-400",
                                  )}
                                >
                                  <Cloud className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-bold text-sm text-stone-100 font-sans">
                                      {prov.name}
                                    </h4>
                                    <span
                                      className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                        prov.badge_color || "border-sky-500/50 bg-sky-500/15 text-sky-400",
                                      )}
                                    >
                                      {prov.badge || "Cloud"}
                                    </span>
                                    <span className="text-[10px] font-mono text-sky-400/90 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-500/30">
                                      ⚡ {prov.param_size}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-stone-400 font-sans leading-relaxed">
                                    {prov.description}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 pt-1">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-sky-400" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border border-stone-600 group-hover:border-sky-500/60" />
                                )}
                              </div>
                            </div>

                            {/* Feature Tags */}
                            {prov.tags && (
                              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-[#261E13]">
                                {prov.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-md bg-[#130E07] px-2 py-0.5 text-[10px] text-stone-400 font-mono border border-[#2B2011]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* TAB 4: PRIVACY & STORAGE */}
          {activeTab === "privacy" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold text-stone-100 font-sans">
                  Data Governance & Local Storage
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Manage your browser-cached messages and session retention.
                </p>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="h-4.5 w-4.5 text-rose-400" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-100">
                        Clear Conversation History
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Permanently removes all cached chat turns, RAG document links, and uploaded files.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="rounded-xl border border-rose-500/50 bg-rose-500/20 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between border-t border-[#2C2114] p-3.5 sm:p-4 bg-[#100D08] shrink-0">
          <span className="text-[11px] text-stone-500 font-mono">
            Sastra AI • Sovereign Cambodian Intelligence v2.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/50 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] px-5 py-1.5 text-xs font-bold text-black shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});
