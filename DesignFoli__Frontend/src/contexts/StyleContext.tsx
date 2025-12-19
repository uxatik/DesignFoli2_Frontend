"use client";
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface StyleConfig {
  font: 'Serif' | 'Sans Serif' | 'Monospace' | 'Cursive';
  headingStyle: 'Regular' | 'Bold' | 'Semi-Bold' | 'Light';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  buttonStyle: 'Fill' | 'Stroke';
  spacing: 'S' | 'M' | 'L' | 'XL';
}

interface StyleState {
  config: StyleConfig;
  isLoading: boolean;
  error: string | null;
}

type StyleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONFIG'; payload: StyleConfig }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_COLORS'; payload: Partial<StyleConfig['colors']> }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof Omit<StyleConfig, 'colors'>; value: string } };

const defaultStyleConfig: StyleConfig = {
  font: 'Sans Serif',
  headingStyle: 'Regular',
  colors: {
    primary: '#1a1a1a',
    secondary: '#6c757d',
    accent: '#6155F5',
    background: '#F8F9FA'
  },
  buttonStyle: 'Fill',
  spacing: 'M'
};

const initialState: StyleState = {
  config: defaultStyleConfig,
  isLoading: false,
  error: null,
};

const styleReducer = (state: StyleState, action: StyleAction): StyleState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'UPDATE_COLORS':
      return {
        ...state,
        config: {
          ...state.config,
          colors: { ...state.config.colors, ...action.payload }
        }
      };
    case 'UPDATE_FIELD':
      return {
        ...state,
        config: {
          ...state.config,
          [action.payload.field]: action.payload.value
        }
      };
    default:
      return state;
  }
};

interface StyleContextType {
  state: StyleState;
  dispatch: React.Dispatch<StyleAction>;
  fetchStyleConfig: (token: string) => Promise<void>;
  updateStyleConfig: (token: string, config: StyleConfig) => Promise<void>;
  getCSSVariables: () => Record<string, string>;
  getSpacingValue: (spacing?: string) => string;
  getFontFamily: (font?: string) => string;
  getHeadingWeight: (style?: string) => string;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

export const useStyle = () => {
  const context = useContext(StyleContext);
  if (context === undefined) {
    throw new Error('useStyle must be used within a StyleProvider');
  }
  return context;
};

interface StyleProviderProps {
  children: ReactNode;
}

export const StyleProvider: React.FC<StyleProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(styleReducer, initialState);

  const fetchStyleConfig = async (token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.style) {
        dispatch({ type: 'SET_CONFIG', payload: result.data.style });
      } else {
        throw new Error(result.error || "Failed to fetch style configuration");
      }
    } catch (error) {
      console.error("Error fetching style config:", error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : "Failed to fetch style configuration" 
      });
      // Use default configuration on error
      dispatch({ type: 'SET_CONFIG', payload: defaultStyleConfig });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateStyleConfig = async (token: string, config: StyleConfig) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/v1/users/profile/style`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update style configuration");
      }

      dispatch({ type: 'SET_CONFIG', payload: config });
    } catch (error) {
      console.error("Error updating style config:", error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : "Failed to update style configuration" 
      });
      throw error; // Re-throw to allow component to handle the error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Helper function to get CSS variables from the current style config
  const getCSSVariables = (): Record<string, string> => {
    const { config } = state;
    return {
      '--color-primary': config.colors.primary,
      '--color-secondary': config.colors.secondary,
      '--color-accent': config.colors.accent,
      '--color-background': config.colors.background,
      '--font-family': getFontFamily(config.font),
      '--heading-weight': getHeadingWeight(config.headingStyle),
      '--spacing': getSpacingValue(config.spacing),
    };
  };

  // Get spacing value in CSS units
  const getSpacingValue = (spacing?: string): string => {
    const spacingValue = spacing || state.config.spacing;
    switch (spacingValue) {
      case 'S':
        return '0.5rem';
      case 'M':
        return '1rem';
      case 'L':
        return '1.5rem';
      case 'XL':
        return '2rem';
      default:
        return '1rem';
    }
  };

  // Get font family CSS value
  const getFontFamily = (font?: string): string => {
    const fontValue = font || state.config.font;
    switch (fontValue) {
      case 'Serif':
        return 'serif';
      case 'Sans Serif':
        return 'sans-serif';
      case 'Monospace':
        return 'monospace';
      case 'Cursive':
        return 'cursive';
      default:
        return 'sans-serif';
    }
  };

  // Get heading font weight
  const getHeadingWeight = (style?: string): string => {
    const styleValue = style || state.config.headingStyle;
    switch (styleValue) {
      case 'Light':
        return '300';
      case 'Regular':
        return '400';
      case 'Semi-Bold':
        return '600';
      case 'Bold':
        return '700';
      default:
        return '400';
    }
  };

  // Apply CSS variables to document root when config changes
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = getCSSVariables();
    
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [state.config]);

  const value: StyleContextType = {
    state,
    dispatch,
    fetchStyleConfig,
    updateStyleConfig,
    getCSSVariables,
    getSpacingValue,
    getFontFamily,
    getHeadingWeight,
  };

  return (
    <StyleContext.Provider value={value}>
      {children}
    </StyleContext.Provider>
  );
};
