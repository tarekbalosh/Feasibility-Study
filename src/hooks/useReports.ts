import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast'; // adjust if using another toast lib
import {
  generateReport,
  listReports,
  downloadReport,
  Report,
} from '../services/reports.service';
import { mapError } from '../utils/errorMessages';

/** Fetch list of reports */
export const useReports = () => {
  return useQuery<Report[], any>({
    queryKey: ['reports'],
    queryFn: listReports,

  });
};

/** Generate a new report */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      toast.success('تم إنشاء التقرير');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      toast.error(mapError(error));
    },
  });
};

/** Download a report file */
export const useDownloadReport = () => {
  return useMutation({
    mutationFn: downloadReport,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل التقرير');
    },
    onError: (error: any) => {
      toast.error(mapError(error));
    },
  });
};
