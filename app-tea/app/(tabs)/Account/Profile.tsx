import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, } from 'react-native';
import { useState } from 'react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useRouter } from 'expo-router';

const Screen = () => {

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');

    const router = useRouter();

    const handleChangePassword = () => {
        router.replace('/Account/ChangePassword');
    }


    return (
        <View className='flex-1 bg-background'>

            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">Gabriel</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className='justify-center items-center p-7'>
                <Text className='text-3xl font-bold text-text'>Edição de dados</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >

                <ScrollView className='p-5'>

                    <View className='pt-6'>
                        <View className='mb-8'>
                            <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                            <Input value={nome} onChangeText={setNome} />
                        </View>

                        <View className='mb-8'>
                            <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                            <Input value={email} onChangeText={setEmail} keyboardType="email-address" />
                        </View>

                        <View className='mb-8'>
                            <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                            <Input value={cpf} onChangeText={setCpf} keyboardType='numeric' />
                        </View>

                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

            <View className='flex-row justify-around items-center w-full p-4'>

                <Button title='Alterar Senha' onPress={handleChangePassword} />
                <Button title='Salvar' type='success' onPress={() => Alert.alert('Salvou')} />

            </View>

        </View>
    );
};

export default Screen;
