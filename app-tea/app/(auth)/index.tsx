import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MainButtom } from '../../components/MainButtom';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';

const LoginScreen = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const router = useRouter();

  const handleEntrar = () => {
    router.replace('/CreateAccount');
  }

  return (
    <View className='flex-1 bg-background p-5'>

      <View className='flex-1 justify-center'>

        <Text className='text-5xl font-extrabold text-primary text-center mb-14'>Login</Text>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>Usuário</Text>
          <Input value={usuario} onChangeText={setUsuario}/>
        </View>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
          <Input value={senha} onChangeText={setSenha} secureTextEntry/>
        </View>

        <View className='mt-5'>
          <TouchableOpacity
            onPress={() => Alert.alert("Clicou em Esqueci minha senha")}
          >
            <Text className='text-base font-extrabold text-text mb-2'>Esqueci minha senha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEntrar}
          >
            <Text className='text-base font-extrabold text-text mb-2'>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </View>

      <MainButtom title='Entrar'/>

    </View>
  );
};

export default LoginScreen;
