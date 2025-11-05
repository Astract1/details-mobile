import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveValues {
  isMobile: boolean;
  isTablet: boolean;
  isWeb: boolean;
  width: number;
  height: number;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
}

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState(() => {
    if (Platform.OS === 'web') {
      // En web, usar las dimensiones del viewport
      return {
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
      };
    }
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: ScaledSize }) => {
        setDimensions({ width: window.width, height: window.height });
      }
    );

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === 'web';
  const isTablet = width >= 768 && width < 1024;
  const isMobile = !isWeb && !isTablet;
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  return {
    isMobile,
    isTablet,
    isWeb,
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
  };
}
