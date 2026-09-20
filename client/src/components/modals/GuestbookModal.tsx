import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../common/ModalWrapper';
import { useUserStore } from '../../store/useUserStore';
import { fetchGuestbook, postGuestbookMessage } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { GuestbookEntryRecord } from 'fair-shared';
import { BookOpen, Send, Sparkles } from 'lucide-react';

export const GuestbookModal: React.FC = () => {
  const { addPoints } = useUserStore();
  const [entries, setEntries] = useState<GuestbookEntryRecord[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchGuestbook()
      .then((res) => setEntries(res.entries))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setPosting(true);
    setNotice(null);
    try {
      const res = await postGuestbookMessage(message.trim());
      if (res.success) {
        soundManager.playBell();
        addPoints(2);
        setEntries([res.entry, ...entries]);
        setMessage('');
        setNotice(res.rewardNotice || 'Message signed in the guestbook!');
      } else {
        setNotice(res.message || 'Failed to sign message.');
      }
    } catch (err) {
      console.error(err);
      setNotice('Network error posting message.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ModalWrapper title="Fair Guestbook" malayalamTitle="സന്ദർശക ഡയറി" icon="📖" maxWidth="max-w-xl">
      <div className="space-y-5 text-left">
        {/* Write message section */}
        <form onSubmit={handleSubmit} className="p-4 bg-stone-900/80 rounded-xl border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-300">
            <span className="font-semibold flex items-center gap-1 text-amber-300">
              <Sparkles size={14} /> Leave your festival greeting
            </span>
            <span className="text-stone-400">{message.length}/140</span>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={140}
            rows={2}
            placeholder="Share greetings in Malayalam or English (e.g. ചിങ്ങം ആശംസകൾ / Happy festival!)..."
            className="w-full px-3 py-2 bg-stone-950/90 border border-stone-700 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400 resize-none font-malayalam"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Earn +2 Fair Points for your signature</span>
            <button
              type="submit"
              disabled={posting || !message.trim()}
              className="py-1.5 px-4 kerala-btn rounded-lg font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} />
              {posting ? 'Signing...' : 'Sign (+2 pts)'}
            </button>
          </div>
        </form>

        {notice && (
          <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-lg text-center text-xs text-amber-200">
            {notice}
          </div>
        )}

        {/* Scrollable Guestbook Entries */}
        <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-stone-400 text-xs">Opening parchment ledger...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">No signatures yet. Be the first to sign!</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full inline-block" 
                      style={{ backgroundColor: entry.avatarColor || '#E11D48' }}
                    />
                    {entry.displayName}
                  </span>
                  <span className="text-stone-500">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-200 font-malayalam leading-relaxed">
                  {entry.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
