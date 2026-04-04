/**
 * @file Message Service — sends and retrieves direct messages between users.
 * FR: Service de messagerie — envoie et recupere les messages directs entre utilisateurs.
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

