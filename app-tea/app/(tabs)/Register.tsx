import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { SelectInput } from '../../components/SelectInput';
import { Button } from '../../components/Button';

const Screen = () => {
    const [nome, setNome] = useState('');
    const [idade, setIdade] = useState('');
    const [suporte, setSuporte] = useState('');
    const [seletividadeAlimentar, setSeletividadeAlimentar] = useState('');

    const router = useRouter();

    const handleProsseguir = () => {
        router.replace('../(tabs)/Home');
    }

    const suportOptions = [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
    ];

    const foodSelectivityOptions = [
        { label: 'leve', value: 'leve' },
        { label: 'moderado', value: 'moderado' },
        { label: 'alto', value: 'alto' },
    ];

    return (
        <View className='flex-1 bg-background p-5'>

            <View className='flex-1 justify-center'>

                <Text className='text-5xl font-extrabold text-text text-center mt-16'>Cadastro de assistido</Text>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >

                    <ScrollView>

                        <View className='pt-14'>
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                                <Input value={nome} onChangeText={setNome} />
                            </View>

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Idade</Text>
                                <Input value={idade} onChangeText={setIdade} keyboardType='numeric' />
                            </View>

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte</Text>
                                <SelectInput
                                    options={suportOptions}
                                    selectedValue={suporte}
                                    onValueChange={(value: string) => setSuporte(value)}
                                />
                            </View>

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Grau de Seletividade Alimentar</Text>
                                <SelectInput
                                    options={foodSelectivityOptions}
                                    selectedValue={seletividadeAlimentar}
                                    onValueChange={(value: string) => setSeletividadeAlimentar(value)}
                                />
                            </View>
                        </View>

                    </ScrollView>

                </KeyboardAvoidingView>

            </View>

            <Button title='Prosseguir' type='success' onPress={handleProsseguir} />

        </View>
    );
};

export default Screen;
