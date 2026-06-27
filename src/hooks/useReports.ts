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
  return useQuery<Report[], Error>(['reports'], listReports, {
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};

/** Generate a new report */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation(generateReport, {
    onSuccess: (data) => {
      toast.success('تم إنشاء التقرير');
      // Optionally invalidate the list to include the new report
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};

/** Download a report file */
export const useDownloadReport = () => {
  return useMutation(downloadReport, {
    onSuccess: (blob) => {
      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf'; // you may customize filename
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل التقرير');
    },
    onError: (error) => {
      toast.error(mapError(error));
    },
  });
};
