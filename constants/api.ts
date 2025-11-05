// Configuración de la API
// En desarrollo: usa localhost
// En producción: usa la URL de tu backend en Render

// URL de producción (backend en Render)
const PRODUCTION_API_URL = 'https://details-mobile-back.onrender.com';

// URL de desarrollo (localhost)
const DEVELOPMENT_API_URL = 'http://localhost:3000';

// Función para detectar si estamos en desarrollo
const isDevelopment = () => {
  // En Expo, __DEV__ está disponible
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  
  // Si no está disponible, verificar si es localhost
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  
  // Por defecto, asumir producción
  return false;
};

// Usa la variable de entorno si está disponible, sino usa localhost en desarrollo
export const getApiUrl = () => {
  // Variable de entorno para producción (configurada en build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // En desarrollo, usa localhost
  if (isDevelopment()) {
    return DEVELOPMENT_API_URL;
  }
  
  // URL de producción en Render
  return PRODUCTION_API_URL;
};

