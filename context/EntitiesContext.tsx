import React, { createContext, useState } from 'react';

export const EntitiesContext = createContext({
  entitiesMap: new Map(),
  setEntitiesMap: () => {},
});

export function EntitiesProvider({ children }) {
  const [entitiesMap, setEntitiesMap] = useState(new Map());
  return (
    <>
      <EntitiesContext.Provider value={{ entitiesMap, setEntitiesMap }}>
        {children}
      </EntitiesContext.Provider>
    </>
  );
}