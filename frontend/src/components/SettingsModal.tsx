import { memo, useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { selectModel } from "../features/provider/providerSlice";
import { resetChat } from "../features/chat/chatSlice";
import { clearAllConversations } from "../features/conversations/conversationsSlice";
import { setAuthModalOpen, logout, updateUserProfile } from "../features/auth/authSlice";
import { useUpdateProfileMutation } from "../features/auth/authApi";
import { KbachCorner } from "./KhmerOrnaments";
import { KhmerProfileAvatar } from "./KhmerProfileAvatar";
import { toast } from "react-hot-toast";
import type { RootState } from "../store";
import { cn } from "../lib/utils";

export type SettingsTab = "profile" | "provider" | "privacy";

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

export default memo(function SettingsModal({ open, onClose, initialTab = "profile" }: SettingsModalProps) {
  const dispatch = useDispatch();
  const { selectedModelId, models } = useSelector((s: RootState) => s.provider);
  const { user, isAuthenticated, isGuest } = useSelector((s: RootState) => s.auth);
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Profile Edit State
  const [updateProfileApi, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [selectedVoice, setSelectedVoice] = useState("km-KH-PisethNeural");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initialTab) setActiveTab(initialTab);
      setNameInput(user?.name || "");
      setAvatarPreview(user?.avatar || "");
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
              <h2 className="font-khmer text-base sm:text-lg font-bold text-[#E5C058] tracking-tight flex items-center gap-2">
                <span>ការកំណត់ប្រព័ន្ធ & គណនី</span>
                <span className="font-sans text-xs font-semibold text-stone-400">
                  (Profile & Settings)
                </span>
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                Update your profile picture, personal details, AI model provider, and audio voice.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#18130C] text-stone-400 hover:text-gold hover:border-gold/60 transition-all cursor-pointer"
            aria-label="Close settings"
            title="Close"
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
            <span>User Profile</span>
          </button>

          {/* Tab 2: Provider */}
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
            <span>AI Engine</span>
          </button>

          {/* Tab 3: Privacy */}
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
                    <h4 className="text-xs sm:text-sm font-bold text-stone-200">
                      Neural Voice Synthesis (សំឡេងអាន AI)
                    </h4>
                  </div>
                  <span className="text-[10px] text-gold font-mono">Edge Neural HD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "km-KH-PisethNeural", name: "Piseth (ពិសិដ្ឋ)", lang: "Khmer Male", desc: "Friendly natural Khmer male speaker" },
                    { id: "km-KH-SreymomNeural", name: "Sreymom (ស្រីមុំ)", lang: "Khmer Female", desc: "Gentle natural Khmer female speaker" },
                    { id: "en-US-AvaNeural", name: "Ava Neural", lang: "English HD", desc: "Expressive English narrator voice" },
                  ].map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVoice(v.id);
                        toast.success(`Default voice set to ${v.name}`);
                      }}
                      className={cn(
                        "rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between",
                        selectedVoice === v.id
                          ? "border-gold bg-gold/10 shadow-xs"
                          : "border-[#2E2314] bg-[#130F0A] hover:border-gold/40",
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-100">{v.name}</span>
                          {selectedVoice === v.id && <CheckCircle2 className="h-3.5 w-3.5 text-gold" />}
                        </div>
                        <span className="text-[10px] text-gold/80 font-semibold mt-0.5 inline-block">{v.lang}</span>
                        <p className="text-[11px] text-stone-400 mt-1">{v.desc}</p>
                      </div>
                    </div>
                  ))}
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

          {/* TAB 2: AI ENGINE & PROVIDER */}
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
