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

/** Runnable starter scaffold the host seeds into an empty room (each has an
 *  entry point that prints, so "Run" produces output immediately). */
export const STARTER_TEMPLATES: Record<RoomLanguage, string> = {
  javascript: `// Two Sum — return indices of the two numbers that add up to target.
function twoSum(nums, target) {
  // your solution here
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
  python: `# Two Sum — return indices of the two numbers that add up to target.
def two_sum(nums, target):
    # your solution here
    return []


print(two_sum([2, 7, 11, 15], 9))
`,
  java: `import java.util.*;

public class Main {
    // Two Sum — return indices of the two numbers that add up to target.
    static int[] twoSum(int[] nums, int target) {
        // your solution here
        return new int[] {};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

// Two Sum — return indices of the two numbers that add up to target.
vector<int> twoSum(vector<int>& nums, int target) {
    // your solution here
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "[";
    for (size_t i = 0; i < res.size(); i++) cout << res[i] << (i + 1 < res.size() ? "," : "");
    cout << "]" << endl;
    return 0;
}
`,
  go: `package main

import "fmt"

// twoSum returns indices of the two numbers that add up to target.
func twoSum(nums []int, target int) []int {
	// your solution here
	return nil
}

func main() {
	fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
`,
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
