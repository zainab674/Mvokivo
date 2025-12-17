import { getAccessToken } from '@/lib/auth';

export interface CsvFile {
  id: string;
  name: string;
  user_id: string;
  row_count: number;
  file_size?: number;
  uploaded_at: string;
  // created_at and uploaded_at might typically be the same or mapped
  created_at: string;
  updated_at: string;
}

export interface CsvFilesResponse {
  csvFiles: CsvFile[];
  total: number;
}

/**
 * Fetch CSV files for the current user via backend API
 */
export const fetchCsvFiles = async (): Promise<CsvFilesResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch('/api/v1/csv', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch CSV files');
    }

    const data = await response.json();
    return {
      csvFiles: data.csvFiles.map((f: any) => ({
        ...f,
        id: f._id || f.id,
        name: f.filename || f.name, // Mapping filename to name
        uploaded_at: f.created_at, // Mapping created_at to uploaded_at
      })),
      total: data.csvFiles.length
    };

  } catch (error) {
    console.error('Error fetching CSV files:', error);
    throw error;
  }
};
