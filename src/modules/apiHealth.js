import axios from 'axios';
import { ref } from 'vue';

export const useApiHealth = () => {
  const apiStatus = ref('pending'); // pending, ok, error
  const apiStatusMessage = ref('');
  const apiReady = ref(false);

  const checkApiHealth = async () => {
    try {
      const healthCheckUrl = `${import.meta.env.VITE_API_URL}/health`;
      console.log('Checking API health at:', healthCheckUrl);
      
      const response = await axios.get(healthCheckUrl);
      
      if (response.status === 200 && response.data.status === 'ok') {
        apiStatus.value = 'ok';
        apiStatusMessage.value = 'API is operational';
        apiReady.value = true;
        console.log('Health API check successful:', response.data);
      } else {
        apiStatus.value = 'error';
        apiStatusMessage.value = 'API returned unexpected response';
        apiReady.value = false;
        console.warn('Health API returned unexpected status:', response.data);
      }
    } catch (error) {
      apiStatus.value = 'error';
      apiStatusMessage.value = error.message || 'Unable to connect to API';
      apiReady.value = false;
      console.error('Health API check failed:', error);
    }

    return { apiStatus: apiStatus.value, apiReady: apiReady.value };
  };

  return {
    apiStatus,
    apiStatusMessage,
    apiReady,
    checkApiHealth
  };
};
