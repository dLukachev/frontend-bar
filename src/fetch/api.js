// Базовый URL API
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Функция для создания заголовков запроса
const createHeaders = (initData, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': initData,
    ...customHeaders
  };
  return headers;
};

// Функция для обработки ответа
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export { API_URL, createHeaders, handleResponse }; 