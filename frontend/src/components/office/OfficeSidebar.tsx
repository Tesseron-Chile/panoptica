"use client";
import type { Run } from "@/types/run";

interface Props {
  run: Run | null;
  onBack: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const PHASE_CLASS: Record<string, string> = {
  A: "bg-blue-900 text-blue-200",
  B: "bg-violet-900 text-violet-200",
  C: "bg-amber-900 text-amber-200",
  D: "bg-emerald-900 text-emerald-200",
  done: "bg-slate-700 text-slate-200",
};

export function OfficeSidebar({ run, onBack }: Props): React.ReactNode {
  if (!run) {
    return (
      <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-slate-400 text-xs font-mono">
        no active run
      </aside>
    );
  }
  return (
    <aside className="w-64 bg-slate-900 border-l border-slate-800 p-4 text-xs font-mono flex flex-col gap-4">
      <button onClick={onBack} className="text-left text-slate-400 hover:text-white">← campus</button>
      <div>
        <div className="text-slate-500 uppercase tracking-widest text-[10px]">repo</div>
        <div className="text-slate-200 truncate">{run.primaryRepo}</div>
      </div>
      <div className="flex gap-2 items-center">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PHASE_CLASS[run.phase] ?? "bg-slate-700 text-slate-200"}`}>
          PHASE {run.phase.toUpperCase()}
        </span>
        <span className="text-slate-300">{formatElapsed(run.stats?.elapsedSeconds ?? 0)}</span>
      </div>
      <div>
        <div className="text-slate-500 uppercase tracking-widest text-[10px] mb-1">tasks</div>
        <div className="text-slate-200">
          {run.planTasks.filter((t) => t.status === "done").length} / {run.planTasks.length}
        </div>
      </div>
      <div className="mt-auto text-[10px] text-slate-600 leading-relaxed">
        Esc — back<br />
        Click agent — focus
      </div>
    </aside>
  );
}
