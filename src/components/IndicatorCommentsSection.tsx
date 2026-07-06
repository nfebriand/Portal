import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, User, Clock, ShieldCheck, CornerDownRight } from 'lucide-react';
import { PerformanceIndicator, IndicatorComment } from '../types';

interface IndicatorCommentsSectionProps {
  agreementId: string;
  indicator: PerformanceIndicator;
  currentUser?: { 
    id: string; 
    name: string; 
    role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; 
    division?: string; 
    photo?: string; 
  } | null;
  onAddComment: (agreementId: string, indicatorId: string, text: string) => void;
  onDeleteComment: (agreementId: string, indicatorId: string, commentId: string) => void;
}

export default function IndicatorCommentsSection({
  agreementId,
  indicator,
  currentUser,
  onAddComment,
  onDeleteComment
}: IndicatorCommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const comments = indicator.comments || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(agreementId, indicator.id, commentText);
    setCommentText('');
  };

  // Helper to determine if a user has leadership role (evaluator)
  const isPimpinan = (role: string) => {
    return role === 'Kepala' || role === 'Ketua Bidang' || role === 'Superadmin';
  };

  // Format date helper
  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id={`comments-sec-${indicator.id}`} className="mt-3 border border-slate-100 rounded-xl bg-slate-50/40 overflow-hidden text-xs">
      {/* Toggle Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100/60 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-3.5 h-3.5 ${comments.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="font-bold">
            {comments.length === 0 
              ? 'Belum ada Catatan Evaluasi' 
              : `${comments.length} Catatan Evaluasi & Feedback`
            }
          </span>
          {comments.length > 0 && (
            <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full h-5 px-1.5 min-w-5 font-mono">
              {comments.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide hover:underline">
          {isOpen ? 'Sembunyikan' : 'Buka Catatan'}
        </span>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-3.5 space-y-4 bg-white/50 border-t border-slate-100">
          
          {/* Feed List */}
          {comments.length === 0 ? (
            <div className="py-6 px-4 text-center text-slate-400 italic">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[11px]">Belum ada feedback pimpinan atau catatan evaluasi untuk sasaran ini.</p>
              {currentUser && isPimpinan(currentUser.role) && (
                <p className="text-[9px] text-slate-400 font-normal mt-0.5">Tulis feedback evaluasi Anda di bawah untuk memberikan pengarahan langsung.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map((comment) => {
                const authorIsLead = isPimpinan(comment.authorRole);
                return (
                  <div 
                    key={comment.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      authorIsLead 
                        ? 'bg-emerald-50/30 border-emerald-150/65' 
                        : 'bg-slate-50/50 border-slate-150'
                    }`}
                  >
                    {/* Comment Meta Info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-extrabold border ${
                          authorIsLead 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-800">{comment.authorName}</span>
                            {authorIsLead ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.1 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase rounded tracking-wide border border-emerald-200">
                                <ShieldCheck className="w-2.5 h-2.5" /> Pimpinan / Evaluator
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.1 bg-slate-100 text-slate-600 text-[8px] font-bold rounded tracking-wide">
                                {comment.authorRole}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatTimestamp(comment.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      {currentUser && (currentUser.id === comment.authorId || currentUser.role === 'Superadmin') && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(agreementId, indicator.id, comment.id)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Comment Body */}
                    <div className="mt-2 text-slate-700 pl-8 leading-relaxed whitespace-pre-wrap font-sans text-[11px]">
                      {comment.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form Input */}
          {currentUser ? (
            <form onSubmit={handleSubmit} className="border border-slate-200 rounded-xl bg-white p-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
              <div className="flex items-start gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isPimpinan(currentUser.role)
                      ? "Berikan catatan evaluasi, feedback pimpinan, arahan, atau persetujuan..."
                      : "Tulis respons atau catatan progres tentang sasaran ini..."
                  }
                  rows={2}
                  className="w-full bg-transparent p-1.5 outline-hidden border-0 text-xs text-slate-800 resize-none placeholder-slate-400 leading-normal"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-lg transition-all cursor-pointer self-end shrink-0 shadow-xs"
                  title="Kirim Catatan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-[10px] text-slate-400 italic text-center">Silakan masuk ke akun Anda untuk memberikan catatan evaluasi atau feedback.</p>
          )}

        </div>
      )}
    </div>
  );
}
