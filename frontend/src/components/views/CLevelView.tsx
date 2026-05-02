"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatTab } from "@/components/chat/ChatTab";
import { useFloorUpdates } from "@/hooks/useFloorUpdates";
import { useNavigationStore } from "@/stores/navigationStore";
import type { FloorConfig } from "@/types/navigation";

const API_BASE = "http://localhost:8000/api/v1";
const C_LEVEL_ID = "c_level";

const LED_BY_PRIORITY: Record<string, string> = {
  critical: "#ef4444",
  alert: "#f59e0b",
  info: "#22c55e",
  report: "#3b82f6",
};

interface Proposal {
  filename: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Directive {
  id: number;
  floorId: string;
  instruction: string;
  triggeredBy: string;
  status: string;
  triggeredAt: string;
}

// ─── Left column ─────────────────────────────────────────────────────────────

function FloorStatusCard({ floor }: { floor: FloorConfig }) {
  const { goToFloor } = useNavigationStore();
  const { updates } = useFloorUpdates({ floorId: floor.id, limit: 1 });
  const latest = updates[0];
  const ledColor = latest
    ? (LED_BY_PRIORITY[latest.priority] ?? "#6b7280")
    : "#6b7280";

  return (
    <button
      onClick={() => goToFloor(floor.id)}
      className="w-full text-left bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-lg overflow-hidden transition-colors"
    >
      <div className="h-0.5 w-full" style={{ backgroundColor: floor.accent }} />
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: ledColor, boxShadow: `0 0 5px ${ledColor}` }}
        />
        <span className="text-sm">{floor.icon}</span>
        <div className="min-w-0 flex-grow">
          <div className="text-xs font-semibold text-slate-200 truncate">{floor.name}</div>
          {latest && (
            <div className="text-[10px] text-slate-500 truncate">{latest.title}</div>
          )}
        </div>
        <span className="text-slate-600 text-xs flex-shrink-0">→</span>
      </div>
    </button>
  );
}

function LeftColumn({ floors }: { floors: FloorConfig[] }) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-800 overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">Pisos</h2>
      </div>
      <div className="flex-shrink-0 overflow-y-auto max-h-64 p-2 flex flex-col gap-1.5">
        {floors.map((f) => (
          <FloorStatusCard key={f.id} floor={f} />
        ))}
      </div>
      <div className="flex-shrink-0 border-t border-slate-800 px-3 py-2">
        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">
          Chat C-Level
        </span>
      </div>
      <div className="flex-grow min-h-0">
        <ChatTab floorId={C_LEVEL_ID} />
      </div>
    </div>
  );
}

// ─── Center column — El Arquitecto ───────────────────────────────────────────

