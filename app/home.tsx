import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity,
  ScrollView, Modal, Alert, ActivityIndicator,  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as Location from 'expo-location';
import { homeStyles } from '../styles/HomeStyles';
import { StepsContext } from '../context/StepsContext';
import { useLocation } from '../context/LocationContext';
import RouteButton from '../components/RouteButton'; // <-- Importa o botão flutuante
import { API_TOKEN, API_ENDPOINT } from '../constants/authConfig';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function HomeScreen() {
  const router = useRouter();
  const {location}= useLocation();
  const [poiImages, setPoiImages] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const { addStep } = useContext(StepsContext);
  const [activeRoute, setActiveRoute] = useState('/home');

  const handleNavPress = (route: string) => {
    setActiveRoute(route);
    router.replace(route);
  };

  useEffect(() => {
    if (location) {
      fetchPointsOfInterest(location);
    }
  }, [location]);

  const extractImageFromMetadata = (metadata) => {
    const match = metadata.match(/image_url=([^\s|]+)/);
    return match ? match[1] : null;
  };

  const extractDescriptionFromMetadata = (metadata) => {
    return metadata.split('|')[0].trim();
  };

  const fetchPointsOfInterest = async (loc) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_ENDPOINT}/points-of-interest?lat=${loc.latitude}&lon=${loc.longitude}&range=50`, {
        headers: { 'X-API-Token': API_TOKEN }
      });

      const pois = res.data.map((poi) => ({
        ...poi,
        imageUrl: extractImageFromMetadata(poi.metadata),
        description: extractDescriptionFromMetadata(poi.metadata),
        distance: haversineDistance(loc.latitude, loc.longitude, poi.latitude, poi.longitude).toFixed(2)
      })).filter(p => p.imageUrl);

      setPoiImages(pois);
    } catch (err) {
      console.error("Erro ao buscar POIs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToRoute = (poi) => {
    addStep({
      latitude: poi.latitude,
      longitude: poi.longitude,
      name: poi.name || 'POI'
    });
    Alert.alert('POI adicionado à rota!');
    setDetailsModalVisible(false);
  };

  const visiblePOIs = poiImages.slice(0, visibleCount);

  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <Image source={require('../assets/logo.png')} style={homeStyles.logo} />
        <Text style={homeStyles.title}>Wayly</Text>
      </View>

      <TextInput
        style={homeStyles.searchBar}
        placeholder="Locais para visitar, atividades, hotéis... ?"
        onFocus={() => router.push('/search?focus=true')}
      />

      <Text style={homeStyles.sectionTitle}>Locais mais visitados perto de si</Text>
      {location && (
        <Text style={{ fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
          📍 Baseado na sua localização atual
        </Text>
      )}

      <ScrollView style={{ width: '100%', marginTop: 20 }} contentContainerStyle={{ paddingBottom: 150 }}>
        {isLoading ? (
          <View style={{ paddingTop: 50 }}>
            <ActivityIndicator size="large" color="#6BD88D" />
          </View>
        ) : (
          <>
            {visiblePOIs.map((poi, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedPoi(poi);
                  setDetailsModalVisible(true);
                }}
                style={{ marginBottom: 30, alignItems: 'center' }}
              >
                <Image source={{ uri: poi.imageUrl }} style={{ width: '90%', height: 200, borderRadius: 10 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 10 }}>{poi.name}</Text>
                <Text style={{ fontSize: 14 }}>
                  ⭐ {poi.rating} | 📍 {poi.distance} km{' | '}
                  <TouchableOpacity
                    onPress={() => {
                      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`;
                      Linking.openURL(googleMapsUrl);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginLeft: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 16
                    }}
                  >
                    <Image
                      source={require('../assets/localizador.png')}
                      style={{ width: 18, height: 18, marginRight: 6 }}
                    />
                    <Text style={{ color: '#1E90FF', textDecorationLine: 'underline' }}>
                      Ver no Mapa
                    </Text>
                  </TouchableOpacity>
                </Text>
                <Text style={{ textAlign: 'center', paddingHorizontal: 20, marginVertical: 4 }}>{poi.description}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#6BD88D', padding: 10, borderRadius: 8, marginTop: 5 }}
                  onPress={() => handleAddToRoute(poi)}
                >
                  <Text style={{ color: 'white' }}>Adicionar à Rota</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {poiImages.length > visibleCount && (
              <TouchableOpacity onPress={() => setVisibleCount(prev => prev + 5)} style={{ alignSelf: 'center' }}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Ver Mais ▼</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {selectedPoi && (
        <Modal visible={detailsModalVisible} transparent animationType="fade">
          <View style={homeStyles.modalContainer}>
            <View style={homeStyles.modalContent}>
              <Text style={homeStyles.modalText}>{selectedPoi.name}</Text>
              <Image source={{ uri: selectedPoi.imageUrl }} style={{ width: 200, height: 120, borderRadius: 10, marginBottom: 10 }} />
              <Text style={homeStyles.modalSubText}>{selectedPoi.description}</Text>
              <Text style={{ marginBottom: 10 }}>📍 A {selectedPoi.distance} km de si</Text>
              <View style={homeStyles.modalButtons}>
                <TouchableOpacity style={homeStyles.modalButton} onPress={() => setDetailsModalVisible(false)}>
                  <Text style={homeStyles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={homeStyles.modalButton} onPress={() => handleAddToRoute(selectedPoi)}>
                  <Text style={homeStyles.modalButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <RouteButton /> 

      <View style={homeStyles.bottomNav}>
        <TouchableOpacity onPress={() => handleNavPress('/home')}>
          <View style={[homeStyles.iconWrapper, activeRoute === '/home' && homeStyles.iconActive]}>
            <Image source={require('../assets/home.png')} style={homeStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/search')}>
          <View style={[homeStyles.iconWrapper, activeRoute === '/search' && homeStyles.iconActive]}>
            <Image source={require('../assets/search.png')} style={homeStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/rotas')}>
          <View style={[homeStyles.iconWrapper, activeRoute === '/rotas' && homeStyles.iconActive]}>
            <Image source={require('../assets/localizador.png')} style={homeStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/review')}>
          <View style={[homeStyles.iconWrapper, activeRoute === '/review' && homeStyles.iconActive]}>
            <Image source={require('../assets/star.png')} style={homeStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/account')}>
          <View style={[homeStyles.iconWrapper, activeRoute === '/account' && homeStyles.iconActive]}>
            <Image source={require('../assets/user.png')} style={homeStyles.navIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
   
  );
}
