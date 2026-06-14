'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Users, X } from 'lucide-react';
import { endRoom, getRoom, MONACO_LANGUAGE, STARTER_TEMPLATES } from '@/lib/codesync';
import { ApiClientError } from '@/lib/api';
import { useRoom } from '@/lib/use-room';
import { CollaborativeEditor } from '@/components/room/collaborative-editor';
import { ParticipantsPanel } from '@/components/room/participants-panel';
import { ChatPanel } from '@/components/room/chat-panel';
import { ActivityMonitor } from '@/components/room/activity-monitor';
import { OutputConsole } from '@/components/room/output-console';
import { RoomTopBar } from '@/components/room/room-top-bar';

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (isError || !data) {
    const msg =
      error instanceof ApiClientError && error.status === 404
        ? "This room doesn't exist or you don't have access."
        : 'Could not load this room.';
    return <RoomMessage title="Can't open this room" body={msg} />;
  }

  if (data.status === 'ended') {
    return (
      <RoomMessage
        title="This interview has ended"
        body={`“${data.title}” is no longer live. The final code was saved to the recording.`}
      />
    );
  }

  return <RoomWorkspace roomId={roomId} roomCode={data.inviteCode} />;
}

function RoomMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-xl font-semibold text-white/90">{title}</h1>
      <p className="max-w-sm text-sm text-white/50">{body}</p>
      <Link
        href="/rooms"
        className="mt-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
      >
        Back to rooms
      </Link>
    </div>
  );
}

function RoomWorkspace({ roomId, roomCode }: { roomId: string; roomCode: string }) {
  const router = useRouter();
  const r = useRoom(roomCode);
  const seeded = useRef(false);
  const [mobilePanel, setMobilePanel] = useState<'people' | 'chat' | null>(null);

  const selfUserId = r.presence.find((p) => p.socketId === r.selfSocketId)?.userId ?? null;
  const isInterviewer = r.yourRole === 'interviewer';

  // The interviewer seeds a starter template into an empty room once connected.
  useEffect(() => {
    if (seeded.current || r.status !== 'connected' || !isInterviewer) {
      return;
    }
    const ytext = r.ydoc.getText('monaco');
    if (ytext.length === 0) {
      ytext.insert(0, STARTER_TEMPLATES[r.language]);
    }
    seeded.current = true;
  }, [r.status, isInterviewer, r.language, r.ydoc]);

  useEffect(() => {
    if (r.snapshotJustCreated) {
      toast.success(`Snapshot saved · ${r.snapshotJustCreated.lineCount} lines`);
    }
  }, [r.snapshotJustCreated]);

  const end = useMutation({
    mutationFn: () => endRoom(roomId),
    onSuccess: () => {
      toast.success('Interview ended');
      router.push('/rooms');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Could not end room'),
  });

  function handleEnd() {
    if (window.confirm('End this interview for everyone? The final code will be saved.')) {
      end.mutate();
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <RoomTopBar
        room={r.room}
        language={r.language}
        yourRole={r.yourRole}
        status={r.status}
        onChangeLanguage={r.changeLanguage}
        onSnapshot={() => r.createSnapshot()}
        onEnd={handleEnd}
      />

      <div className="flex min-h-0 flex-1">
        {/* Left rail — participants + (interviewer) monitor */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.02] backdrop-blur-xl lg:flex">
          <div className={isInterviewer ? 'h-1/2 min-h-0 border-b border-white/10' : 'flex-1 min-h-0'}>
            <ParticipantsPanel presence={r.presence} typingUsers={r.typingUsers} selfSocketId={r.selfSocketId} />
          </div>
          {isInterviewer && (
            <div className="h-1/2 min-h-0">
              <ActivityMonitor activity={r.activity} />
            </div>
          )}
        </aside>

        {/* Center — shared editor (top) + output console (bottom). The editor's
            absolute inset gives Monaco a concrete box (height:100% doesn't
            resolve reliably inside a flex child). */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#0c0d11]">
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <CollaborativeEditor
                ydoc={r.ydoc}
                languageId={MONACO_LANGUAGE[r.language]}
                readOnly={r.status === 'ended'}
                remoteCursors={r.remoteCursors}
                selfSocketId={r.selfSocketId}
                onAwareness={r.sendAwareness}
                onActivity={r.reportActivity}
              />
            </div>

            {r.status === 'ended' && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
                <p className="text-lg font-medium text-white/90">This interview has ended.</p>
                <Link href="/rooms" className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
                  Back to rooms
                </Link>
              </div>
            )}
          </div>

          <OutputConsole
            execStatus={r.execStatus}
            execRunner={r.execRunner}
            lastExecution={r.lastExecution}
            canRun={r.status === 'connected'}
            onRun={r.runCode}
          />
        </main>

        {/* Right rail — chat */}
        <aside className="hidden w-80 shrink-0 border-l border-white/10 bg-white/[0.02] backdrop-blur-xl xl:block">
          <ChatPanel
            messages={r.messages}
            typingUsers={r.typingUsers}
            selfUserId={selfUserId}
            onSend={r.sendChat}
            onTyping={r.sendTyping}
          />
        </aside>
      </div>

      {/* Mobile/tablet panel toggles */}
      <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl xl:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel('people')}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
        >
          <Users className="h-4 w-4" /> People ({r.presence.length})
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('chat')}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
        >
          <MessageSquare className="h-4 w-4" /> Chat
        </button>
      </div>

      {mobilePanel && (
        <div className="fixed inset-0 z-50 xl:hidden" onClick={() => setMobilePanel(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col border-l border-white/10 bg-[#0d0f14]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobilePanel(null)}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white/50 hover:bg-white/10"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
            {mobilePanel === 'people' ? (
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <ParticipantsPanel
                    presence={r.presence}
                    typingUsers={r.typingUsers}
                    selfSocketId={r.selfSocketId}
                  />
                </div>
                {isInterviewer && (
                  <div className="min-h-0 flex-1 border-t border-white/10">
                    <ActivityMonitor activity={r.activity} />
                  </div>
                )}
              </div>
            ) : (
              <ChatPanel
                messages={r.messages}
                typingUsers={r.typingUsers}
                selfUserId={selfUserId}
                onSend={r.sendChat}
                onTyping={r.sendTyping}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
