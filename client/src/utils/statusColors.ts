import type { ReactNode } from "react";

export interface StatusStyle {
  color: string;
  colorDim: string;
  bg: string;
  border: string;
  label: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
  pending: {
    color: "text-amber-400",
    colorDim: "text-amber-400/80",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "En attente",
  },
  late: {
    color: "text-orange-400",
    colorDim: "text-orange-400/80",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: "En retard",
  },
  refused: {
    color: "text-red-400",
    colorDim: "text-red-400/80",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Refusé",
  },
  accepted: {
    color: "text-emerald-400",
    colorDim: "text-emerald-400/80",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Accepté",
  },
  disputed: {
    color: "text-purple-400",
    colorDim: "text-purple-400/80",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    label: "Litige",
  },
  paid: {
    color: "text-blue-400",
    colorDim: "text-blue-400/80",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Payé",
  },
  completed: {
    color: "text-emerald-400",
    colorDim: "text-emerald-400/80",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Complété",
  },
  in_progress: {
    color: "text-sky-400",
    colorDim: "text-sky-400/80",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    label: "En cours",
  },
  resent: {
    color: "text-cyan-400",
    colorDim: "text-cyan-400/80",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    label: "Renvoyé",
  },
};

const BORDER_HEX: Record<string, string> = {
  pending: "#f59e0b",
  late: "#f97316",
  refused: "#ef4444",
  accepted: "#10b981",
  disputed: "#a855f7",
  paid: "#3b82f6",
  completed: "#22c55e",
  in_progress: "#38bdf8",
  resent: "#22d3ee",
};

const BORDER_LEFT: Record<string, string> = {
  pending: "border-l-amber-500",
  late: "border-l-orange-500",
  refused: "border-l-red-500",
  accepted: "border-l-emerald-500",
  disputed: "border-l-purple-500",
  paid: "border-l-blue-500",
  completed: "border-l-green-500",
  in_progress: "border-l-blue-400",
  resent: "border-l-cyan-400",
};

const DOT_COLOR: Record<string, string> = {
  pending: "bg-amber-400",
  late: "bg-orange-400",
  refused: "bg-red-400",
  accepted: "bg-emerald-400",
  disputed: "bg-purple-400",
  paid: "bg-blue-400",
  completed: "bg-emerald-400",
  in_progress: "bg-sky-400",
  resent: "bg-cyan-400",
};

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_MAP[status] ?? STATUS_MAP.pending;
}

export function getStatusBorderHex(status: string): string {
  return BORDER_HEX[status] ?? "#6b7280";
}

export function getStatusBorderLeft(status: string): string {
  return BORDER_LEFT[status] ?? "";
}

export function getStatusDot(status: string): string {
  return DOT_COLOR[status] ?? "bg-gray-400";
}

export function getStatusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}

export function getStatusPill(status: string): string {
  const s = getStatusStyle(status);
  return `${s.bg} ${s.color} border ${s.border}`;
}
