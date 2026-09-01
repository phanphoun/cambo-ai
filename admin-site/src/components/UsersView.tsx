import { useState, useEffect, type FormEvent } from "react";
import {
  Search,
  Plus,
  Trash2,
  Shield,
  User,
  X,
  Lock,
  Unlock,
  MessageSquare,
  Sparkles,
  Bot,
  FileText,
  Clock,
  Zap,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminApi } from "../services/api";
import { formatDate, cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { KhmerCardCorners, KhmerLotusMedallion, KhmerCornerOrnament } from "./Ornaments";
import type { UserItem, UserChatTurn } from "../types";

interface UsersViewProps {
  users: UserItem[];
  onRefresh: () => void;
}

export function UsersView({ users, onRefresh }: UsersViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">("all");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "member" | "guest">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected User for Deep Chat Inspection
  const [inspectUser, setInspectUser] = useState<UserItem | null>(null);
  const [userChats, setUserChats] = useState<UserChatTurn[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [activeInspectorTab, setActiveInspectorTab] = useState<"chats" | "overview">("chats");

  // Load chat history when inspecting a user
  useEffect(() => {
    if (inspectUser) {
      loadUserChats(inspectUser.id);
    } else {
      setUserChats([]);
    }
  }, [inspectUser]);

  const loadUserChats = async (userId: string) => {
    setLoadingChats(true);
    try {
      const data = await AdminApi.getUserChats(userId);
      setUserChats(data.chats || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user chat history");
    } finally {
      setLoadingChats(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (u.status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await AdminApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      toast.success(`User ${email} created successfully!`);
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await AdminApi.updateUserRole(userId, newRole);
      toast.success("User role updated");
      onRefresh();
      if (inspectUser && inspectUser.id === userId) {
        setInspectUser({ ...inspectUser, role: newRole as any });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleToggleLock = async (user: UserItem) => {
    const nextStatus = (user.status || "active") === "active" ? "locked" : "active";
    try {
      await AdminApi.updateUserStatus(user.id, nextStatus);
      toast.success(`User ${user.email} is now ${nextStatus === "locked" ? "LOCKED 🔒" : "ACTIVE 🟢"}`);
      onRefresh();
      if (inspectUser && inspectUser.id === user.id) {
        setInspectUser({ ...inspectUser, status: nextStatus });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user ${userEmail}? All session records will be purged.`)) {
      try {
        await AdminApi.deleteUser(userId);
        toast.success(`User ${userEmail} deleted`);
        if (inspectUser && inspectUser.id === userId) {
          setInspectUser(null);
        }
        onRefresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user");
      }
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const filteredChats = userChats.filter((c) =>
    c.user_message.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.ai_response.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.model.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in select-none">
      {/* Top Search, Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬ Role..."
              className="w-full rounded-2xl border border-[#3C301D] bg-[#120F0B] pl-10 pr-3 py-2 text-xs text-stone-100 placeholder:text-stone-600 focus:border-gold/70 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center rounded-2xl border border-[#3C301D] bg-[#14100C] p-1 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                statusFilter === "all" ? "bg-gold/20 text-gold border border-gold/40" : "text-stone-400 hover:text-stone-200"
              )}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                statusFilter === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "text-stone-400 hover:text-stone-200"
              )}
            >
              Active ({users.filter((u) => (u.status || "active") === "active").length})
            </button>
            <button
              onClick={() => setStatusFilter("locked")}
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
                statusFilter === "locked" ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "text-stone-400 hover:text-stone-200"
              )}
            >
              Locked ({users.filter((u) => u.status === "locked").length})
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-gold via-amber-500 to-amber-700 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-[#4A3820] bg-[#120E09]/95 overflow-hidden shadow-xl relative">
        <KhmerCardCorners size="w-5 h-5" opacity="opacity-35" />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="border-b border-[#281E13] bg-[#17120B] text-[11px] font-bold text-gold uppercase tracking-wider font-heading">
              <tr>
                <th className="py-3.5 px-4">User Account (គណនី)</th>
                <th className="py-3.5 px-4">System Role (តួនាទី)</th>
                <th className="py-3.5 px-4">Account Status (ស្ថានភាព)</th>
                <th className="py-3.5 px-4">AI Usage (ការប្រើប្រាស់)</th>
                <th className="py-3.5 px-4 text-right">Actions (សកម្មភាព)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#241B11]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-500 font-khmer">
                    មិនមានគណនីដែលត្រូវគ្នានឹងការស្វែងរកឡើយ។
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLocked = u.status === "locked";
                  const initials = u.name
                    ? u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "U";

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        "hover:bg-[#1C1610]/80 transition-colors group",
                        isLocked && "bg-rose-950/10"
                      )}
                    >
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E5C058] via-[#C99C32] to-[#8C6514] text-black font-bold text-xs shadow-md overflow-hidden border border-gold/60">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-100">{u.name}</span>
                              {isLocked && (
                                <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-400 border border-rose-500/40">
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 font-mono block">{u.email}</span>
                            <span className="text-[10px] text-stone-500 block">Joined {formatDate(u.created_at)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={cn(
                            "rounded-xl border px-2.5 py-1 text-[11px] font-semibold bg-[#16120C] focus:outline-none transition-all cursor-pointer",
                            u.role === "admin"
                              ? "border-rose-500/40 text-rose-400"
                              : u.role === "member"
                              ? "border-gold/40 text-gold"
                              : "border-sky-500/40 text-sky-400"
                          )}
                        >
                          <option value="admin">Administrator (Root)</option>
                          <option value="member">Member (Standard)</option>
                          <option value="guest">Guest (Restricted)</option>
                        </select>
                      </td>

                      {/* Status Column (Lock / Active) */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(u)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all cursor-pointer shadow-xs",
                            isLocked
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                              : "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                          )}
                          title={isLocked ? "Click to Unlock user account" : "Click to Lock user account"}
                        >
                          {isLocked ? (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Locked (Suspended)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active (Normal)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* AI Usage Scorecard */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] text-gold font-mono font-semibold">
                              <Zap className="h-3 w-3" /> {u.total_queries ?? 0} queries
                            </span>
                            <span className="text-stone-500 text-[10px]">·</span>
                            <span className="text-stone-400 text-[10px] font-mono">
                              {((u.total_tokens ?? 0) / 1000).toFixed(1)}k tokens
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 block">
                            Last Active: {u.last_active ? formatDate(u.last_active) : "Recently"}
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Chats Button */}
                          <button
                            onClick={() => setInspectUser(u)}
                            className="flex items-center gap-1 rounded-xl border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold hover:bg-gold/20 hover:border-gold/60 transition-all cursor-pointer"
                            title="Inspect full AI chat history & questions"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Inspect Chats</span>
                          </button>

                          {/* Quick Lock Button */}
                          <button
                            onClick={() => handleToggleLock(u)}
                            className={cn(
                              "p-1.5 rounded-xl border transition-all cursor-pointer",
                              isLocked
                                ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                                : "border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                            )}
                            title={isLocked ? "Unlock Account" : "Lock Account"}
                          >
                            {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── USER DETAILS & FULL AI CHAT INSPECTOR MODAL ── */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setInspectUser(null)} />

          <div className="relative z-10 flex h-[90vh] max-h-[840px] w-full max-w-4xl flex-col rounded-3xl border-2 border-[#523E1E] bg-[#14100C] shadow-2xl shadow-black overflow-hidden">
            <KhmerCardCorners size="w-6 h-6" opacity="opacity-75" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2C2114] p-4 sm:p-5 bg-gradient-to-b from-[#1E170F] to-[#14100C] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E5C058] via-[#C99C32] to-[#8C6514] text-black font-bold text-sm shadow-md border-2 border-gold overflow-hidden">
                  {inspectUser.avatar ? (
                    <img src={inspectUser.avatar} alt={inspectUser.name} className="h-full w-full object-cover" />
                  ) : (
                    inspectUser.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-100">{inspectUser.name}</h3>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold border",
                      inspectUser.status === "locked"
                        ? "border-rose-500/50 bg-rose-500/20 text-rose-400"
                        : "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                    )}>
                      {inspectUser.status === "locked" ? "LOCKED 🔒" : "ACTIVE 🟢"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono">{inspectUser.email} · ID: {inspectUser.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLock(inspectUser)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    inspectUser.status === "locked"
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                      : "border-rose-500/50 bg-rose-500/20 text-rose-300"
                  )}
                >
                  {inspectUser.status === "locked" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{inspectUser.status === "locked" ? "Unlock Account" : "Lock Account"}</span>
                </button>

                <button
                  onClick={() => setInspectUser(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3C301D] bg-[#18130C] text-stone-400 hover:text-gold transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#100C08] border-b border-[#2C2114] shrink-0">
              <div className="rounded-2xl border border-[#2D2112] bg-[#17120B] p-3">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Total AI Queries</span>
                <p className="text-lg font-bold text-gold font-mono mt-0.5">{userChats.length || inspectUser.total_queries || 0}</p>
              </div>
              <div className="rounded-2xl border border-[#2D2112] bg-[#17120B] p-3">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Est. Token Volume</span>
                <p className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                  {(userChats.reduce((acc, c) => acc + (c.tokens_used || 0), 0) / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="rounded-2xl border border-[#2D2112] bg-[#17120B] p-3">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Documents Generated</span>
                <p className="text-lg font-bold text-sky-400 font-mono mt-0.5">
                  {userChats.filter((c) => c.has_document).length}
                </p>
              </div>
              <div className="rounded-2xl border border-[#2D2112] bg-[#17120B] p-3">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Member Tier</span>
                <p className="text-sm font-bold text-emerald-400 font-sans mt-1 capitalize">{inspectUser.role} Access</p>
              </div>
            </div>

            {/* Sub-Header Tabs & Search */}
            <div className="flex items-center justify-between border-b border-[#2C2114] bg-[#120E0A] px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInspectorTab("chats")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                    activeInspectorTab === "chats"
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>AI Conversations ({userChats.length})</span>
                </button>
                <button
                  onClick={() => setActiveInspectorTab("overview")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                    activeInspectorTab === "overview"
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>User Details</span>
                </button>
              </div>

              {activeInspectorTab === "chats" && (
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-500" />
                  <input
                    type="text"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search in chats..."
                    className="w-full rounded-xl border border-[#3C2D18] bg-[#18130C] pl-8 pr-2.5 py-1 text-xs text-stone-100 placeholder-stone-600 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-5 space-y-4 bg-[#14100C]">
              {activeInspectorTab === "chats" && (
                <div className="space-y-4">
                  {loadingChats ? (
                    <div className="flex items-center justify-center py-16 text-gold gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-xs">Loading conversation transcripts...</span>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="rounded-2xl border border-[#2D2112] bg-[#17120B] p-12 text-center text-stone-500 space-y-2">
                      <MessageSquare className="h-8 w-8 text-stone-600 mx-auto" />
                      <p className="text-sm font-semibold text-stone-400">No AI conversations logged yet for this user.</p>
                      <p className="text-xs">Any new queries the user asks in the chat frontend will automatically appear here live.</p>
                    </div>
                  ) : (
                    filteredChats.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-[#342718] bg-[#18130C] p-4 space-y-3 shadow-md">
                        {/* Chat Metadata Header */}
                        <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-[#281E13] pb-2">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                              {c.model || c.provider}
                            </span>
                            <span>{c.tokens_used} tokens</span>
                            {c.has_document && (
                              <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] text-sky-400 font-bold border border-sky-500/30">
                                📄 Document Generated
                              </span>
                            )}
                          </div>
                          <span className="text-stone-500">{formatDate(c.timestamp)}</span>
                        </div>

                        {/* User Prompt */}
                        <div className="flex items-start gap-2.5 bg-[#1F170D] p-3 rounded-xl border border-gold/20">
                          <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0 text-[10px] font-bold">
                            User
                          </div>
                          <p className="text-xs text-stone-100 font-sans font-medium whitespace-pre-wrap flex-1">
                            {c.user_message}
                          </p>
                        </div>

                        {/* AI Response Preview */}
                        <div className="flex items-start gap-2.5 bg-[#120E09] p-3 rounded-xl border border-[#2B2012] relative group/resp">
                          <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-[10px] font-bold">
                            AI
                          </div>
                          <div className="text-xs text-stone-300 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto scrollbar-thin flex-1 pr-8">
                            {c.ai_response}
                          </div>
                          <button
                            onClick={() => handleCopyText(c.ai_response)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg border border-[#3C301D] bg-[#16120C] text-stone-400 hover:text-gold hover:border-gold/40 transition-colors opacity-0 group-hover/resp:opacity-100 cursor-pointer"
                            title="Copy response"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeInspectorTab === "overview" && (
                <div className="space-y-4 text-xs text-stone-300">
                  <div className="rounded-2xl border border-[#342718] bg-[#18130C] p-4 space-y-3">
                    <h4 className="font-heading font-bold text-sm text-gold">Account Attributes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="bg-[#120E09] p-2.5 rounded-xl border border-[#2B2012]">
                        <span className="text-stone-500 block">User ID:</span>
                        <span className="text-stone-200">{inspectUser.id}</span>
                      </div>
                      <div className="bg-[#120E09] p-2.5 rounded-xl border border-[#2B2012]">
                        <span className="text-stone-500 block">Email:</span>
                        <span className="text-stone-200">{inspectUser.email}</span>
                      </div>
                      <div className="bg-[#120E09] p-2.5 rounded-xl border border-[#2B2012]">
                        <span className="text-stone-500 block">Joined Date:</span>
                        <span className="text-stone-200">{formatDate(inspectUser.created_at)}</span>
                      </div>
                      <div className="bg-[#120E09] p-2.5 rounded-xl border border-[#2B2012]">
                        <span className="text-stone-500 block">Status:</span>
                        <span className={inspectUser.status === "locked" ? "text-rose-400" : "text-emerald-400"}>
                          {inspectUser.status?.toUpperCase() || "ACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-4 space-y-2">
                    <h4 className="font-bold text-rose-400">Danger Zone</h4>
                    <p className="text-[11px] text-stone-400">
                      Permanently delete this user account. This will invalidate all active JWT tokens and revoke system access.
                    </p>
                    <button
                      onClick={() => handleDeleteUser(inspectUser.id, inspectUser.email)}
                      className="mt-2 rounded-xl border border-rose-500/50 bg-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer"
                    >
                      Delete Account Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#4A3820] bg-[#15110C] p-6 shadow-2xl animate-fade-in select-none">
            <KhmerCardCorners size="w-5 h-5" opacity="opacity-70" />

            <div className="flex items-center justify-between border-b border-[#281E13] pb-3">
              <h3 className="font-heading font-bold text-gold text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Create New User Account (បង្កើតគណនីថ្មី)</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-gold transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Full Name (ឈ្មោះពេញ)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pich Sokha"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#120F0B] px-3.5 py-2.5 text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Email Address (អ៊ីមែល)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@sastra.ai"
                  className="w-full rounded-xl border border-[#3C301D] bg-[#120F0B] px-3.5 py-2.5 text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">Password (ពាក្យសម្ងាត់)</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#3C301D] bg-[#120F0B] px-3.5 py-2.5 pr-10 text-stone-100 placeholder-stone-600 focus:border-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 mb-1 font-semibold">System Role (តួនាទី)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-[#3C301D] bg-[#120F0B] px-3.5 py-2.5 text-stone-100 focus:border-gold focus:outline-none"
                >
                  <option value="member">Member (Regular User Access)</option>
                  <option value="admin">Administrator (Full Root Access)</option>
                  <option value="guest">Guest (Restricted Mode)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#281E13]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[#3C301D] bg-[#18130C] px-4 py-2 font-semibold text-stone-300 hover:bg-[#201910] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-gold to-amber-600 px-5 py-2 font-bold text-black shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

