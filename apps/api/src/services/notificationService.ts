import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import type { IO } from "../socket/index.js";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: unknown,
) {
  return prisma.notification.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { userId, type, title, body, data: (data ?? null) as any },
  });
}

export async function createAndPushNotification(
  io: IO,
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: unknown,
) {
  const notification = await createNotification(userId, type, title, body, data);
  io.to(`user:${userId}`).emit("notification:push", {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
  });
  return notification;
}

export async function getNotifications(
  userId: string,
  page: number,
  pageSize: number,
) {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        read: true,
        data: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    meta: { page, pageSize, total },
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    throw AppError.notFound("Notification not found");
  }
  if (notification.read) {
    return notification;
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      data: true,
    },
  });
}
