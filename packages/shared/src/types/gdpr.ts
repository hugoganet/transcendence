export interface GdprExportResponse {
  message: string;
}

export interface GdprDeletionResponse {
  message: string;
}

export interface GdprExportData {
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    locale: string;
    ageConfirmed: boolean;
    createdAt: string;
  };
  progress: {
    missionsCompleted: number;
    chaptersCompleted: number;
    completionPercentage: number;
    missions: Array<{
      missionId: string;
      status: string;
      completedAt: string | null;
    }>;
  };
  tokens: {
    balance: number;
    transactions: Array<{
      amount: number;
      type: string;
      description: string;
      createdAt: string;
    }>;
  };
  achievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
  }>;
  friends: Array<{
    friendId: string;
    status: string;
    since: string;
  }>;
  notifications: Array<{
    type: string;
    title: string;
    body: string;
    createdAt: string;
  }>;
  exerciseAttempts: Array<{
    exerciseId: string;
    correct: boolean;
    createdAt: string;
  }>;
  selfAssessments: Array<{
    categoryId: string;
    confidenceRating: number;
    createdAt: string;
  }>;
  oauthAccounts: Array<{
    provider: string;
    createdAt: string;
  }>;
  certificate: {
    completionDate: string;
    curriculumTitle: string;
  } | null;
}
