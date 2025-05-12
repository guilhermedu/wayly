import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const initLocation = async () => {
      try {
        // 1. Solicita permissão em foreground ANTES de tudo
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão Negada',
            'Precisamos da sua localização para mostrar pontos de interesse próximos.'
          );
          return;
        }

        // 2. Tenta pegar a última posição em cache
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          setLocation({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
        } else {
          // 3. Se não houver cache, faz uma leitura ativa
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }

        // 4. Agora configura o watch para atualizações periódicas
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10_000,    // 10s
            distanceInterval: 20,    // 20m
          },
          ({ coords }) => {
            setLocation({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }
        );
      } catch (error) {
        console.error('Erro ao obter localização:', error);
        Alert.alert('Erro', 'Não foi possível obter sua localização.');
      } finally {
        setIsLoading(false);
      }
    };

    initLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <LocationContext.Provider value={{ location, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
