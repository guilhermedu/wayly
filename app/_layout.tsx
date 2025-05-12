import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { StepsProvider } from '../context/StepsContext';
import { LocationProvider } from '../context/LocationContext';
import { EntitiesProvider } from '../context/EntitiesContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <StepsProvider>
          <EntitiesProvider>
            <Stack />
          </EntitiesProvider>
        </StepsProvider>
      </LocationProvider>
    </AuthProvider>
  );
}