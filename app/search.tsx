import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import {
  View, TextInput, Text, Image, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, Modal
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import axios from 'axios';
import Slider from '@react-native-community/slider';
import { searchStyles } from '../styles/SearchStyles';
import { StepsContext } from '../context/StepsContext';
import { useLocation } from '../context/LocationContext'
import RouteButton from '../components/RouteButton';
import { API_TOKEN, API_ENDPOINT } from '../constants/authConfig';

type FilterType = 'museum' | 'activity' | 'restaurant';

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function SearchScreen() {
  const router = useRouter();
  const { focus } = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [distance, setDistance] = useState(5);
  const { location } = useLocation();
  const [poiList, setPoiList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { addStep } = useContext(StepsContext);
  const [activeRoute, setActiveRoute] = useState('/search');

  const handleNavPress = (route: string) => {
    setActiveRoute(route);
    router.replace(route);
  };

  const [selectedFilters, setSelectedFilters] = useState<Record<FilterType, boolean>>({
    museum: true,
    activity: true,
    restaurant: true,
  });

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (focus === 'true' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchPOIs = useCallback(async (loc: { latitude: number; longitude: number }) => {
    try {
      const response = await axios.get(
        `${API_ENDPOINT}/points-of-interest?lat=${loc.latitude}&lon=${loc.longitude}&range=${distance}`, {
          headers: {
            'X-API-Token': API_TOKEN,
          },
        }
      );

      const pois = response.data.map((poi) => {
        const dist = haversineDistance(loc.latitude, loc.longitude, poi.latitude, poi.longitude);
        return {
          ...poi,
          imageUrl: extractImageFromMetadata(poi.metadata),
          description: extractDescriptionFromMetadata(poi.metadata),
          distance: dist.toFixed(2),
          type: classifyPOI(poi),
        };
      }).filter(p => p.imageUrl);

      setPoiList(pois);
      setFilteredList(pois);
    } catch (err) {
      console.error("Erro ao buscar POIs:", err);
    }
  }, [distance]);

  useEffect(() => {
    if (location) {
      fetchPOIs(location);
    }
  }, [location, fetchPOIs]);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      filterPOIs();
    }, 300);
  }, [search, selectedFilters]);

  const extractImageFromMetadata = (metadata: string) => {
    const match = metadata.match(/image_url=([^\s|]+)/);
    return match ? match[1] : null;
  };

  const extractDescriptionFromMetadata = (metadata: string) => {
    return metadata.split('|')[0].trim();
  };

  const classifyPOI = (poi: { name?: string; metadata?: string }): FilterType => {
    const lowerName = poi.name?.toLowerCase() || '';
    const lowerMeta = poi.metadata?.toLowerCase() || '';
    if (lowerName.includes('museu') || lowerMeta.includes('museu') || lowerMeta.includes('galeria')) return 'museum';
    if (lowerName.includes('praia') || lowerMeta.includes('praia') || lowerMeta.includes('atividade')) return 'activity';
    return 'restaurant';
  };

  const filterPOIs = () => {
    const filtered = poiList.filter((poi) =>
      poi.name?.toLowerCase().includes(search.toLowerCase()) &&
      selectedFilters[poi.type as FilterType]
    );
    setFilteredList(filtered);
  };

  const handleAddStep = (poi: any) => {
    const step = {
      latitude: poi.latitude,
      longitude: poi.longitude,
      name: poi.name || "POI"
    };
    addStep(step);
    Alert.alert("✅ POI adicionado à rota!");
    setDetailsModalVisible(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={searchStyles.container}>
      <View style={searchStyles.header}>
        <Image source={require('../assets/logo.png')} style={searchStyles.logo} />
        <TextInput
          ref={searchInputRef}
          style={searchStyles.searchBar}
          placeholder="Pesquisar ponto de interesse..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={searchStyles.sliderContainer}>
        <Slider
          style={{ width: '100%', height: 50 }}
          minimumValue={1}
          maximumValue={30}
          step={1}
          value={distance}
          minimumTrackTintColor="#000000"
          maximumTrackTintColor="#ccc"
          thumbTintColor="#000000"
          onValueChange={value => setDistance(value)}
        />
        <Text style={searchStyles.sliderLabel}>Distância Máxima: {distance} km</Text>
      </View>

      <View style={searchStyles.filterContainer}>
        {(['museum', 'activity', 'restaurant'] as FilterType[]).map(filter => {
          const isSelected = selectedFilters[filter];
          const label =
            filter === 'museum' ? '🖼️ Museu' :
            filter === 'activity' ? '🏖️ Atividade' : '🍽️ Restaurante';

          return (
            <TouchableOpacity
              key={filter}
              style={[
                searchStyles.filterButton,
                isSelected ? searchStyles.activeFilter : searchStyles.inactiveFilter,
              ]}
              onPress={() => {
                setSelectedFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
              }}
            >
              <Text style={[
                searchStyles.filterText,
                isSelected ? searchStyles.activeFilterText : searchStyles.inactiveFilterText
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={searchStyles.sectionTitle}>Populares</Text>

      <ScrollView style={searchStyles.listContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {poiList.filter(poi =>
          poi.name?.toLowerCase().includes(search.toLowerCase())
        ).map((poi, index) => (
          <TouchableOpacity
            key={index}
            style={searchStyles.destinationItem}
            onPress={() => {
              setSelectedPoi(poi);
              setDetailsModalVisible(true);
            }}
          >
            <Image source={{ uri: poi.imageUrl }} style={searchStyles.destinationImage} />
            <View>
              <Text style={searchStyles.destinationText}>{poi.name}</Text>
              <Text>{poi.description}</Text>
              <Text style={{ color: '#777' }}>📍 {poi.distance} km</Text>
            </View>
          </TouchableOpacity>
        ))}
        {poiList.filter(poi =>
          poi.name?.toLowerCase().includes(search.toLowerCase())
        ).length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 30 }}>😕 Nada encontrado</Text>
        )}
      </ScrollView>

      {selectedPoi && (
        <Modal visible={detailsModalVisible} transparent animationType="slide">
          <View style={searchStyles.modalContainer}>
            <View style={searchStyles.modalContent}>
              <Text style={searchStyles.modalText}>{selectedPoi.name}</Text>
              <Image source={{ uri: selectedPoi.imageUrl }} style={{ width: 200, height: 120, borderRadius: 10, marginBottom: 10 }} />
              <Text style={searchStyles.modalSubText}>{selectedPoi.description}</Text>
              <Text style={{ marginBottom: 10 }}>📍 A {selectedPoi.distance} km de si</Text>
              <View style={searchStyles.modalButtons}>
                <TouchableOpacity style={searchStyles.modalButton} onPress={() => setDetailsModalVisible(false)}>
                  <Text style={searchStyles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={searchStyles.modalButton} onPress={() => handleAddStep(selectedPoi)}>
                  <Text style={searchStyles.modalButtonText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <RouteButton />

      <View style={searchStyles.bottomNav}>
        <TouchableOpacity onPress={() => handleNavPress('/home')}>
          <View style={[searchStyles.iconWrapper, activeRoute === '/home' && searchStyles.iconActive]}>
            <Image source={require('../assets/home.png')} style={searchStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/search')}>
          <View style={[searchStyles.iconWrapper, activeRoute === '/search' && searchStyles.iconActive]}>
            <Image source={require('../assets/search.png')} style={searchStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/rotas')}>
          <View style={[searchStyles.iconWrapper, activeRoute === '/rotas' && searchStyles.iconActive]}>
            <Image source={require('../assets/localizador.png')} style={searchStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/review')}>
          <View style={[searchStyles.iconWrapper, activeRoute === '/review' && searchStyles.iconActive]}>
            <Image source={require('../assets/star.png')} style={searchStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/account')}>
          <View style={[searchStyles.iconWrapper, activeRoute === '/account' && searchStyles.iconActive]}>
            <Image source={require('../assets/user.png')} style={searchStyles.navIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
