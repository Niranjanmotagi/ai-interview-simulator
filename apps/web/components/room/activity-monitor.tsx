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
  tab_hidden: 'switched away from the tab',
  tab_visible: 'returned to the tab',
  window_blur: 'left the window',
  window_focus: 'focused the window',
  run: 'ran the code',
  language_change: 'changed the language',
};

interface Props {
  activity: ActivityEventDto[];
}

/** Interviewer-only integrity & engagement monitor with a derived focus score. */
export function ActivityMonitor({ activity }: Props) {
  const stats = useMemo(() => {
    const count = (t: ActivityType) => activity.filter((a) => a.type === t).length;
    const distractions = count('tab_hidden') + count('window_blur');
    const focusScore = Math.max(0, 100 - distractions * 8);
    return {
      paste: count('paste'),
      tabHidden: count('tab_hidden'),
      blur: count('window_blur'),
      run: count('run'),
      focusScore,
    };
  }, [activity]);

  const focusColor =
    stats.focusScore >= 80 ? 'text-emerald-600' : stats.focusScore >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <Activity className="h-3.5 w-3.5 text-indigo-600" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Monitor</h2>
        <span className="ml-auto text-xs text-zinc-400">Focus</span>
        <span className={`text-sm font-semibold ${focusColor}`}>{stats.focusScore}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
        <Stat icon={<ClipboardPaste className="h-3.5 w-3.5" />} label="Pastes" value={stats.paste} />
        <Stat icon={<Eye className="h-3.5 w-3.5" />} label="Tab away" value={stats.tabHidden} />
        <Stat icon={<MonitorX className="h-3.5 w-3.5" />} label="Blur" value={stats.blur} />
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-3 text-xs">
        {activity.slice(0, 40).map((a) => (
          <li key={a.id} className="flex items-baseline gap-2 text-zinc-500">
            <span className="font-medium text-zinc-700">{a.authorName}</span>
            <span className="truncate">{LABEL[a.type] ?? a.type}</span>
            <span className="ml-auto shrink-0 text-zinc-300">
              {new Date(a.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </li>
        ))}
        {activity.length === 0 && <li className="py-4 text-center text-zinc-400">No activity recorded yet.</li>}
      </ul>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-zinc-400">{icon}</div>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
      <p className="text-[10px] text-zinc-400">{label}</p>
    </div>
  );
}
