'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface ChatMessage {
  id: string;
  author: string;
  role?: 'staff';
  time: string;
  text: string;
  self?: boolean;
}

const SEED: ChatMessage[] = [
  {
    id: '1',
    author: 'Jordan Peterson',
    time: '10:24 AM',
    text: 'Does the lecture today cover the new S3 Glacier instant retrieval policies?',
  },
  {
    id: '2',
    author: 'Instructor Sarah',
    role: 'staff',
    time: '10:25 AM',
    text: "Yes Jordan! I've added a specific section on cost optimization using Glacier. Check the session notes I just shared.",
  },
  {
    id: '3',
    author: 'Maria Garcia',
    time: '10:26 AM',
    text: "Can't wait for this one. The last session on Kafka was mind-blowing!",
  },
];

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  );
}

/**
 * Community chat panel for the live-class portal. The message list and composer
 * are functional locally (optimistic append) but not yet persisted — realtime
 * delivery (WebSockets) is a follow-up. Kept self-contained so the portal reads
 * like the design today.
 */
export function CommunityChat({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED);
  const [draft, setDraft] = useState('');

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        author: userName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text,
        self: true,
      },
    ]);
    setDraft('');
  }

  return (
    <div className="flex h-128 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">Community chat</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" />
          1.2k online
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex gap-2.5', message.self && 'flex-row-reverse')}>
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold',
                message.self
                  ? 'bg-brand-blue text-white'
                  : message.role === 'staff'
                    ? 'bg-brand-coral/15 text-brand-coral'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {initials(message.author)}
            </span>
            <div className={cn('min-w-0 max-w-[80%]', message.self && 'text-right')}>
              <div
                className={cn(
                  'flex items-center gap-1.5 text-xs',
                  message.self && 'flex-row-reverse'
                )}
              >
                <span className="font-medium text-foreground">{message.author}</span>
                {message.role === 'staff' && (
                  <span className="rounded bg-brand-coral/10 px-1 py-0.5 text-[0.6rem] font-semibold uppercase text-brand-coral">
                    Staff
                  </span>
                )}
                <span className="text-muted-foreground">{message.time}</span>
              </div>
              <p
                className={cn(
                  'mt-1 inline-block rounded-2xl px-3 py-2 text-sm',
                  message.self
                    ? 'bg-brand-blue text-white'
                    : 'bg-muted text-foreground'
                )}
              >
                {message.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message…"
          aria-label="Message"
          className="h-10 flex-1 rounded-full border border-input bg-transparent px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
