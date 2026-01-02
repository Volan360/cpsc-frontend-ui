export interface CreateInstitutionRequest {
  institutionName: string;
  startingBalance: number;
}

export interface EditInstitutionRequest {
  institutionName?: string;
  startingBalance?: number;
}

export interface InstitutionResponse {
  institutionId: string;
  institutionName: string;
  startingBalance: number;
  currentBalance: number;
  createdAt: number;
  userId: string;
}

export interface GetInstitutionsResponse {
  institutions: InstitutionResponse[];
  nextToken?: string;
}
