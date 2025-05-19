import { API_URL, createHeaders, handleResponse } from './api';

/**
 * Выполняет GET запрос к API
 * @param {string} endpoint - конечная точка API
 * @param {string} initData - initData от Telegram WebApp
 * @param {Object} [params={}] - параметры запроса (будут добавлены к URL)
 * @param {Object} [headers={}] - дополнительные заголовки
 * @returns {Promise<any>} - результат запроса
 */
export const get = async (endpoint, initData, params = {}, headers = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders(initData, headers)
  });

  return handleResponse(response);
}; 