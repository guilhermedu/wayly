import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { managerStyles } from '../styles/ReviewStyles';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { EntitiesContext } from '../context/EntitiesContext';
import {
  API_TOKEN,
  API_ENDPOINT,
  BASE_URL,
  EMBED_URL,
  API_TOKEN_R,
} from '../constants/authConfig';

const normalizeName = (name = '') => name.toLowerCase().trim();

// ---------------------------------------------------
// Tipos e funções para GET/PUT dos dados de POI
// ---------------------------------------------------
export type POI = {
  id: string;
  name: string;
  title: string;
  imageUrl?: string;
  metadata?: string;
  rating?: number;
};

async function getPOI(poiId: string): Promise<POI> {
  try {
    const url = `${API_ENDPOINT}/points-of-interest/${poiId}`;
    console.log('GET URL (getPOI):', url);

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': API_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter POI:', error);
    throw error;
  }
}

async function updatePOI(poiId: string, poiData: POI): Promise<POI> {
  try {
    const url = `${API_ENDPOINT}/points-of-interest/${poiId}`;
    console.log('PUT URL (updatePOI):', url);
    console.log('PUT Payload (updatePOI):', poiData);

    const response = await axios.put(url, poiData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Token': API_TOKEN,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar POI:', error);
    throw error;
  }
}

