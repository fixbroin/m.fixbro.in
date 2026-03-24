'use client';
import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';

interface LoadingContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);


export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false);

    const showLoader = useCallback(() => setIsLoading(true), []);
    const hideLoader = useCallback(() => setIsLoading(false), []);
  
    return (
      <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
        {children}
      </LoadingContext.Provider>
    );
}


export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
