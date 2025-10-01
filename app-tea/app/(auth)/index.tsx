import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

const LoginScreen = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  return (
    <View className='flex-1 bg-background px-5'>

      <View className='flex-1 justify-center'>

        <Text className='text-5xl font-extrabold text-primary text-center mb-14'>Login</Text>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>Usuário</Text>
          <TextInput
            className='bg-white rounded-lg px-4 py-4 text-base'
            value={usuario}
            onChangeText={setUsuario}
            placeholder=""
          />
        </View>

        <View className='mb-8'>
          <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
          <TextInput
            className='bg-white rounded-lg px-4 py-4 text-base'
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder=""
          />
        </View>

        <View className='mt-5'>
          <TouchableOpacity
            onPress={() => Alert.alert("Clicou em Esqueci minha senha")}
          >
            <Text className='text-base font-extrabold text-text mb-2'>Esqueci minha senha</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert("Clicou em Cadastre-se")}
          >
            <Text className='text-base font-extrabold text-text mb-2'>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </View>

      <TouchableOpacity
        onPress={() => Alert.alert("Clicou em Entrar")}
      >
        <Text className='text-5xl font-bold text-success text-center mb-28'>Entrar</Text>
      </TouchableOpacity>

    </View>
  );
};

export default LoginScreen;
