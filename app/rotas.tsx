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
  'Porto': { latitude: 41.1579, longitude: -8.6291 },
  'Aveiro': { latitude: 40.6405, longitude: -8.6538 },
  'Lisboa': { latitude: 38.7169, longitude: -9.1399 },
};

// Função para converter nome de cidade em coordenadas
const geocodeCity = async (city: string): Promise<LocationType> => {
  const response = await axios.get(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${OPENCAGE_API_KEY}&countrycode=pt`
  );
  const { results } = response.data;
  if (results && results.length > 0) {
    const { lat, lng } = results[0].geometry;
    return { latitude: lat, longitude: lng };
  }
  throw new Error(`Nenhum resultado para "${city}"`);
};

export default function MapScreen() {
  const router = useRouter();
  const { steps, removeStep } = React.useContext(StepsContext);
  const { location, setLocation } = useLocation(); // caso queira atualizar a localização
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [routeAlternatives, setRouteAlternatives] = useState<LocationType[][]>([]);
  const [stepsMarkers, setStepsMarkers] = useState<LocationType[]>([]);
  const lastSentRef = useRef<number>(0);
  const THROTTLE_TIME = 3000;
  const [activeRoute, setActiveRoute] = useState('/rotas');

  // Função para tratar a navegação inferior
  const handleNavPress = (route: string) => {
    setActiveRoute(route);
    router.replace(route);
  };

  // Calcula a região do mapa para encaixar a localização atual e as alternativas de rota
  const getMapRegion = (): Region => {
    const allPoints = routeAlternatives.flat();
    if (allPoints.length > 0 && location) {
      const lats = allPoints.map(pt => pt.latitude).concat(location.latitude);
      const longs = allPoints.map(pt => pt.longitude).concat(location.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...longs);
      const maxLng = Math.max(...longs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 || 0.05,
        longitudeDelta: (maxLng - minLng) * 1.5 || 0.05,
      };
    }
    return {
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  // Função chamada quando o usuário envia os textos de origem e destino
  const handleTextRouteSend = async () => {
    if (!location) return;
    const now = Date.now();
    // Evita chamadas frequentes (throttling)
    if (now - lastSentRef.current < THROTTLE_TIME) return;
    lastSentRef.current = now;

    let originCoords: LocationType;
    let destinationCoords: LocationType;

    try {
      const keyPreset = originText.trim().charAt(0).toUpperCase() 
                  + originText.trim().slice(1).toLowerCase();
      // Trata o campo de origem: se for "atual" ou vazio, usa a localização atual
      originCoords = 
        originText.trim().toLowerCase() === 'atual' || originText.trim() === ''
          ? location
          : (locationPresets[keyPreset] || (await geocodeCity(originText)));

      const destPreset = destinationText.trim().charAt(0).toUpperCase() 
                  + destinationText.trim().slice(1).toLowerCase();
      // Trata o campo de destino: se for "atual" ou vazio, usa a localização atual
      destinationCoords =
        destinationText.trim().toLowerCase() === 'atual' || destinationText.trim() === ''
          ? location
          : (locationPresets[destPreset] || (await geocodeCity(destinationText)));

      // Se a origem for definida de forma explícita, atualiza a localização (opcional)
      if (originText.trim().toLowerCase() !== 'atual' && originText.trim() !== '') {
        setLocation(originCoords);
      }

      await sendRouteToAPI(originCoords, destinationCoords);
    } catch (error) {
      console.error("Erro ao converter localizações:", error);
      Alert.alert("Erro", "Não foi possível converter os locais para coordenadas.");
    }
  };

  // Função que envia a rota para a API
  const sendRouteToAPI = async (origin: LocationType, destination: LocationType) => {
    // Constrói o payload conforme o que a API espera.
    // Caso a documentação peça somente "coordinates" simples, use este formato.
    const payload = {
      destination: { coordinates: [destination.longitude, destination.latitude] },
      origin: { coordinates: [origin.longitude, origin.latitude] },
      steps: steps.map(p => ({
        coordinates: [p.longitude, p.latitude],
        location: p.name || "POI",
        notes: "string"
      })),
      user_id: "string"  // ajuste conforme sua necessidade
    };

    try {
      console.log("Enviando payload:", JSON.stringify(payload, null, 2));
      const response = await axios.post(ROUTES_API_ENDPOINT, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
      });

      Alert.alert("Sucesso", "Rotas alternativas recebidas!");
      // A API retorna alternativas que podem ser segmentadas. Aqui, percorremos cada alternativa,
      // extraindo os segmentos e transformando as coordenadas no formato do MapView.
      const alternatives = response.data.alternatives || [];
      const parsedAlternatives = alternatives.map((alt: any) => {
        const segments = alt.segments || [];
        // Flatenamos os segmentos de cada rota
        const allCoords = segments
          .map((seg: any) => seg.geometry?.coordinates || [])
          .flat();
        // Converte [lng, lat] em { latitude, longitude }
        return allCoords.map(([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));
      });

      console.log("Parsed alternatives:", parsedAlternatives);
      setRouteAlternatives(parsedAlternatives);
      // Atualiza os marcadores dos steps com os POIs já selecionados
      setStepsMarkers(steps);
    } catch (error) {
      console.error("❌ Erro ao enviar rota:", error);
      Alert.alert("Erro", "Falha ao enviar rota.");
    }
  };

  return (
    <View style={mapStyles.container}>
      {/* Cabeçalho com logo, título e inputs */}
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
              color: '#000',         // força cor do texto
              backgroundColor: '#FFF' // força fundo branco
            }}
            value={originText}
            onChangeText={setOriginText}
            placeholder="Origem (atual)"
            placeholderTextColor="#999" // cor visível para o placeholder
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
          />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#3DDC97',
            padding: 12,
            borderRadius: 20,
            marginTop: 10,
            width: 200,
            alignItems: 'center',
          }}
          onPress={handleTextRouteSend}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Calcular rotas</Text>
        </TouchableOpacity>
      </View>

      {/* Lista dos POIs (steps) adicionados, se houver */}
      {steps.length > 0 && (
        <View style={{ padding: 10, backgroundColor: '#f2f2f2', maxHeight: 160 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🧭 POIs na rota:</Text>
          <ScrollView>
            {steps.map((s, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <Text>
                  • {s.name || 'POI'} ({s.latitude.toFixed(3)}, {s.longitude.toFixed(3)})
                </Text>
                <TouchableOpacity onPress={() => removeStep(s)}>
                  <Text style={{ color: 'red' }}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Renderização do mapa */}
      {location ? (
        <MapView
          style={mapStyles.map}
          provider="google"
          initialRegion={getMapRegion()}
          showsUserLocation
          followsUserLocation
        >
          <Marker coordinate={location} title="Estou aqui!" pinColor="blue" />
          {routeAlternatives.map((route, idx) => (
            <Polyline
              key={`route-${idx}`}
              coordinates={route}
              strokeColor={idx === 0 ? "#FF0000" : idx === 1 ? "#0000FF" : "#00AA00"}
              strokeWidth={4}
            />
          ))}
          {stepsMarkers.map((step, index) => (
            <Marker
              key={`step-${index}`}
              coordinate={step}
              title={step.name || `Step ${index + 1}`}
              pinColor="green"
            />
          ))}
        </MapView>
      ) : (
        <Text style={mapStyles.loadingText}>A obter localização...</Text>
      )}

      {/* Barra de navegação inferior */}
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