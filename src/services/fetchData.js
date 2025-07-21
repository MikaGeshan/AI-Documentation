import axios from 'axios';
import { API_URL } from '@env';

export const checkConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/up`);
    console.log('Checking:', `${API_URL}/up`);
    console.log('Connected to API:', response.status);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API connection failed:', error.message);
    return { success: false, error };
  }
};
