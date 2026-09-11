/**
 * Cấu hình địa chỉ máy chủ API CloudVault
 * Tự động nhận diện và chuyển đổi giữa:
 * 1. Môi trường Máy chủ Thật (Production / Render): PRODUCTION_API_URL hoặc VITE_API_URL
 * 2. Ứng dụng Di Động Android (Capacitor Mobile App)
 * 3. Môi trường Phát triển Cục bộ (Localhost)
 */

// Lấy địa chỉ API máy chủ từ biến môi trường (Ví dụ: https://cloudvault-2026.onrender.com)
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.PRODUCTION_API_URL || 
  ''
).replace(/\/+$/, '');

/**
 * Trả về đường dẫn API hoàn chỉnh
 * @param {string} endpoint - Đường dẫn tương đối (Ví dụ: '/api/media')
 * @returns {string} - Đường dẫn URL tuyệt đối hoặc tương đối phù hợp
 */
export function getApiUrl(endpoint = '') {
  if (!endpoint) return API_BASE_URL || '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Hàm gọi API chuẩn hóa cho toàn bộ Frontend:
 * Tự động gắn tiền tố API_BASE_URL và cấu hình credentials: 'include'
 * để duy trì phiên làm việc (Session Cookie) trên cả Web và Android App
 * 
 * @param {string} endpoint - Đường dẫn API
 * @param {RequestInit} options - Tùy chọn fetch
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const defaultOptions = {
    credentials: 'include', // Bắt buộc để gửi cookie phiên làm việc
    ...options,
    headers: {
      ...(options.headers || {})
    }
  };
  return fetch(url, defaultOptions);
}

export default {
  API_BASE_URL,
  getApiUrl,
  apiFetch
};
