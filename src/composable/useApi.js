import axios from 'axios';
import { ref } from 'vue';

const instance = axios.create({
  baseURL: 'http://api.openweathermap.org',
});

/**
 *
 * @param {https://axios-http.com/docs/req_config} requestConfig
 */
export default function useApi() {
  const isLoading = ref(false);
  const data = ref(null);
  const error = ref(null);

  const execute = async (requestConfig) => {
    isLoading.value = true;
    error.value = null;

    const param = {
      appid: '9a4a20244478df4c646c687aa6a4a800',
    };

    requestConfig.params = Object.assign(param, requestConfig.params);

    try {
      const response = await instance.request(requestConfig);
      data.value = response.data;

      return response;
    } catch (e) {
      error.value = e;
      data.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    data,
    error,
    execute,
  };
}
