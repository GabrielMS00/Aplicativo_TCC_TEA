import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { router } from 'expo-router';

const LoginScreen = () => {
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const handleCancelar = () => {
        router.replace('/');
    }

    return (
        <View className='flex-1 bg-background p-5'>

            <Text className='text-5xl font-extrabold text-primary text-center pt-20'>Cadastro</Text>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >

                <ScrollView>

                    <View className='flex-1 justify-center pt-14'>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                            <Input value={nome} onChangeText={setNome} />
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>cpf</Text>
                            <Input value={cpf} onChangeText={setCpf} keyboardType='numeric' />
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                            <Input value={email} onChangeText={setEmail} />
                        </View>

                        <View className='mb-5'>
                            <Text className='text-xl font-semibold text-text mb-2'>Senha</Text>
                            <Input value={senha} onChangeText={setSenha} secureTextEntry />
                        </View>

                        <View>
                            <Text className='text-xl font-semibold text-text mb-2'>Confirmar Senha</Text>
                            <Input value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />
                        </View>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

            <View className='w-full flex-row justify-between'>
                <Button title='Cancelar' onPress={handleCancelar} />
                <Button title='Confirmar' type='success' />
            </View>

        </View >
    );
};

export default LoginScreen;
