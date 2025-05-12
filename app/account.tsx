import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { accountStyles } from '../styles/AccountStyles';
import { API_TOKEN, API_ENDPOINT } from '../constants/authConfig';

export default function AccountScreen() {
  const router = useRouter();
  const { user, setUser, setToken } = useAuth();

  // Estado para manter a rota ativa na bottom nav
  const [activeRoute, setActiveRoute] = useState('/account');

  // Estado para contar POIs
  const [addedPoisCount, setAddedPoisCount] = useState(0);

  // Estados para modais
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddPoiModal, setShowAddPoiModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Estados para campos de POI
  const [poiName, setPoiName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [rating, setRating] = useState('');
  const [metadata, setMetadata] = useState('');

  // Estados para edição de perfil
  const [editedNickname, setEditedNickname] = useState('');
  const [editedName, setEditedName] = useState('');

  // Limite de POIs para usuários não-premium
  const POI_LIMIT = 3;
  const isPremium = user?.isPremium || false;

  // Preenche os campos de perfil ao abrir o modal
  useEffect(() => {
    if (user) {
      setEditedNickname(user.nickname || '');
      setEditedName(user.name || '');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleOpenAddPoiModal = () => {
    if (!isPremium && addedPoisCount >= POI_LIMIT) {
      Alert.alert(
        'Limite Atingido',
        `Você só pode adicionar ${POI_LIMIT} POIs na versão gratuita. Torne-se Premium para adicionar mais.`
      );
      return;
    }
    setShowAddPoiModal(true);
  };

  const handleSavePoi = async () => {
    if (!poiName.trim() || !latitude.trim() || !longitude.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha pelo menos Nome, Latitude e Longitude.');
      return;
    }
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const ratingNum = rating ? parseInt(rating, 10) : 0;
    if (isNaN(latNum) || isNaN(lonNum)) {
      Alert.alert('Erro de formato', 'Latitude/Longitude devem ser números válidos.');
      return;
    }
    if (!isPremium && addedPoisCount >= POI_LIMIT) {
      Alert.alert('Limite Atingido', 'Você já atingiu o limite de POIs gratuitos.');
      return;
    }
    try {
      const body = {
        name: poiName.trim(),
        latitude: latNum,
        longitude: lonNum,
        metadata: metadata || '',
        rating: ratingNum,
      };
      const res = await axios.post(
        `${API_ENDPOINT}/points-of-interest`,
        body,
        {
          headers: {
            'X-API-Token': API_TOKEN,
            'Content-Type': 'application/json',
          },
        }
      );
      if (res.status === 201) {
        Alert.alert('Sucesso', 'POI adicionado com sucesso!');
        setAddedPoisCount(prev => prev + 1);
        setShowAddPoiModal(false);
        // Limpa os campos
        setPoiName('');
        setLatitude('');
        setLongitude('');
        setRating('');
        setMetadata('');
      } else {
        Alert.alert('Erro', 'Não foi possível adicionar o POI.');
      }
    } catch (error) {
      console.error('Erro ao adicionar POI:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o POI.');
    }
  };

  const handleSaveProfile = () => {
    setUser({ ...user, nickname: editedNickname, name: editedName });
    Alert.alert('Perfil Atualizado', 'Seus dados foram salvos.');
    setShowProfileModal(false);
  };

  // Função para tratar o clique na bottom nav:
  // Atualiza a rota ativa e navega para a nova rota
  const handleNavPress = (route: string) => {
    setActiveRoute(route);
    router.push(route);
  };

  return (
    <View style={accountStyles.container}>
      {/* Cabeçalho com informações reais do usuário */}
      <View style={accountStyles.header}>
        <Image
          source={{ uri: user?.picture || 'https://via.placeholder.com/150' }}
          style={accountStyles.userIcon}
        />
        <View style={accountStyles.headerTextContainer}>
          <Text style={accountStyles.headerTitle}>
            {user?.nickname || user?.name || 'Conta'}
          </Text>
          <Text style={accountStyles.headerSubtitle}>
            {user?.email || 'Sem informações'}
          </Text>
        </View>
      </View>

      {/* Menu de opções */}
      <View style={accountStyles.menuContainer}>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={() => setShowProfileModal(true)}
        >
          <Image source={require('../assets/user.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={() => alert('Abrir tela de Notificações')}
        >
          <Image source={require('../assets/notification.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Notificações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={() => alert('Abrir tela de Preferências')}
        >
          <Image source={require('../assets/preferencias.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Preferências</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={handleOpenAddPoiModal}
        >
          <Image source={require('../assets/add.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Adicionar POI</Text>
          <Text style={accountStyles.freeBadge}>3 POIs grátis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={() => alert('Funcionalidade Premium em breve!')}
        >
          <Image source={require('../assets/premium.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={accountStyles.menuItem}
          onPress={() => setShowLogoutModal(true)}
        >
          <Image source={require('../assets/logout.png')} style={accountStyles.menuIcon} />
          <Text style={accountStyles.menuText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para editar Perfil */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={accountStyles.modalContainer}>
          <View style={accountStyles.modalContent}>
            <Text style={accountStyles.modalTitle}>Editar Perfil</Text>
            <Text style={accountStyles.modalLabel}>Nickname</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: alentejano123"
              value={editedNickname}
              onChangeText={setEditedNickname}
            />
            <Text style={accountStyles.modalLabel}>Nome</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: Seu Nome"
              value={editedName}
              onChangeText={setEditedName}
            />
            <View style={accountStyles.modalButtons}>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={accountStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={handleSaveProfile}
              >
                <Text style={accountStyles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Logout */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={accountStyles.modalContainer}>
          <View style={accountStyles.modalContent}>
            <Text style={accountStyles.modalTitle}>Confirmação</Text>
            <Text style={accountStyles.modalMessage}>Deseja sair?</Text>
            <View style={accountStyles.modalButtons}>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={handleLogout}
              >
                <Text style={accountStyles.modalButtonText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={accountStyles.modalButtonText}>Não</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Adicionar POI */}
      <Modal visible={showAddPoiModal} transparent animationType="slide">
        <View style={accountStyles.modalContainer}>
          <View style={accountStyles.modalContent}>
            <Text style={accountStyles.modalTitle}>Adicionar POI</Text>
            <Text style={accountStyles.modalLabel}>Nome *</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: Museu de Arte"
              value={poiName}
              onChangeText={setPoiName}
            />
            <Text style={accountStyles.modalLabel}>Latitude *</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: 40.6405"
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
            />
            <Text style={accountStyles.modalLabel}>Longitude *</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: -8.6538"
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
            />
            <Text style={accountStyles.modalLabel}>Rating (opcional)</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: 5"
              keyboardType="numeric"
              value={rating}
              onChangeText={setRating}
            />
            <Text style={accountStyles.modalLabel}>Metadata (opcional)</Text>
            <TextInput
              style={accountStyles.modalInput}
              placeholder="Ex: descrição ou image_url=..."
              value={metadata}
              onChangeText={setMetadata}
            />
            <View style={accountStyles.modalButtons}>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={() => setShowAddPoiModal(false)}
              >
                <Text style={accountStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={accountStyles.modalButton}
                onPress={handleSavePoi}
              >
                <Text style={accountStyles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barra de navegação inferior */}
      <View style={accountStyles.bottomNav}>
        <TouchableOpacity onPress={() => handleNavPress('/home')}>
          <View style={[accountStyles.iconWrapper, activeRoute === '/home' && accountStyles.iconActive]}>
            <Image source={require('../assets/home.png')} style={accountStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/search')}>
          <View style={[accountStyles.iconWrapper, activeRoute === '/search' && accountStyles.iconActive]}>
            <Image source={require('../assets/search.png')} style={accountStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/rotas')}>
          <View style={[accountStyles.iconWrapper, activeRoute === '/rotas' && accountStyles.iconActive]}>
            <Image source={require('../assets/localizador.png')} style={accountStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/review')}>
          <View style={[accountStyles.iconWrapper, activeRoute === '/review' && accountStyles.iconActive]}>
            <Image source={require('../assets/star.png')} style={accountStyles.navIcon} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavPress('/account')}>
          <View style={[accountStyles.iconWrapper, activeRoute === '/account' && accountStyles.iconActive]}>
            <Image source={require('../assets/user.png')} style={accountStyles.navIcon} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}