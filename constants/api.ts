// Configuración de la API
// En desarrollo: usa localhost
// En producción: usa la URL de tu backend en Render

// Usa la variable de entorno si está disponible, sino usa localhost en desarrollo
export const getApiUrl = () => {
  // Variable de entorno para producción (configurada en Render)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // En desarrollo, usa localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  
  // URL de producción en Render
  return 'https://details-mobile-back.onrender.com';
};

