'use client';

import type {
  ActivityEventDto,
  ChatMessageDto,
  CodeSnapshotListItemDto,
  CreateRoomInput,
  Paginated,
  RoomDetailDto,
  RoomDto,
  RoomLanguage,
} from '@ai-interview/types';
import { api } from './api';

export const LANGUAGE_LABELS: Record<RoomLanguage, string> = {
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  go: 'Go',
};

/** Monaco language id per room language (mostly 1:1). */
export const MONACO_LANGUAGE: Record<RoomLanguage, string> = {
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  go: 'go',
};

/** Minimal starter scaffold the host seeds into an empty room. */
export const STARTER_TEMPLATES: Record<RoomLanguage, string> = {
  javascript: `// Two Sum — return indices of the two numbers that add up to target.\nfunction twoSum(nums, target) {\n  // your solution here\n}\n`,
  python: `# Two Sum — return indices of the two numbers that add up to target.\ndef two_sum(nums, target):\n    # your solution here\n    pass\n`,
  java: `import java.util.*;\n\nclass Solution {\n    // Two Sum — return indices of the two numbers that add up to target.\n    int[] twoSum(int[] nums, int target) {\n        // your solution here\n        return new int[]{};\n    }\n}\n`,
  cpp: `#include <vector>\nusing namespace std;\n\n// Two Sum — return indices of the two numbers that add up to target.\nvector<int> twoSum(vector<int>& nums, int target) {\n    // your solution here\n    return {};\n}\n`,
  go: `package main\n\n// twoSum returns indices of the two numbers that add up to target.\nfunc twoSum(nums []int, target int) []int {\n\t// your solution here\n\treturn nil\n}\n`,
};

export function createRoom(input: CreateRoomInput): Promise<RoomDto> {
  return api<RoomDto>('/rooms', { method: 'POST', body: input });
}

export function listRooms(page = 1, limit = 20): Promise<Paginated<RoomDto>> {
  return api<Paginated<RoomDto>>(`/rooms?page=${page}&limit=${limit}`);
}

export function getRoom(id: string): Promise<RoomDetailDto> {
  return api<RoomDetailDto>(`/rooms/${id}`);
}

export function joinRoom(code: string): Promise<RoomDto> {
  return api<RoomDto>(`/rooms/join/${encodeURIComponent(code)}`, { method: 'POST' });
}

export function endRoom(id: string): Promise<RoomDto> {
  return api<RoomDto>(`/rooms/${id}/end`, { method: 'POST' });
}

export function deleteRoom(id: string): Promise<{ deleted: boolean }> {
  return api<{ deleted: boolean }>(`/rooms/${id}`, { method: 'DELETE' });
}

export function listSnapshots(id: string, page = 1, limit = 50): Promise<Paginated<CodeSnapshotListItemDto>> {
  return api<Paginated<CodeSnapshotListItemDto>>(`/rooms/${id}/snapshots?page=${page}&limit=${limit}`);
}

export function listActivity(id: string, page = 1, limit = 50): Promise<Paginated<ActivityEventDto>> {
  return api<Paginated<ActivityEventDto>>(`/rooms/${id}/activity?page=${page}&limit=${limit}`);
}

export function listMessages(id: string, page = 1, limit = 100): Promise<Paginated<ChatMessageDto>> {
  return api<Paginated<ChatMessageDto>>(`/rooms/${id}/messages?page=${page}&limit=${limit}`);
}
