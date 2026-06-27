import api from '../lib/axios';

export interface Project {
  id: string;
  name: string;
  industry: string;
  location: string;
  currency: string;
  targetCapital: number;
  durationYears: number;
  description: string;
  financialInputs?: Record<string, any>;
  aiOutput?: Record<string, any>;
  financialOutput?: Record<string, any>;
  isShared: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

/** Get list of projects */
export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get('/projects');
  return res.data.data;
};

/** Get a single project by ID */
export const getProject = async (id: string): Promise<Project> => {
  const res = await api.get(`/projects/${id}`);
  return res.data.data;
};

/** Create a new project */
export const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'isShared'>): Promise<Project> => {
  const res = await api.post('/projects', data);
  return res.data.data;
};

/** Update an existing project */
export const updateProject = async (id: string, data: Partial<Omit<Project, 'id'>>): Promise<Project> => {
  const res = await api.patch(`/projects/${id}`, data);
  return res.data.data;
};

/** Delete a project */
export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};
