import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useRouter } from 'expo-router';
import { recoverPasswordApi } from '../../api/auth';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [palavraSeguranca, setPalavraSeguranca] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRecover = async () => {
    if (!email || !palavraSeguranca || !novaSenha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 8) {
      Alert.alert('Erro', 'A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setIsLoading(true);
    const response = await recoverPasswordApi({
      email: email.trim(),
      palavra_seguranca: palavraSeguranca.trim(),
      nova_senha: novaSenha
    });
    setIsLoading(false);

    if (response && response.message) {
      Alert.alert('Sucesso', response.message, [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    }
    // O apiClient já exibe erros automaticamente se response for null/error
  };

  return (
    <View className='flex-1 bg-background p-5 justify-center'>
      <Text className='text-3xl font-extrabold text-primary text-center mb-8'>Recuperar Senha</Text>

      <View className='mb-4'>
        <Text className='text-xl font-semibold text-text mb-2'>E-mail Cadastrado</Text>
        <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" />
      </View>

      <View className='mb-4'>
        <Text className='text-xl font-semibold text-text mb-2'>Palavra de Segurança</Text>
        <Input value={palavraSeguranca} onChangeText={setPalavraSeguranca} placeholder="Sua palavra secreta" />
      </View>

      <View className='mb-8'>
        <Text className='text-xl font-semibold text-text mb-2'>Nova Senha</Text>
        <Input value={novaSenha} onChangeText={setNovaSenha} secureTextEntry placeholder="Nova senha (mín 8 caracteres)" />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#87CFCF" />
      ) : (
        <>
          <Button title='Redefinir Senha' type='success' onPress={handleRecover} />
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-center text-gray-500 text-lg">Voltar ao Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ForgotPasswordScreen;