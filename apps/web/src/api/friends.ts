import type {
  FriendListEntry,
  FriendRequestEntry,
  FriendshipResponse,
} from "@transcendence/shared";
import { api } from "./client.js";

export const friendsApi = {
  getFriends: () => api.get<FriendListEntry[]>("/api/v1/friends"),

  getPendingRequests: () =>
    api.get<FriendRequestEntry[]>("/api/v1/friends/requests"),

  sendRequest: (userId: string) =>
    api.post<FriendshipResponse>(`/api/v1/friends/${userId}`),

  acceptRequest: (userId: string) =>
    api.post<FriendshipResponse>(`/api/v1/friends/${userId}/accept`),

  removeFriend: (userId: string) =>
    api.delete<undefined>(`/api/v1/friends/${userId}`),
};
