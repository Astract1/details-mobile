// Configuración de la API
// En desarrollo: usa localhost para web, IP local para móvil
// En producción: usa la URL de tu backend en Render

// URL de producción (backend en Render)
const PRODUCTION_API_URL = 'https://details-mobile-back.onrender.com';

// URL de desarrollo
// Para web: localhost
// Para móvil: IP local de tu PC (cambia esta IP si es diferente)
const DEVELOPMENT_API_URL_WEB = 'http://localhost:3000';
const DEVELOPMENT_API_URL_MOBILE = 'http://192.168.1.14:3000';

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

// Función para detectar si estamos en un dispositivo móvil
const isMobileDevice = () => {
  // En React Native/Expo, si no estamos en web, estamos en móvil
  // Verificar si estamos en un entorno React Native (no web)
  if (typeof window === 'undefined') {
    // En React Native, window es undefined
    return true;
  }
  
  // Si estamos en web, verificar user agent
  if (typeof navigator !== 'undefined') {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Si es móvil pero estamos en localhost, probablemente es un emulador/simulador
    // En ese caso, también usar IP local
    if (isMobileUA || window.location.hostname !== 'localhost') {
      return true;
    }
  }
  
  return false;
};

// Usa la variable de entorno si está disponible, sino usa localhost en desarrollo
export const getApiUrl = () => {
  // Variable de entorno para producción (configurada en build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // En desarrollo, usar IP local para móvil, localhost para web
  if (isDevelopment()) {
    // Si estamos en un dispositivo móvil, usar la IP local
    if (isMobileDevice()) {
      return DEVELOPMENT_API_URL_MOBILE;
    }
    // Si estamos en web, usar localhost
    return DEVELOPMENT_API_URL_WEB;
  }
  
  // URL de producción en Render
  return PRODUCTION_API_URL;
};

