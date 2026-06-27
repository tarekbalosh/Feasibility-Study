import api from '../lib/axios';

export interface Report {
  id: string;
  title: string;
  createdAt: string;
  // add other fields as needed
}

/** Generate a new report */
export const generateReport = async (payload: any): Promise<Report> => {
  const res = await api.post<Report>('/reports/generate', payload);
  return res.data;
};

/** List all reports */
export const listReports = async (): Promise<Report[]> => {
  const res = await api.get<Report[]>('/reports');
  return res.data;
};

/** Download a report file (returns Blob) */
export const downloadReport = async (id: string): Promise<Blob> => {
  const res = await api.get<Blob>(`/reports/${id}/download`, { responseType: 'blob' });
  return res.data;
};
