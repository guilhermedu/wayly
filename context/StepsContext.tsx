import React, { createContext, useContext, useState, ReactNode } from 'react';

type Step = {
  latitude: number;
  longitude: number;
  name?: string;
};

type StepsContextType = {
  steps: Step[];
  addStep: (step: Step) => void;
  removeStep: (step: Step) => void;
  clearSteps: () => void;
};

export const StepsContext = createContext<StepsContextType | undefined>(undefined);

export const StepsProvider = ({ children }: { children: ReactNode }) => {
  const [steps, setSteps] = useState<Step[]>([]);

  const addStep = (step: Step) => {
    setSteps((prevSteps) => {
      const alreadyExists = prevSteps.some(
        (s) => s.latitude === step.latitude && s.longitude === step.longitude
      );
      if (alreadyExists) return prevSteps;
      return [...prevSteps, step];
    });
  };

  const removeStep = (step: Step) => {
    setSteps((prevSteps) =>
      prevSteps.filter(
        (s) =>
          s.latitude !== step.latitude || s.longitude !== step.longitude
      )
    );
  };

  const clearSteps = () => setSteps([]);

  return (
    <StepsContext.Provider value={{ steps, addStep, removeStep, clearSteps }}>
      {children}
    </StepsContext.Provider>
  );
};

export const useSteps = (): StepsContextType => {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return context;
};
