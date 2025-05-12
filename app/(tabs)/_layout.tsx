import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../../context/AuthContext';
import { StepsProvider } from '../../context/StepsContext';
import { LocationProvider } from '../../context/LocationContext';
import { EntitiesProvider } from '../../context/EntitiesContext';

export default function Layout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <StepsProvider>
          <EntitiesProvider>
            <Stack>
              <Stack.Screen name="index" options={{ title: 'Login' }} />
              <Stack.Screen name="register" options={{ title: 'Register' }} />
              <Stack.Screen name="home" options={{ title: 'Home' }} />
              <Stack.Screen name="search" options={{ title: 'Search' }} />
              <Stack.Screen name="rotas" options={{ title: 'Rotas' }} />
              <Stack.Screen name="review" options={{ title: 'Review' }} />
              <Stack.Screen name="account" options={{ title: 'Account' }} />
            </Stack>
          </EntitiesProvider>
        </StepsProvider>
      </LocationProvider>
    </AuthProvider>
  );
}