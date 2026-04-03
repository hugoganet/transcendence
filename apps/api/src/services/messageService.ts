/**
 * @module services/messageService
 * @description Chat messaging: sends messages between users and retrieves
 * conversation history ordered by creation time.
 */

import { prisma } from "../config/database.js";

export async function sendMessage(senderId: string, receiverId: string, content: string){
    return await prisma.message.create({
        data: { senderId, receiverId, content},
    });
}

export async function getConversation(userId: string, otherId: string){
    return await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId,  receiverId: otherId },
                { senderId: otherId, receiverId: userId  },
            ],
        },
        orderBy: { createdAt: "asc" },
    });
}

