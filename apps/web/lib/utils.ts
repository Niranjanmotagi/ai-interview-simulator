import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatScore(score: number | null | undefined): string {
  return score == null ? '—' : score.toFixed(1);
}

export const ROUND_TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  technical: 'Technical',
  system_design: 'System Design',
  hr: 'HR',
  mixed: 'Mixed',
  followup: 'Follow-up',
};

export const WEAKNESS_TAG_LABELS: Record<string, string> = {
  no_structure: 'No STAR structure',
  vague_metrics: 'Missing metrics',
  too_short: 'Too brief',
  too_long: 'Rambling',
  off_topic: 'Off-topic',
  shallow_technical: 'Shallow technical depth',
  weak_ownership: 'Weak ownership',
  poor_communication: 'Unclear communication',
};

export function weaknessLabel(tag: string): string {
  return WEAKNESS_TAG_LABELS[tag] ?? tag.replace(/_/g, ' ');
}
