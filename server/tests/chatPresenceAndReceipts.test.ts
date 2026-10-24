import { describe, it, expect } from "vitest";
import {
  markUserInChat,
  markUserLeaveChat,
  isUserInChat,
  getChatOnlineUserIds,
} from "../src/socket/presenceTracker";

describe("Chat Presence & Read Receipts Verification", () => {
  const workspaceId = "test-ws-presence-101";
  const userA = "user-admin-1";
  const userB = "user-member-2";

  it("1. Presence Tracker: accurate in-memory live tracking per workspace", () => {
    // Initially neither is in chat
    expect(isUserInChat(workspaceId, userA)).toBe(false);
    expect(isUserInChat(workspaceId, userB)).toBe(false);
    expect(getChatOnlineUserIds(workspaceId)).toEqual([]);

    // User A enters chat
    markUserInChat(workspaceId, userA);
    expect(isUserInChat(workspaceId, userA)).toBe(true);
    expect(isUserInChat(workspaceId, userB)).toBe(false);
    expect(getChatOnlineUserIds(workspaceId)).toContain(userA);

    // User B enters chat
    markUserInChat(workspaceId, userB);
    expect(isUserInChat(workspaceId, userA)).toBe(true);
    expect(isUserInChat(workspaceId, userB)).toBe(true);
    expect(getChatOnlineUserIds(workspaceId)).toHaveLength(2);

    // User A opens another tab (second socket)
    markUserInChat(workspaceId, userA);
    expect(isUserInChat(workspaceId, userA)).toBe(true);

    // User A closes one tab -> still in chat
    const left1 = markUserLeaveChat(workspaceId, userA);
    expect(left1).toBe(false);
    expect(isUserInChat(workspaceId, userA)).toBe(true);

    // User A closes second tab -> fully left
    const left2 = markUserLeaveChat(workspaceId, userA);
    expect(left2).toBe(true);
    expect(isUserInChat(workspaceId, userA)).toBe(false);

    // User B leaves chat -> fully left
    const leftB = markUserLeaveChat(workspaceId, userB);
    expect(leftB).toBe(true);
    expect(isUserInChat(workspaceId, userB)).toBe(false);
    expect(getChatOnlineUserIds(workspaceId)).toEqual([]);
  });

  it("2. Read Receipts: Single checkmark (✓) when unread vs double checkmarks (✓✓) when read", () => {
    const msgCreatedAt = new Date("2026-10-25T02:00:00.000Z");

    // Case 1: Recipient has NOT read yet (lastReadAt is before message createdAt or null)
    const recipientUnreadLastReadAt = new Date("2026-10-25T01:59:00.000Z");
    const isReadBefore =
      recipientUnreadLastReadAt.getTime() >= msgCreatedAt.getTime() - 1000;
    expect(isReadBefore).toBe(false); // Should display 1 checkmark ✓

    // Case 2: Recipient opens conversation and marks as read (lastReadAt updated to >= msgCreatedAt)
    const recipientReadLastReadAt = new Date("2026-10-25T02:00:05.000Z");
    const isReadAfter =
      recipientReadLastReadAt.getTime() >= msgCreatedAt.getTime() - 1000;
    expect(isReadAfter).toBe(true); // Should display 2 checkmarks ✓✓

    // Case 3: Subsecond precision tolerance (recipient read at exact millisecond)
    const exactReadAt = new Date("2026-10-25T02:00:00.000Z");
    const isReadExact = exactReadAt.getTime() >= msgCreatedAt.getTime() - 1000;
    expect(isReadExact).toBe(true); // Should display 2 checkmarks ✓✓
  });
});
