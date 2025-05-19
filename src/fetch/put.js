import { API_URL, createHeaders, handleResponse } from './api';

/**
 * Выполняет PUT запрос к API
 * @param {string} endpoint - конечная точка API
 * @param {string} initData - initData от Telegram WebApp
 * @param {Object} [data={}] - данные для отправки
 * @param {Object} [headers={}] - дополнительные заголовки
 * @returns {Promise<any>} - результат запроса
 */
export const put = async (endpoint, initData, data = {}, headers = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: createHeaders(initData, headers),
    body: JSON.stringify(data)
  });

  return handleResponse(response);
}; 