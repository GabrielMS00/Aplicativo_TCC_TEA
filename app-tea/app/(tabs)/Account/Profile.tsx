import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; 
import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getPerfilApi, updatePerfilApi, UpdatePerfilData } from '../../../api/cuidador'; 
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; 
import { format, parseISO } from 'date-fns'; 

import { formatCPF, unformatCPF } from '../../../utils/formatters'; 


const Screen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [cpf, setCpf] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date()); // Use Date type
    const [showDatePicker, setShowDatePicker] = useState(false); // State for date picker visibility

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPerfil = async () => {
            setIsLoading(true);
            const perfilData = await getPerfilApi();
            if (perfilData) {
                setNome(perfilData.nome);
                setEmail(perfilData.email);
                setCpf(formatCPF(perfilData.cpf || ''));
                // Parse the date string from API (assuming YYYY-MM-DD) into a Date object
                setDataNascimento(perfilData.data_nascimento ? parseISO(perfilData.data_nascimento) : new Date());
            } else {
                 setNome(user?.nome || '');
                 setEmail(user?.email || '');
                 setDataNascimento(new Date()); // Fallback
            }
            setIsLoading(false);
        };
        fetchPerfil();
    }, [user]);

    const handleChangePassword = () => {
        router.push('/Account/ChangePassword');
    }

    const handleSalvar = async () => {
        if (!nome.trim() || !email.trim() || !cpf.trim()) {
            Alert.alert('Erro', 'Nome, e-mail e CPF são obrigatórios.');
            return;
        }
       

        setIsSubmitting(true);
        const formattedCpf = cpf.replace(/[^\d]/g, '');
        
        const formattedDate = format(dataNascimento, 'yyyy-MM-dd');

        const updateData: UpdatePerfilData = {
            nome: nome.trim(),
            email: email.trim(),
            cpf: formattedCpf,
            data_nascimento: formattedDate,
        };

        const result = await updatePerfilApi(updateData);
        setIsSubmitting(false);

        if (result) {
            Alert.alert('Sucesso', result.message);
            
        }
    };

    
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setDataNascimento(selectedDate); 
        }
    };

    return (
        <View className='flex-1 bg-background'>
            {/* Header */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                 <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">{nome || 'Usuário'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className='justify-center items-center p-7'>
                <Text className='text-3xl font-bold text-text'>Edição de dados</Text>
            </View>

            {isLoading ? (
                 <ActivityIndicator size="large" color="#87CFCF" className="mt-10"/>
             ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView className='p-5'>
                        <View className='pt-6'>
                            {/* Nome */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                                <Input value={nome} onChangeText={setNome} />
                            </View>
                            {/* E-mail */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize='none' />
                            </View>
                            {/* CPF */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                                <Input
                                    value={cpf} // Usa o estado local (já formatado)
                                    // Formata enquanto o usuário digita
                                    onChangeText={(text) => setCpf(formatCPF(text))} // <--- FORMATAR AQUI
                                    keyboardType='numeric'
                                    maxLength={14} // Ajustar maxLength para incluir a máscara
                                />
                            </View>

                            {/* Data de Nascimento - Replaced Input */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg px-4 py-4'>
                                    <Text className='text-xl'>{format(dataNascimento, 'dd/MM/yyyy')}</Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={dataNascimento}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
             )}

            {/* Botões */}
            <View className='flex-row justify-around items-center w-full p-4'>
                 {isSubmitting ? (
                    <ActivityIndicator size="small" color="#A6C98C" />
                 ) : (
                    <>
                        <Button title='Alterar Senha' onPress={handleChangePassword} />
                        <Button title='Salvar' type='success' onPress={handleSalvar} />
                    </>
                 )}
            </View>
        </View>
    );
};

export default Screen;