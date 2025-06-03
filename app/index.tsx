import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { loginstyles } from '../styles/LoginStyles';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../context/AuthContext';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '../constants/authConfig';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setToken } = useAuth();

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'wayly',
    path: 'callback'
  });

  const discovery = {
    authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
    tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
    revocationEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code',
      usePKCE: true,
      extraParams: {
        audience: `https://${AUTH0_DOMAIN}/api/v2/`,
      },
    },
    discovery
  );

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      if (response?.type === 'success' && response.params.code) {
        try {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId: AUTH0_CLIENT_ID,
              code: response.params.code,
              redirectUri,
              extraParams: {
                code_verifier: request?.codeVerifier ?? '',
              },
            },
            discovery
          );

          console.log('✅ Access Token:', tokenResult.accessToken);
          setToken(tokenResult.accessToken);

          // Obtém os dados reais do usuário
          const userInfoUrl = `https://${AUTH0_DOMAIN}/userinfo`;
          console.log('FETCH URL:', userInfoUrl);
          const userInfoResponse = await fetch(
            userInfoUrl,
            { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } }
          );
          const userInfo = await userInfoResponse.json();
          console.log('User Info:', userInfo);
          setUser(userInfo);

          router.push('/home');
        } catch (err) {
          console.error('Erro ao obter token ou perfil:', err);
          Alert.alert('Erro', 'Não foi possível autenticar.');
        }
      } else if (response?.type === 'error') {
        Alert.alert('Login Falhou', 'Erro na autenticação.');
      }
    };

    exchangeCodeForToken();
  }, [response]);

  return (
    <View style={loginstyles.container}>
      <Image source={require('../assets/logo.png')} style={loginstyles.logo} />
      <Text style={loginstyles.title}>Wayly</Text>

      <TouchableOpacity
        onPress={() => promptAsync()}
        style={loginstyles.button}
        disabled={!request}
      >
        <Text style={loginstyles.buttonText}>Entrar com Auth0</Text>
      </TouchableOpacity>
    </View>
  );
}