// Agora a função aceita opcionalmente um valor de rating para atualizar
async function updatePOIRatingFully(
  poiId: string,
  newRating: number
): Promise<POI> {
  try {
    const poi = await getPOI(poiId);
    poi.rating = newRating;
    const updatedPoi = await updatePOI(poiId, poi);
    return updatedPoi;
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------
// Componente principal
// ---------------------------------------------------
export default function EntitiesManager() {
  const router = useRouter();
  const { token } = useAuth();
  const { location } = useLocation();
  const { entitiesMap, setEntitiesMap } = useContext(EntitiesContext);

  // Usamos dois estados de loading separados para POIs e Entidades
  const [loadingPOIs, setLoadingPOIs] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  // Estado para ações gerais (por exemplo, update/sincronização) – se necessário
  const [loadingAction, setLoadingAction] = useState(false);

  const [pois, setPois] = useState<POI[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  // Guarda o POI cuja review foi aberta
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  // Guarda o valor do rating que é recebido (seja pela WebView ou sincronizado)
  const [currentReviewRating, setCurrentReviewRating] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const processedPOIsRef = useRef(new Set<string>());
  const [activeRoute, setActiveRoute] = useState('/review');

  const handleNavPress = (route: string) => {
    setActiveRoute(route);
    router.replace(route);
  };

  const extractImage = (metadata?: string) => {
    const match = metadata?.match(/image_url=([^\s|]+)/);
    return match ? match[1] : null;
  };

  // Busca as POIs com base na localização
  const fetchPOIs = async (loc: { latitude: number; longitude: number }) => {
    if (!loc) return;
    setLoadingPOIs(true);
    try {
      const url = `${API_ENDPOINT}/points-of-interest?lat=${loc.latitude}&lon=${loc.longitude}&range=100`;
      console.log('GET URL (fetchPOIs):', url);

      const res = await axios.get(
        url,
        { headers: { 'X-API-Token': API_TOKEN } }
      );
      const data = res.data.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        title: poi.name,
        imageUrl: extractImage(poi.metadata),
        metadata: poi.metadata,
        rating: poi.rating,
      }));
      setPois(data);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível carregar POIs.');
    }
    setLoadingPOIs(false);
  };

  const fetchEntities = async () => {
    setLoadingEntities(true);
    try {
      const url = `${BASE_URL}/entities/?all=true`;
      console.log('FETCH URL (fetchEntities):', url);

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${API_TOKEN_R}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const allEntities: any[] = await res.json();

      const newMap = new Map<string, any>();
      allEntities.forEach(entity => {
        const key = normalizeName(entity.title || entity.name);
        newMap.set(key, entity);
      });
      setEntitiesMap(newMap);

    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível listar entidades.');
    } finally {
      setLoadingEntities(false);
    }
  };

  // Cria a entidade a partir de um POI se ela não existir
  const createEntity = async (poi: POI) => {
    setLoadingAction(true);
    try {
      const url = `${BASE_URL}/entities/`;
      const payload = { name: poi.name, title: poi.title };
      console.log('POST URL (createEntity):', url);
      console.log('POST Payload (createEntity):', payload);

      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${API_TOKEN_R}`,
          },
        }
      );
      console.log('Entidade criada:', response.data);
      setEntitiesMap((prev) => {
        const key = normalizeName(response.data.title || response.data.name);
        const newMap = new Map(prev);
        newMap.set(key, response.data);
        return newMap;
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível criar a entidade.');
    }
    setLoadingAction(false);
  };

  const deleteEntity = async (id: string) => {
    setLoadingAction(true);
    try {
      const url = `${BASE_URL}/entities/${id}/`;
      console.log('DELETE URL (deleteEntity):', url);

      await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${API_TOKEN_R}`,
        },
      });
      console.log(`Entidade ${id} removida`);
      setEntitiesMap((prev) => {
        const newMap = new Map(prev);
        [...newMap.entries()].forEach(([key, entity]) => {
          if (entity.id === id) newMap.delete(key);
        });
        return newMap;
      });
    } catch (e) {
      console.error('Erro ao remover entidade:', e);
      Alert.alert('Erro', 'Não foi possível remover a entidade.');
    }
    setLoadingAction(false);
  };

  const getEntityForPOI = (poi: POI) => {
    const key = normalizeName(poi.name);
    return entitiesMap.get(key) || null;
  };

  // Sincroniza o rating da entidade associada ao POI usando o valor atual recebido.
  // Agora, antes de atualizar, faz um GET para obter os dados atuais da entidade.
  const syncRatingForPOI = async (poi: POI, newRatingOverride?: number): Promise<void> => {
    let entity = getEntityForPOI(poi);
    if (!entity) {
      Alert.alert('Aviso', 'Entidade não encontrada.');
      return;
    }
    try {
      // Obtém a entidade atualizada pelo seu ID
      const urlGetEntity = `${BASE_URL}/entities/${entity.id}/`;
      console.log('GET URL (syncRatingForPOI - get entity):', urlGetEntity);

      const res = await axios.get(urlGetEntity, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${API_TOKEN_R}`,
        },
      });
      entity = res.data;
    } catch (err) {
      console.error("Erro ao obter entidade atual:", err);
      // Segue com a entidade local se houver erro
    }
    // Se a entidade não tiver rating, usa o rating do POI (ou zero)
    if (typeof entity.rating !== 'number') {
      entity.rating = typeof poi.rating === 'number' ? poi.rating : 0;
    }
    const newRating =
      typeof newRatingOverride === 'number'
        ? newRatingOverride
        : (currentReviewRating !== null ? currentReviewRating : entity.rating);
    try {
      const updatedPOI = await updatePOIRatingFully(poi.id, newRating);
      setPois((prev) =>
        prev.map((p) => (p.id === poi.id ? { ...p, rating: updatedPOI.rating } : p))
      );
      Alert.alert('Sucesso', `Rating atualizado para ${updatedPOI.rating}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao atualizar o rating do POI.');
    }
  };

  // UseEffect para criar entidades automaticamente para as POIs que ainda não foram processadas
  useEffect(() => {
    if (pois.length === 0) return;
    console.log('Debug: POIs carregados:', pois);
    console.log('Debug: Cache de entidades:', [...entitiesMap.entries()]);
    pois.forEach((poi) => {
      if (!processedPOIsRef.current.has(poi.id)) {
        const entity = getEntityForPOI(poi);
        if (!entity) {
          console.log(`Debug: Criando entidade para POI [${poi.id}] "${poi.name}"`);
          processedPOIsRef.current.add(poi.id);
          createEntity(poi);
        } else {
          console.log(`Debug: Já existe entidade para POI [${poi.id}] "${poi.name}"`);
          processedPOIsRef.current.add(poi.id);
        }
      }
    });
  }, [pois, entitiesMap]);

  const visiblePOIs = pois.slice(0, visibleCount);

  // Quando a localização estiver disponível, busca POIs e entidades (em paralelo)
  useEffect(() => {
    if (location) {
      Promise.all([fetchPOIs(location), fetchEntities()]);
    }
  }, [location]);

  // Ao abrir os reviews, tenta garantir que a entidade esteja criada; se não, cria-a
  const handleShowReviews = async (poi: POI) => {
    setLoadingAction(true);
    try {
      let entity = getEntityForPOI(poi);
      if (!entity) {
        await createEntity(poi);
        entity = getEntityForPOI(poi);
      }
      if (entity) {
        setSelectedEntity(entity);
        setSelectedPoi(poi);
        setShowWebView(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar os reviews.');
    }
    setLoadingAction(false);
  };

  return (
    <View style={managerStyles.container}>
      <View style={managerStyles.header}>
        <Text style={managerStyles.title}>🏞️ Reviews</Text>
      </View>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Mostra loading apenas se as POIs ainda não foram carregadas */}
        {loadingPOIs && pois.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <ActivityIndicator size="large" color="#6BD88D" />
            <Text style={{ marginTop: 10, fontSize: 16 }}>Loading...</Text>
          </View>
        ) : (
          <>
            {visiblePOIs.length > 0 && (
              <View>
                {visiblePOIs.map((poi) => {
                  const entity = getEntityForPOI(poi);
                  return (
                    <View key={poi.id} style={managerStyles.entityCard}>
                      <View style={{ position: 'relative' }}>
                        {poi.imageUrl && (
                          <Image
                            source={{ uri: poi.imageUrl }}
                            style={managerStyles.entityImage}
                          />
                        )}
                        <View style={managerStyles.overlayContainer}>
                          {entity ? (
                            <>
                              {/* Botão para abrir os reviews */}
                              <TouchableOpacity
                                style={managerStyles.overlayButton}
                                onPress={() => handleShowReviews(poi)}
                              >
                                <Text style={managerStyles.overlayButtonText}>Reviews</Text>
                              </TouchableOpacity>
                              {/* Botão para remover a entidade */}
                              <TouchableOpacity
                                style={managerStyles.overlayButton}
                                onPress={() => deleteEntity(entity.id)}
                              >
                                <Text style={managerStyles.overlayButtonText}>Remover</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            entitiesMap.size > 0 && (
                              <View style={managerStyles.overlayButton}>
                                <Text style={managerStyles.overlayButtonText}>
                                  entidade removida
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                      <Text style={managerStyles.entityText}>{poi.title}</Text>
                      {typeof poi.rating === 'number' && (
                        <Text style={{ fontStyle: 'italic', marginTop: 4 }}>
                          Rating atual: {poi.rating}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {pois.length > visibleCount && (
                  <TouchableOpacity
                    onPress={() => setVisibleCount(visibleCount + 5)}
                    style={{ alignSelf: 'center', marginTop: 10 }}
                  >
                    <Text style={{ fontWeight: 'bold' }}>Ver Mais ▼</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {selectedEntity && (
        <Modal visible={showWebView} animationType="slide">
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: '#eee' }}
              onPress={async () => {
                // Ao fechar a modal, atualiza o rating com o valor recebido
                if (selectedPoi) {
                  await syncRatingForPOI(selectedPoi);
                }
                setShowWebView(false);
                setSelectedEntity(null);
                setSelectedPoi(null);
                setCurrentReviewRating(null);
              }}
            >
              <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Fechar</Text>
            </TouchableOpacity>
            {selectedEntity.imageUrl && (
              <Image
                source={{ uri: selectedEntity.imageUrl }}
                style={{ width: '100%', height: 200, resizeMode: 'cover' }}
              />
            )}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 'bold',
                marginVertical: 8,
              }}
            >
              {selectedEntity.title}
            </Text>
            <WebView
              source={{ uri: `${EMBED_URL}/${selectedEntity.id}/reviews?token=${token}` }}
              style={{ flex: 1 }}
              onMessage={async (event) => {
                try {
                  const messageData = JSON.parse(event.nativeEvent.data);
                  console.log('Received messageData:', messageData);
                  if (typeof messageData.rating === 'number' && selectedPoi) {
                    console.log(
                      'Updating rating for POI:',
                      selectedPoi.id,
                      'New rating:',
                      messageData.rating
                    );
                    // Atualiza o estado local imediatamente (atualização otimista)
                    setCurrentReviewRating(messageData.rating);
                    setPois((prev) =>
                      prev.map((p) =>
                        p.id === selectedPoi.id ? { ...p, rating: messageData.rating } : p
                      )
                    );
                    // Atualiza no servidor (usando o rating recebido pela mensagem)
                    await syncRatingForPOI(selectedPoi, messageData.rating);
                  }
                } catch (error) {
                  console.error('Erro ao processar mensagem da WebView:', error);
                }
              }}
            />
          </View>
        </Modal>
      )}

      <View style={managerStyles.bottomNav}>
        <TouchableOpacity onPress={() => handleNavPress('/home')}>
          <View
            style={[
              managerStyles.iconWrapper,
              activeRoute === '/home' && managerStyles.iconActive,
            ]}
          >
            <Image source={require('../assets/home.png')} style={managerStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/search')}>
          <View
            style={[
              managerStyles.iconWrapper,
              activeRoute === '/search' && managerStyles.iconActive,
            ]}
          >
            <Image source={require('../assets/search.png')} style={managerStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/rotas')}>
          <View
            style={[
              managerStyles.iconWrapper,
              activeRoute === '/rotas' && managerStyles.iconActive,
            ]}
          >
            <Image source={require('../assets/localizador.png')} style={managerStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/review')}>
          <View
            style={[
              managerStyles.iconWrapper,
              activeRoute === '/review' && managerStyles.iconActive,
            ]}
          >
            <Image source={require('../assets/star.png')} style={managerStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/account')}>
          <View
            style={[
              managerStyles.iconWrapper,
              activeRoute === '/account' && managerStyles.iconActive,
            ]}
          >
            <Image source={require('../assets/user.png')} style={managerStyles.navIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
