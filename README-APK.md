# Generar APK de la aplicación

## Opción 1: Usando EAS Build (Recomendado)

### 1. Instalar EAS CLI
```bash
npm install -g eas-cli
```

### 2. Iniciar sesión en Expo
```bash
eas login
```

### 3. Configurar el proyecto
```bash
eas build:configure
```

### 4. Generar APK de producción
```bash
eas build --platform android --profile production
```

Esto generará un APK que usa automáticamente la URL de producción: `https://details-mobile-back.onrender.com`

### 5. Descargar la APK
- EAS Build te dará un enlace para descargar la APK cuando termine
- También puedes ver el estado en: https://expo.dev/accounts/[tu-usuario]/builds

## Opción 2: Build local (más rápido para pruebas)

### Requisitos previos
- Android Studio instalado
- Android SDK configurado
- Variables de entorno de Android configuradas

### Generar APK localmente
```bash
# Instalar dependencias
npm install

# Generar APK
npx expo prebuild
npx expo run:android --variant release
```

El APK se generará en: `android/app/build/outputs/apk/release/app-release.apk`

## Opción 3: Expo Go (solo para desarrollo)

Para probar rápidamente sin generar APK:
```bash
expo start
```

Luego escanea el código QR con la app Expo Go desde tu teléfono.

**Nota**: Expo Go no funcionará en producción porque necesita la URL de producción configurada.

## Configuración de API

La aplicación está configurada para:
- **Desarrollo**: Usa `http://localhost:3000` cuando `__DEV__` es `true`
- **Producción**: Usa `https://details-mobile-back.onrender.com` en builds de producción

Si necesitas cambiar la URL de producción, edita:
- `constants/api.ts` - Cambia `PRODUCTION_API_URL`
- `eas.json` - Cambia `EXPO_PUBLIC_API_URL` en el perfil de producción

## Verificar que funciona

Antes de generar la APK, verifica que el backend esté funcionando:
1. Abre: https://details-mobile-back.onrender.com/clients
2. Debe responder con un JSON (aunque esté vacío)

Si hay errores, revisa los logs del backend en Render.

