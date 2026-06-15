'use client';

import { useMemo } from 'react';
import { Activity, ClipboardPaste, Eye, MonitorX } from 'lucide-react';
import type { ActivityEventDto, ActivityType } from '@ai-interview/types';

const LABEL: Record<ActivityType, string> = {
  join: 'joined',
  leave: 'left',
  paste: 'pasted code',
  copy: 'copied',
  cut: 'cut',
  tab_hidden: 'left the tab',
  tab_visible: 'returned to tab',
  window_blur: 'left the window',
  window_focus: 'focused window',
  run: 'ran the code',
  language_change: 'changed language',
};

interface Props {
  activity: ActivityEventDto[];
}

export function ActivityMonitor({ activity }: Props) {
  const stats = useMemo(() => {
    const count = (t: ActivityType) => activity.filter((a) => a.type === t).length;
    const distractions = count('tab_hidden') + count('window_blur');
    return {
      paste: count('paste'),
      tabHidden: count('tab_hidden'),
      blur: count('window_blur'),
      focusScore: Math.max(0, 100 - distractions * 8),
    };
  }, [activity]);

  const focusColor = stats.focusScore >= 80 ? 'text-lime-300' : stats.focusScore >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <Activity className="h-3.5 w-3.5 text-lime-300" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">// monitor</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-500">focus</span>
        <span className={`font-mono text-sm font-semibold ${focusColor}`}>{stats.focusScore}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <Stat icon={<ClipboardPaste className="h-3.5 w-3.5" />} label="pastes" value={stats.paste} />
        <Stat icon={<Eye className="h-3.5 w-3.5" />} label="tab away" value={stats.tabHidden} />
        <Stat icon={<MonitorX className="h-3.5 w-3.5" />} label="blur" value={stats.blur} />
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 font-mono text-[11px]">
        {activity.slice(0, 40).map((a) => (
          <li key={a.id} className="flex items-baseline gap-2 text-zinc-500">
            <span className="text-zinc-300">{a.authorName}</span>
            <span className="truncate">{LABEL[a.type] ?? a.type}</span>
            <span className="ml-auto shrink-0 text-zinc-600">
              {new Date(a.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </li>
        ))}
        {activity.length === 0 && <li className="py-4 text-center text-zinc-600">no activity yet.</li>}
      </ul>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-zinc-500">{icon}</div>
      <p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
    </div>
  );
}