function ProposalCard({
  proposal,
  onApprove,
  onReject,
}: {
  proposal: Proposal;
  onApprove: (p: Proposal) => void;
  onReject: (p: Proposal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(proposal.createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold text-violet-200 truncate">{proposal.title}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{date}</div>
        </div>
        <span className="text-slate-500 text-xs flex-shrink-0">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto border-t border-slate-700 pt-2 mb-3">
            {proposal.content}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(proposal)}
              className="flex-1 text-[11px] py-1.5 rounded bg-green-800/60 hover:bg-green-700/60 text-green-300 transition-colors"
            >
              ✓ Aprobar
            </button>
            <button
              onClick={() => onReject(proposal)}
              className="flex-1 text-[11px] py-1.5 rounded bg-red-900/40 hover:bg-red-800/40 text-red-400 transition-colors"
            >
              ✕ Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArquitectoColumn() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/floors/c_level/proposals`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Proposal[] | null) => {
        if (data) setProposals(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [refreshTick]);

  useEffect(() => {
    const iv = setInterval(() => setRefreshTick((t) => t + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  const handleApprove = useCallback(async (p: Proposal) => {
    await fetch(`${API_BASE}/floors/c_level/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "c_level",
        role: "user",
        content: `@arquitecto: aprobado - ${p.filename}`,
      }),
    });
    setRefreshTick((t) => t + 1);
  }, []);

  const handleReject = useCallback(async (p: Proposal) => {
    await fetch(
      `${API_BASE}/floors/c_level/proposals/${encodeURIComponent(p.filename)}`,
      { method: "DELETE" },
    );
    setRefreshTick((t) => t + 1);
  }, []);

  const handleTrigger = useCallback(async () => {
    setTriggering(true);
    try {
      await fetch(`${API_BASE}/floors/c_level/arquitecto/trigger`, { method: "POST" });
      setRefreshTick((t) => t + 1);
    } finally {
      setTriggering(false);
    }
  }, []);

  return (
    <div className="flex-grow flex flex-col border-r border-slate-800 overflow-hidden min-w-0">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">
          ⚙ El Arquitecto
        </h2>
        <button
          onClick={() => void handleTrigger()}
          disabled={triggering}
          className="text-[10px] px-2 py-1 rounded bg-violet-700/50 hover:bg-violet-600/50 text-violet-200 disabled:opacity-50 transition-colors"
        >
          {triggering ? "Observando…" : "Ciclo manual"}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-2">
        {proposals.length === 0 ? (
          <div className="text-[11px] text-slate-600 text-center mt-8">
            Sin propuestas pendientes
          </div>
        ) : (
          proposals.map((p) => (
            <ProposalCard
              key={p.filename}
              proposal={p}
              onApprove={(pr) => void handleApprove(pr)}
              onReject={(pr) => void handleReject(pr)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Right column — Visión + Costos + Directivas ─────────────────────────────

function VisionEditor() {
  const [vision, setVision] = useState("");
  const [saved, setSaved] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/preferences/company_vision`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { value: string | null } | null) => {
        if (data?.value) setVision(data.value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleChange = (v: string) => {
    setVision(v);
    setSaved(false);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch(`${API_BASE}/preferences/company_vision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: v }),
      })
        .then(() => setSaved(true))
        .catch(() => {});
    }, 800);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
          Visión
        </span>
        {saved && <span className="text-[9px] text-green-500">guardado</span>}
      </div>
      <textarea
        value={vision}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Escribe la visión de la empresa…"
        rows={3}
        className="w-full bg-slate-800/60 border border-slate-700 rounded text-[11px] text-slate-300 placeholder:text-slate-600 px-2 py-1.5 resize-none focus:outline-none focus:border-violet-600"
      />
    </div>
  );
}

function CostCenter({ floor }: { floor: FloorConfig }) {
  const prefKey = `cost_${floor.id}`;
  const [cost, setCost] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/preferences/${prefKey}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { value: string | null } | null) => {
        if (data?.value) setCost(data.value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [prefKey]);

  const handleBlur = () => {
    fetch(`${API_BASE}/preferences/${prefKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: cost }),
    }).catch(() => {});
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm flex-shrink-0">{floor.icon}</span>
      <span className="text-[11px] text-slate-400 flex-grow truncate">{floor.name}</span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <span className="text-[10px] text-slate-600">$</span>
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className="w-16 bg-slate-800/60 border border-slate-700 rounded text-[11px] text-slate-300 px-1.5 py-0.5 text-right focus:outline-none focus:border-violet-600"
        />
        <span className="text-[9px] text-slate-600">/mes</span>
      </div>
    </div>
  );
}

function DirectivesList() {
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/floors/c_level/directives?limit=10`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Directive[] | null) => {
        if (data) setDirectives(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [refreshTick]);

  useEffect(() => {
    const iv = setInterval(() => setRefreshTick((t) => t + 1), 15_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
        Directivas activas
      </span>
      {directives.length === 0 ? (
        <div className="text-[10px] text-slate-600">Sin directivas</div>
      ) : (
        <div className="flex flex-col gap-1">
          {directives.slice(0, 5).map((d) => (
            <div
              key={d.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold text-violet-300">@{d.floorId}</span>
                <span
                  className={`text-[9px] px-1 rounded-full ml-auto ${
                    d.status === "done"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-amber-900/40 text-amber-400"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{d.instruction}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RightColumn({ floors }: { floors: FloorConfig[] }) {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-l border-slate-800 overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400">Gestión</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5">
        <VisionEditor />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-2">
            Centros de costo
          </span>
          <div className="flex flex-col gap-1.5">
            {floors.map((f) => (
              <CostCenter key={f.id} floor={f} />
            ))}
          </div>
        </div>
        <DirectivesList />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function CLevelView() {
  const buildingConfig = useNavigationStore((s) => s.buildingConfig);
  const regularFloors = buildingConfig?.floors.filter((f) => !f.is_c_level) ?? [];

  return (
    <div className="flex h-full bg-slate-950 text-white overflow-hidden">
      <LeftColumn floors={regularFloors} />
      <ArquitectoColumn />
      <RightColumn floors={regularFloors} />
    </div>
  );
}
