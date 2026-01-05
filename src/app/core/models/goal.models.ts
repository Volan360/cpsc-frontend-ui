export interface CreateGoalRequest {
  name: string;
  description?: string;
  targetAmount?: number;
  linkedInstitutions?: { [key: string]: number };
}

export interface EditGoalRequest {
  name?: string;
  description?: string;
  targetAmount?: number;
  linkedInstitutions?: { [key: string]: number };
}

export interface GoalResponse {
  goalId: string;
  name: string;
  description?: string;
  targetAmount?: number;
  linkedInstitutions?: { [key: string]: number };
  isCompleted?: boolean;
  createdAt: number;
  userId: string;
}

export interface GetGoalsResponse {
  goals: GoalResponse[];
  nextToken?: string;
}
