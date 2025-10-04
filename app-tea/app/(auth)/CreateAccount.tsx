import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

const LoginScreen = () => {
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const handleCancelar = () => {
        router.replace('/');
    }

    return (
        <View className='flex-1 bg-background p-5'>

            <View className='flex-1 justify-center'>

                <Text className='text-5xl font-extrabold text-primary text-center mb-14'>Cadastro</Text>

                <View className='mb-7'>
                    <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                    <Input value={nome} onChangeText={setNome} />
                </View>

                <View className='mb-7'>
                    <Text className='text-xl font-semibold text-text mb-2'>Sobrenome</Text>
                    <Input value={sobrenome} onChangeText={setSobrenome} />
                </View>

                <View className='mb-7'>
                    <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                    <Input value={email} onChangeText={setEmail} />
                </View>

                <View className='mb-7'>
                    <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
                    <Input value={senha} onChangeText={setSenha} />
                </View>

                <View>
                    <Text className='text-xl font-semibold text-text mb-2'>Confirmar Senha</Text>
                    <Input value={confirmarSenha} onChangeText={setConfirmarSenha} />
                </View>

            </View>

            <View className='w-full flex-row justify-between'>
                <Button title='Cancelar' onPress={handleCancelar}/>
                <Button title='Confirmar' type='success' />
            </View>

        </View>
    );
};

export default LoginScreen;
