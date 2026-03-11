import { prisma } from "../config/database.js";
import { redisClient } from "../config/redis.js";
import { AppError } from "../utils/AppError.js";
import type { FriendListEntry, FriendRequestEntry, FriendshipResponse } from "@transcendence/shared";

interface FriendshipRecord {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "PENDING" | "ACCEPTED";
  createdAt: Date;
  updatedAt: Date;
}

function serializeFriendship(friendship: FriendshipRecord): FriendshipResponse {
  return {
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
    createdAt: friendship.createdAt.toISOString(),
    updatedAt: friendship.updatedAt.toISOString(),
  };
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string,
): Promise<FriendshipResponse> {
  if (requesterId === addresseeId) {
    throw new AppError(400, "CANNOT_FRIEND_SELF", "You cannot send a friend request to yourself");
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });
  if (existing) {
    throw new AppError(409, "FRIENDSHIP_ALREADY_EXISTS", "Friendship already exists");
  }

  try {
    const friendship = await prisma.friendship.create({
      data: { requesterId, addresseeId },
    });

    // Post-create race check: verify no reverse record was created concurrently
    const reverseExists = await prisma.friendship.findFirst({
      where: { requesterId: addresseeId, addresseeId: requesterId },
    });
    if (reverseExists) {
      // Race condition: both A→B and B→A were created. Remove ours, keep the earlier one.
      await prisma.friendship.delete({ where: { id: friendship.id } });
      throw new AppError(409, "FRIENDSHIP_ALREADY_EXISTS", "Friendship already exists");
    }

    return serializeFriendship(friendship);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new AppError(409, "FRIENDSHIP_ALREADY_EXISTS", "Friendship already exists");
    }
    throw err;
  }
}

export async function acceptFriendRequest(
  addresseeId: string,
  requesterId: string,
): Promise<FriendshipResponse> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      requesterId,
      addresseeId,
      status: "PENDING",
    },
  });

  if (!friendship) {
    throw new AppError(404, "FRIEND_REQUEST_NOT_FOUND", "Friend request not found");
  }

  const updated = await prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED" },
  });

  return serializeFriendship(updated);
}

export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<void> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
    },
  });

  if (!friendship) {
    throw new AppError(404, "FRIENDSHIP_NOT_FOUND", "Friendship not found");
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
}

async function getOnlineUserIds(): Promise<Set<string>> {
  try {
    const members = await redisClient.smembers("online-users");
    return new Set(members);
  } catch {
    return new Set();
  }
}

export async function getFriends(userId: string): Promise<FriendListEntry[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    include: {
      requester: { select: { id: true, displayName: true, avatarUrl: true } },
      addressee: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  const onlineUserIds = await getOnlineUserIds();

  return friendships.map((f) => {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    return {
      id: friend.id,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      online: onlineUserIds.has(friend.id),
    };
  });
}

export async function getPendingRequests(userId: string): Promise<FriendRequestEntry[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: "PENDING",
    },
    include: {
      requester: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  return friendships.map((f) => ({
    id: f.requester.id,
    displayName: f.requester.displayName,
    avatarUrl: f.requester.avatarUrl,
    createdAt: f.createdAt.toISOString(),
  }));
}
