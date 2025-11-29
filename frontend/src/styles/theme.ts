export const theme = {
  colors: {
    // Primary hospital brand colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Medical theme colors
    medical: {
      mint: '#10f2c8',
      teal: '#14b8a6',
      emerald: '#10b981',
      green: '#22c55e',
      lime: '#84cc16',
      cyan: '#06b6d4',
    },
    
    // Alert and status colors
    status: {
      success: '#10b981',
      warning: '#f59e0b', 
      danger: '#ef4444',
      info: '#3b82f6',
      critical: '#dc2626',
    },
    
    // Gradient backgrounds
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      medical: 'linear-gradient(135deg, #10f2c8 0%, #14b8a6 100%)',
      warm: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      cool: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      ocean: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
      forest: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    },
    
    // Neutral colors for backgrounds and text
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    }
  },
  
  // Shadow system
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glow: '0 0 20px rgb(59 130 246 / 0.5)',
    'glow-lg': '0 0 40px rgb(59 130 246 / 0.3)',
  },
  
  // Border radius system
  radius: {
    xs: '0.125rem',
    sm: '0.25rem', 
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  // Animation system
  animations: {
    bounce: 'bounce 1s infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideUp: 'slideUp 0.5s ease-out',
    slideDown: 'slideDown 0.5s ease-out',
    scaleIn: 'scaleIn 0.3s ease-out',
  },
  
  // Typography system
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
  },
  
  // Spacing system
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  }
};

// CSS custom properties for use in components
export const themeVariables = `
  :root {
    --color-primary-50: ${theme.colors.primary[50]};
    --color-primary-100: ${theme.colors.primary[100]};
    --color-primary-500: ${theme.colors.primary[500]};
    --color-primary-600: ${theme.colors.primary[600]};
    --color-primary-700: ${theme.colors.primary[700]};
    
    --gradient-primary: ${theme.colors.gradients.primary};
    --gradient-medical: ${theme.colors.gradients.medical};
    --gradient-ocean: ${theme.colors.gradients.ocean};
    
    --shadow-glow: ${theme.shadows.glow};
    --shadow-glow-lg: ${theme.shadows['glow-lg']};
  }
`;

// Utility function to get theme colors
export const getThemeColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = theme.colors;
  
  for (const key of keys) {
    value = value[key];
    if (!value) return null;
  }
  
  return value;
};

// Utility classes for common patterns
export const themeClasses = {
  card: 'bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300',
  cardHover: 'hover:scale-105 hover:shadow-2xl',
  button: 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4',
  buttonPrimary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500/20',
  buttonSecondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500/20',
  input: 'w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
  gradient: {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
    medical: 'bg-gradient-to-r from-teal-400 to-teal-600',
    success: 'bg-gradient-to-r from-green-400 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    danger: 'bg-gradient-to-r from-red-400 to-red-600',
  }
};

export default theme;
