// components/RouteButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSteps } from '../context/StepsContext';

const RouteButton = () => {
  const router = useRouter();
  const { steps } = useSteps();

  if (steps.length === 0) return null;

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => router.push('/rotas')}
    >
      <Text style={styles.floatingText}>
        🧭 Ver rota atual ({steps.length})
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#3DDC97',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
  },
  floatingText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RouteButton;
