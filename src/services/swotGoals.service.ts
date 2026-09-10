import apiClient from "@/lib/axios"

export interface SwotCustomGoal {
  id: string
  swotAnalysisId: string
  goalText: string
  linkedStrengths: string[]
  linkedWeaknesses: string[]
  linkedOpportunities: string[]
  linkedThreats: string[]
  createdAt: string
}

export type SaveSwotCustomGoalPayload = Omit<SwotCustomGoal, "id" | "swotAnalysisId" | "createdAt">

export const listSwotGoals = async (swotAnalysisId: string): Promise<SwotCustomGoal[]> => {
  const { data } = await apiClient.get(`/swot-goals/${swotAnalysisId}`)
  return data.goals ?? []
}

export const createSwotGoal = async (
  swotAnalysisId: string,
  payload: SaveSwotCustomGoalPayload
): Promise<SwotCustomGoal> => {
  const { data } = await apiClient.post(`/swot-goals/${swotAnalysisId}`, payload)
  return data.goal
}

export const updateSwotGoal = async (
  id: string,
  payload: SaveSwotCustomGoalPayload
): Promise<SwotCustomGoal> => {
  const { data } = await apiClient.put(`/swot-goals/${id}`, payload)
  return data.goal
}

export const deleteSwotGoal = async (id: string): Promise<void> => {
  await apiClient.delete(`/swot-goals/${id}`)
}
