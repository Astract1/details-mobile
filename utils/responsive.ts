import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isWeb = Platform.OS === 'web';
export const isMobile = !isWeb;
export const isTablet = width >= 768 && width < 1024;

// Breakpoints
export const BREAKPOINTS = {
  small: 375,
  medium: 768,
  large: 1024,
  xlarge: 1440,
};

// Responsive sizing functions
export const wp = (percentage: number) => {
  return (width * percentage) / 100;
};

export const hp = (percentage: number) => {
  return (height * percentage) / 100;
};

// Responsive padding/margin
export const getResponsivePadding = () => {
  if (isWeb) {
    if (width >= BREAKPOINTS.large) {
      return { horizontal: 40, vertical: 20 };
    }
    if (width >= BREAKPOINTS.medium) {
      return { horizontal: 32, vertical: 20 };
    }
    return { horizontal: 24, vertical: 16 };
  }
  return { horizontal: 16, vertical: 12 };
};

// Responsive card width
export const getCardWidth = () => {
  if (isWeb) {
    if (width >= BREAKPOINTS.xlarge) {
      return 600;
    }
    if (width >= BREAKPOINTS.large) {
      return 500;
    }
    return '100%';
  }
  return '100%';
};

// Responsive font sizes
export const getFontSize = (base: number) => {
  if (isWeb && width >= BREAKPOINTS.large) {
    return base * 1.2;
  }
  return base;
};
