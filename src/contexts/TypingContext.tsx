'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TypingContextType {
  typingRooms: Set<string>;
  setTyping: (roomId: string, isTyping: boolean) => void;
  isTyping: (roomId: string) => boolean;
}

const TypingContext = createContext<TypingContextType | undefined>(undefined);

export const TypingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typingRooms, setTypingRooms] = useState<Set<string>>(new Set());

  const setTyping = useCallback((roomId: string, isTyping: boolean) => {
    setTypingRooms(prev => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(roomId);
      } else {
        newSet.delete(roomId);
      }
      return newSet;
    });
  }, []);

  const isTyping = useCallback((roomId: string) => {
    return typingRooms.has(roomId);
  }, [typingRooms]);

  return (
    <TypingContext.Provider value={{ typingRooms, setTyping, isTyping }}>
      {children}
    </TypingContext.Provider>
  );
};

export const useTyping = () => {
  const context = useContext(TypingContext);
  if (context === undefined) {
    throw new Error('useTyping must be used within a TypingProvider');
  }
  return context;
};

