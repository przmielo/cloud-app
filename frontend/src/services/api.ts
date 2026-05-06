import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export interface LoanApplicationCreateDto {
  age: number;
  educationLevel: string;
  maritalStatus: string;
  dependents: number;
  employmentType: string;
  employmentYears: number;
  monthlyIncome: number;
  existingMonthlyDebt: number;
  loanAmount: number;
  loanTermMonths: number;
  loanPurpose: string;
  propertyValue: number;
  hasCreditHistory: boolean;
  pastDelays: number;
}

export interface CreditDecisionDto {
  score: number;
  dstI: number;
  monthlyInstalment: number;
  outcome: 'approve' | 'manual' | 'reject';
  reason: string;
  decidedAt: string;
}

export interface LoanApplicationReadDto {
  id: number;
  createdAt: string;
  age: number;
  educationLevel: string;
  maritalStatus: string;
  dependents: number;
  employmentType: string;
  employmentYears: number;
  monthlyIncome: number;
  existingMonthlyDebt: number;
  loanAmount: number;
  loanTermMonths: number;
  loanPurpose: string;
  propertyValue: number;
  hasCreditHistory: boolean;
  pastDelays: number;
  decision: CreditDecisionDto | null;
}

export const loanApi = {
  getAll: () => api.get<LoanApplicationReadDto[]>('/api/loanapplication'),
  getById: (id: number) => api.get<LoanApplicationReadDto>(`/api/loanapplication/${id}`),
  submit: (dto: LoanApplicationCreateDto) =>
    api.post<LoanApplicationReadDto>('/api/loanapplication', dto),
};

export default api;
