import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { loginstyles } from '../styles/LoginStyles';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    function handleRegister() {
        if (!username || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Todos os campos são obrigatórios.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        Alert.alert('Sucesso', 'Conta registrada com sucesso!');
        router.push('/'); 
    }

    return (
        <View style={loginstyles.container}>
            <Image source={require('../assets/logo.png')} style={loginstyles.logo} />
            <Text style={loginstyles.title}>Wayly</Text>

            <TextInput
                style={loginstyles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={loginstyles.input}
                placeholder="email or phone number"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={loginstyles.input}
                placeholder="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={loginstyles.input}
                placeholder="confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity onPress={handleRegister} style={loginstyles.button}>
                <Text style={loginstyles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/')}>
                <Text style={loginstyles.registerText}>Já tem uma conta? Faça login</Text>
            </TouchableOpacity>
        </View>
    );
}
