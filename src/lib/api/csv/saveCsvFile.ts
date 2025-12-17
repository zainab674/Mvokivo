import { getAccessToken } from '@/lib/auth';

export interface SaveCsvFileRequest {
  name: string;
  rowCount: number;
  fileSize?: number;
  userId: string;
}

export interface SaveCsvFileResponse {
  success: boolean;
  csvFileId?: string;
  error?: string;
}

/**
 * Save CSV file metadata to database via backend API
 */
export const saveCsvFile = async (data: SaveCsvFileRequest): Promise<SaveCsvFileResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch('/api/v1/csv', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        rowCount: data.rowCount,
        fileSize: data.fileSize
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to save CSV file' };
    }

    const result = await response.json();
    return {
      success: true,
      csvFileId: result.csvFile.id || result.csvFile._id
    };

  } catch (error) {
    console.error('Error saving CSV file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
