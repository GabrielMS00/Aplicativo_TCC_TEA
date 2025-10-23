import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MainButton } from '../../components/MainButton';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';

const LoginScreen = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const router = useRouter();

  const handleCadastrar = () => {
    router.replace('/CreateAccount');
  }

  const handleEntrar = () => {
    router.replace('../(tabs)/Home');
  }

  return (
    <View className='flex-1 bg-background p-5'>

      <View className='flex-1 justify-center'>

        <Text className='text-5xl font-extrabold text-primary text-center mb-14'>Login</Text>

          <View className='mb-8'>
            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
            <Input value={usuario} onChangeText={setUsuario} />
          </View>

          <View className='mb-8'>
            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
            <Input value={senha} onChangeText={setSenha} secureTextEntry />
          </View>

          <View className='mt-5'>
            <TouchableOpacity
              onPress={() => Alert.alert("Clicou em Esqueci minha senha")}
            >
              <Text className='text-base font-extrabold text-text mb-2'>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCadastrar}
            >
              <Text className='text-base font-extrabold text-text mb-2'>Cadastre-se</Text>
            </TouchableOpacity>
          </View>

      </View>

      <MainButton title='Entrar' onPress={handleEntrar} />

    </View>
  );
};

export default LoginScreen;
