'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessageDto } from '@ai-interview/types';
import type { TypingUser } from '@/lib/use-room';

const QUICK_EMOJI = ['👍', '🎉', '🤔', '✅', '🚀', '👀'];

interface Props {
  messages: ChatMessageDto[];
  typingUsers: TypingUser[];
  selfUserId: string | null;
  onSend: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ messages, typingUsers, selfUserId, onSend, onTyping }: Props) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typingUsers]);

  function handleChange(value: string) {
    setDraft(value);
    onTyping(true);
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => onTyping(false), 1200);
  }

  function submit() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    onSend(text);
    setDraft('');
    onTyping(false);
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="px-4 pb-3 pt-4 text-xs font-semibold uppercase tracking-wider text-white/50">Chat</h2>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4">
        {messages.map((m) => {
          if (m.type === 'system') {
            return (
              <p key={m.id} className="text-center text-xs text-white/30">
                {m.text}
              </p>
            );
          }
          const mine = m.userId === selfUserId;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && <span className="mb-0.5 px-1 text-xs text-white/40">{m.authorName}</span>}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  mine
                    ? 'rounded-br-sm bg-sky-500/90 text-[#06121e]'
                    : 'rounded-bl-sm bg-white/[0.07] text-white/90'
                }`}
              >
                {m.text}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-white/25">{timeLabel(m.createdAt)}</span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-white/30">No messages yet. Say hello 👋</p>
        )}
        {typingUsers.length > 0 && (
          <p className="px-1 text-xs italic text-white/40">
            {typingUsers.map((t) => t.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </p>
        )}
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="mb-2 flex gap-1">
          {QUICK_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setDraft((d) => d + e)}
              className="rounded-md px-1.5 py-0.5 text-base transition-transform hover:scale-110"
              aria-label={`Insert ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Message…"
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-sky-500/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-[#06121e] transition-opacity hover:bg-sky-400 disabled:opacity-30"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
