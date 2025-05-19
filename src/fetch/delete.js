import { API_URL, createHeaders, handleResponse } from './api';

/**
 * Выполняет DELETE запрос к API
 * @param {string} endpoint - конечная точка API
 * @param {string} initData - initData от Telegram WebApp
 * @param {Object} [data={}] - данные для отправки (опционально)
 * @param {Object} [headers={}] - дополнительные заголовки
 * @returns {Promise<any>} - результат запроса
 */
export const del = async (endpoint, initData, data = {}, headers = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: createHeaders(initData, headers),
    ...(Object.keys(data).length > 0 && { body: JSON.stringify(data) })
  });

  return handleResponse(response);
}; 