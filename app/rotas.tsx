import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { mapStyles } from '../styles/RotasStyles';
import { StepsContext } from '../context/StepsContext';
import { useLocation } from '../context/LocationContext';
import {
  API_KEY,
  ROUTES_API_ENDPOINT,
  OPENCAGE_API_KEY
} from '../constants/authConfig';

type LocationType = {
  latitude: number;
  longitude: number;
  name?: string;
};

const locationPresets: { [key: string]: LocationType } = {
  'Porto': { latitude: 41.1579, longitude: -8.6291, name: 'Porto' },
  'Aveiro': { latitude: 40.6405, longitude: -8.6538, name: 'Aveiro' },
  'Lisboa': { latitude: 38.7169, longitude: -9.1399, name: 'Lisboa' },
};

const findPreset = (name: string) =>
  Object.entries(locationPresets)
    .find(([k]) => k.toLowerCase() === name.trim().toLowerCase())?.[1];

// Função para converter nome de cidade em coordenadas
const geocodeCity = async (city: string): Promise<LocationType> => {
  try {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${OPENCAGE_API_KEY}&countrycode=pt&limit=1`
    );
    
    const { results } = response.data;
    if (results && results.length > 0) {
      const { lat, lng } = results[0].geometry;
      const location = { 
        latitude: lat, 
        longitude: lng, 
        name: results[0].formatted || city 
      };
      return location;
    }
    throw new Error(`Nenhum resultado para "${city}"`);
  } catch (error) {
    throw error;
  }
};

export default function MapScreen() {
  const router = useRouter();
  const { steps, removeStep } = React.useContext(StepsContext);
  const { location } = useLocation();
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [routeAlternatives, setRouteAlternatives] = useState<LocationType[][]>([]);
  const [stepsMarkers, setStepsMarkers] = useState<LocationType[]>([]);
  
  const [originCoords, setOriginCoords] = useState<LocationType | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<LocationType | null>(null);
  
  const lastSentRef = useRef<number>(0);
  const THROTTLE_TIME = 3000;
  const [activeRoute, setActiveRoute] = useState('/rotas');
  const [isLoading, setIsLoading] = useState(false);

  // Função corrigida para extrair coordenadas
  const extractGeometryCoordinates = (geometry: any): LocationType[] => {
    try {
      if (!geometry) return [];
      
      // Parse string JSON se necessário
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry);
        } catch (e) {
          return [];
        }
      }
      
      let coordinates: number[][] = [];
      
      // Formato GeoJSON LineString (resposta da API para 2 waypoints)
      if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
        coordinates = geometry.coordinates;
      }
      // Formato GeoJSON Feature
      else if (geometry.type === 'Feature' && geometry.geometry?.type === 'LineString') {
        coordinates = geometry.geometry.coordinates;
      }
      // Array direto de coordenadas
      else if (Array.isArray(geometry.coordinates)) {
        coordinates = geometry.coordinates;
      }
      // Array direto
      else if (Array.isArray(geometry)) {
        coordinates = geometry;
      }
      else {
        return [];
      }
      
      // Converter [lng, lat] para {latitude, longitude}
      return coordinates
        .filter((coord): coord is [number, number] => 
          Array.isArray(coord) && 
          coord.length >= 2 && 
          typeof coord[0] === 'number' && 
          typeof coord[1] === 'number' &&
          !isNaN(coord[0]) && 
          !isNaN(coord[1])
        )
        .map((coord) => ({
          latitude: coord[1],   // ORS: [longitude, latitude]
          longitude: coord[0],
        }));
    } catch (error) {
      return [];
    }
  };

  const handleNavPress = (route: '/home' | '/search' | '/rotas' | '/review' | '/account') => {
    setActiveRoute(route);
    router.replace(route);
  };

  const getMapRegion = (): Region => {
    const allPoints = routeAlternatives.flat();
    const pointsToInclude = [...allPoints];
    if (originCoords) pointsToInclude.push(originCoords);
    if (destinationCoords) pointsToInclude.push(destinationCoords);
    if (location) pointsToInclude.push(location);
    
    if (pointsToInclude.length > 0) {
      const lats = pointsToInclude.map(pt => pt.latitude);
      const longs = pointsToInclude.map(pt => pt.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...longs);
      const maxLng = Math.max(...longs);
      
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
      const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }
    
    return {
      latitude: location?.latitude || 41.1579,
      longitude: location?.longitude || -8.6291,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  const handleTextRouteSend = async () => {
    if (!location || isLoading) return;
    
    if (!originText.trim() && !destinationText.trim()) {
      Alert.alert("Erro", "Por favor, preencha pelo menos o destino.");
      return;
    }
    
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_TIME) return;
    lastSentRef.current = now;
    setIsLoading(true);
    
    let resolvedOrigin: LocationType;
    let resolvedDestination: LocationType;

    try {
      // Handle origin
      if (!originText.trim() || originText.trim().toLowerCase() === 'atual') {
        resolvedOrigin = { ...location, name: 'Localização Atual' };
      } else {
        const preset = findPreset(originText);
        if (preset) {
          resolvedOrigin = preset;
        } else {
          resolvedOrigin = await geocodeCity(originText);
        }
      }

      // Handle destination
      if (!destinationText.trim()) {
        throw new Error('Destino é obrigatório');
      }
      
      if (destinationText.trim().toLowerCase() === 'atual') {
        resolvedDestination = { ...location, name: 'Localização Atual' };
      } else {
        const preset = findPreset(destinationText);
        if (preset) {
          resolvedDestination = preset;
        } else {
          resolvedDestination = await geocodeCity(destinationText);
        }
      }

      if (!resolvedOrigin || !resolvedDestination) {
        throw new Error('Falha ao obter coordenadas válidas');
      }

      const distance = Math.sqrt(
        Math.pow(resolvedOrigin.latitude - resolvedDestination.latitude, 2) +
        Math.pow(resolvedOrigin.longitude - resolvedDestination.longitude, 2)
      );
      
      if (distance < 0.001) {
        Alert.alert("Aviso", "Origem e destino são muito próximos.");
        return;
      }

      setOriginCoords(resolvedOrigin);
      setDestinationCoords(resolvedDestination);

      await sendRouteToAPI(resolvedOrigin, resolvedDestination);
    } catch (error) {
      let errorMessage = "Não foi possível processar a rota: ";
      
      if (error && typeof error === 'object' && 'message' in error) {
        const messageError = error as any;
        errorMessage += messageError.message;
      } else {
        errorMessage += "Erro desconhecido";
      }
      
      Alert.alert("Erro", errorMessage);
      
      setOriginCoords(null);
      setDestinationCoords(null);
      setRouteAlternatives([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRouteToAPI = async (origin: LocationType, destination: LocationType) => {
    const payload = {
      origin: { 
        coordinates: [origin.longitude, origin.latitude] 
      },
      destination: { 
        coordinates: [destination.longitude, destination.latitude] 
      },
      steps: steps.map((step: any) => ({
        coordinates: [step.longitude, step.latitude],
        location: step.name || "POI",
        notes: "string"
      })),
      user_id: "string"
    };

    try {
      const response = await axios.post(ROUTES_API_ENDPOINT, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        timeout: 15000,
      });

      if (!response.data) {
        throw new Error('Resposta vazia da API');
      }

      const allRoutes: LocationType[][] = [];
      
      // Processar geometria principal
      if (response.data.geometry) {
        const mainRouteCoords = extractGeometryCoordinates(response.data.geometry);
        if (mainRouteCoords.length > 0) {
          allRoutes.push(mainRouteCoords);
        }
      }
      
      // Processar alternativas
      const alternatives = response.data.alternatives || [];
      alternatives.forEach((alt: any) => {
        // Multi-segment routes
        if (alt.segments && alt.segments.length > 0) {
          const allCoords: LocationType[] = [];
          alt.segments.forEach((segment: any) => {
            if (segment.geometry) {
              const segmentCoords = extractGeometryCoordinates(segment.geometry);
              allCoords.push(...segmentCoords);
            }
          });
          if (allCoords.length > 0) {
            allRoutes.push(allCoords);
          }
        }
        // Single geometry alternatives
        else if (alt.geometry) {
          const altCoords = extractGeometryCoordinates(alt.geometry);
          if (altCoords.length > 0) {
            allRoutes.push(altCoords);
          }
        }
      });
      
      // Fallback para linha direta se nenhuma rota foi extraída
      if (allRoutes.length === 0) {
        allRoutes.push([origin, destination]);
        Alert.alert("Info", "Mostrando rota direta entre origem e destino.");
      } else {
        Alert.alert("Sucesso", `${allRoutes.length} rota(s) encontrada(s)!`);
      }
      
      setRouteAlternatives(allRoutes);
      setStepsMarkers(steps as LocationType[]);
      
    } catch (error) {
      let errorMessage = "Falha ao calcular rota.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            errorMessage = "Erro de autenticação. Verifique a API key.";
          } else if (axiosError.response.status >= 500) {
            errorMessage = "Erro no servidor. Tente novamente mais tarde.";
          } else {
            errorMessage = `Erro na API: ${axiosError.response.status}`;
          }
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as any;
        if (networkError.code === 'ECONNABORTED') {
          errorMessage = "Timeout na conexão. Verifique sua internet.";
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const messageError = error as any;
        if (messageError.message) {
          errorMessage = messageError.message;
        }
      }
      
      Alert.alert("Erro", errorMessage);
      
      const directRoute = [origin, destination];
      setRouteAlternatives([directRoute]);
      setStepsMarkers(steps as LocationType[]);
    }
  };

  return (
    <View style={mapStyles.container}>
      <View style={mapStyles.header}>
        <View style={mapStyles.headerContent}>
          <Image source={require('../assets/logo.png')} style={mapStyles.logo} />
          <Text style={mapStyles.title}>Wayly</Text>
        </View>
        <View style={mapStyles.inputsContainer}>
          <TextInput
            style={{
              flex: 1,
              marginRight: 5,
              borderWidth: 1,
              borderColor: '#888',
              borderRadius: 4,
              height: 40,
              paddingHorizontal: 8,
              color: '#000',
              backgroundColor: '#FFF'
            }}
            value={originText}
            onChangeText={setOriginText}
            placeholder="Origem (atual)"
            placeholderTextColor="#999"
            editable={!isLoading}
          />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 5,
              borderWidth: 1,
              borderColor: '#888',
              borderRadius: 4,
              height: 40,
              paddingHorizontal: 8,
              color: '#000',
              backgroundColor: '#FFF'
            }}
            value={destinationText}
            onChangeText={setDestinationText}
            placeholder="Destino"
            placeholderTextColor="#999"
            editable={!isLoading}
          />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: isLoading ? '#ccc' : '#3DDC97',
            padding: 12,
            borderRadius: 20,
            marginTop: 10,
            width: 200,
            alignItems: 'center',
          }}
          disabled={isLoading}
          onPress={handleTextRouteSend}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {isLoading ? 'A calcular…' : 'Calcular rotas'}
          </Text>
        </TouchableOpacity>
      </View>

      {Array.isArray(steps) && steps.length > 0 && (
        <View style={{ padding: 10, backgroundColor: '#f2f2f2', maxHeight: 160 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🧭 POIs na rota:</Text>
          <ScrollView>
            {steps.map((step: any, i: number) => (
              <View
                key={i}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <Text>
                  • {step.name || 'POI'} ({step.latitude?.toFixed(3)}, {step.longitude?.toFixed(3)})
                </Text>
                <TouchableOpacity onPress={() => removeStep(step)}>
                  <Text style={{ color: 'red' }}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {location ? (
        <MapView
          style={mapStyles.map}
          provider="google"
          region={getMapRegion()}
          showsUserLocation
          followsUserLocation
        >
          <Marker 
            coordinate={location} 
            title="Estou aqui!" 
            pinColor="blue"
            identifier="current-location"
          />
          
          {originCoords && (
            <Marker 
              coordinate={originCoords} 
              title={`Origem: ${originCoords.name || 'Local'}`}
              pinColor="green"
              identifier="origin"
            />
          )}
          
          {destinationCoords && (
            <Marker 
              coordinate={destinationCoords} 
              title={`Destino: ${destinationCoords.name || 'Local'}`}
              pinColor="red"
              identifier="destination"
            />
          )}
          
          {routeAlternatives.map((route, idx) => (
            <Polyline
              key={`route-${idx}`}
              coordinates={route}
              strokeColor={idx === 0 ? "#FF0000" : idx === 1 ? "#0000FF" : "#00AA00"}
              strokeWidth={4}
              lineDashPattern={idx === 0 ? [] : [10, 5]}
            />
          ))}
          
          {stepsMarkers.map((step, index) => (
            <Marker
              key={`step-${index}`}
              coordinate={step}
              title={step.name || `POI ${index + 1}`}
              pinColor="orange"
              identifier={`step-${index}`}
            />
          ))}
        </MapView>
      ) : (
        <Text style={mapStyles.loadingText}>A obter localização...</Text>
      )}

      {routeAlternatives.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 100,
          left: 10,
          right: 10,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: 10,
          borderRadius: 8,
        }}>
          <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>
            🗺️ {routeAlternatives.length} rota(s) encontrada(s)
          </Text>
          {originCoords && destinationCoords && (
            <Text style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>
              {originCoords.name || 'Origem'} → {destinationCoords.name || 'Destino'}
            </Text>
          )}
        </View>
      )}

      <View style={mapStyles.bottomNav}>
        <TouchableOpacity onPress={() => handleNavPress('/home')}>
          <View style={[mapStyles.iconWrapper, activeRoute === '/home' && mapStyles.iconActive]}>
            <Image source={require('../assets/home.png')} style={mapStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/search')}>
          <View style={[mapStyles.iconWrapper, activeRoute === '/search' && mapStyles.iconActive]}>
            <Image source={require('../assets/search.png')} style={mapStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/rotas')}>
          <View style={[mapStyles.iconWrapper, activeRoute === '/rotas' && mapStyles.iconActive]}>
            <Image source={require('../assets/localizador.png')} style={mapStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/review')}>
          <View style={[mapStyles.iconWrapper, activeRoute === '/review' && mapStyles.iconActive]}>
            <Image source={require('../assets/star.png')} style={mapStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/account')}>
          <View style={[mapStyles.iconWrapper, activeRoute === '/account' && mapStyles.iconActive]}>
            <Image source={require('../assets/user.png')} style={mapStyles.navIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}