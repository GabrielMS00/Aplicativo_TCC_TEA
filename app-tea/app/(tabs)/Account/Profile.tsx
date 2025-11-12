// app-tea/app/(tabs)/Account/Profile.tsx
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SelectInput } from '../../../components/SelectInput';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getPerfilApi, updatePerfilApi, UpdatePerfilData } from '../../../api/cuidador';
import { getAssistidoByIdApi, updateAssistidoApi, Assistido } from '../../../api/assistidos'; // <-- Atualizado
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { formatCPF, unformatCPF } from '../../../utils/formatters';

// Opções para os novos campos
const suportOptions = [
    { label: 'Não definido', value: '' },
    { label: 'Nível 1', value: '1' },
    { label: 'Nível 2', value: '2' },
    { label: 'Nível 3', value: '3' },
];
const foodSelectivityOptions = [
    { label: 'Não definido', value: '' },
    { label: 'Leve', value: 'leve' },
    { label: 'Moderado', value: 'moderado' },
    { label: 'Alto', value: 'alto' },
];


const Screen = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const isPadrao = user?.tipo_usuario === 'padrao';
    const assistidoId = user?.assistidoIdPadrao;

    // Estados para dados do CUIDADOR
    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [cpf, setCpf] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Estados para dados do ASSISTIDO (só para usuário padrão)
    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividade, setSeletividade] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPerfilData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        let nomeHeader = user.nome;

        // 1. Busca dados do CUIDADOR
        const perfilData = await getPerfilApi();
        if (perfilData) {
            nomeHeader = perfilData.nome;
            setNome(perfilData.nome);
            setEmail(perfilData.email);
            setCpf(formatCPF(perfilData.cpf || ''));
            setDataNascimento(perfilData.data_nascimento ? parseISO(perfilData.data_nascimento) : new Date());
        } else {
            Alert.alert("Erro", "Não foi possível carregar seus dados pessoais.");
        }

        // 2. Se for 'padrao', busca dados do ASSISTIDO FANTASMA
        if (isPadrao && assistidoId) {
            const assistidoData = await getAssistidoByIdApi(assistidoId);
            if (assistidoData) {
                setNome(assistidoData.nome);
                setDataNascimento(parseISO(assistidoData.data_nascimento));
                setSuporte(assistidoData.nivel_suporte);
                setSeletividade(assistidoData.grau_seletividade);
                nomeHeader = assistidoData.nome;
            } else {
                Alert.alert("Erro", "Não foi possível carregar seus dados de perfil (nível/grau).");
            }
        }

        setNome(nomeHeader);
        setIsLoading(false);
    }, [user, isPadrao, assistidoId]);

    useFocusEffect(
        useCallback(() => {
            fetchPerfilData();
        }, [fetchPerfilData])
    );


    const handleChangePassword = () => {
        router.push('/Account/ChangePassword');
    }

    // --- FUNÇÃO "handleResponderQuestionarios" REMOVIDA ---

    const handleSalvar = async () => {
        if (!nome.trim() || !email.trim() || !cpf.trim()) {
            Alert.alert('Erro', 'Nome, e-mail e CPF são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        const formattedCpf = unformatCPF(cpf);
        const formattedDate = format(dataNascimento, 'yyyy-MM-dd');

        // 1. Salva dados do CUIDADOR (Email, CPF)
        // O Nome e DataNasc são salvos na API do Assistido para o 'padrao'
        const updateCuidadorData: UpdatePerfilData = {
            nome: nome.trim(),
            email: email.trim(),
            cpf: formattedCpf,
            data_nascimento: formattedDate,
        };

        const resultCuidador = await updatePerfilApi(updateCuidadorData);

        if (!resultCuidador) {
            setIsSubmitting(false);
            return;
        }

        // 2. Se for usuário padrão, salva também os dados do ASSISTIDO
        if (isPadrao && assistidoId) {
            // ATUALIZADO: Usando a rota de UPDATE completa
            const resultAssistido = await updateAssistidoApi(assistidoId, {
                nome: nome.trim(), // Salva o nome
                data_nascimento: formattedDate, // Salva a data
                nivel_suporte: suporte, // Salva o nível
                grau_seletividade: seletividade // Salva o grau
            });

            if (!resultAssistido) {
                Alert.alert("Erro", "Falha ao salvar dados do perfil (nível/grau).");
                setIsSubmitting(false);
                return;
            }
        }

        setIsSubmitting(false);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    };


    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            setDataNascimento(selectedDate);
        }
    };

    return (
        <View className='flex-1 bg-background'>
            {/* --- HEADER ATUALIZADO --- */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">{nome || 'Usuário'}</Text>
                            <TouchableOpacity onPress={signOut}>
                                <Text className="text-attention text-2xl font-bold pt-5">SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <View className='justify-center items-center p-7'>
                <Text className='text-3xl font-bold text-text'>
                    {isPadrao ? "Meu Perfil" : "Perfil do Cuidador"}
                </Text>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#87CFCF" className="mt-10" />
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
                                    value={cpf}
                                    onChangeText={(text) => setCpf(formatCPF(text))}
                                    keyboardType='numeric'
                                    maxLength={14}
                                />
                            </View>

                            {/* Data de Nascimento */}
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

                            {/* --- CAMPOS CONDICIONAIS PARA USUÁRIO PADRÃO --- */}
                            {isPadrao && (
                                <>
                                    <View className='mb-6'>
                                        <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte (TEA)</Text>
                                        <SelectInput
                                            options={suportOptions}
                                            selectedValue={suporte ?? undefined}
                                            onValueChange={(value: string) => setSuporte(value || null)} // Permite 'Não definido'
                                            placeholder="Selecione o nível..."
                                        />
                                    </View>

                                    <View className='mb-8'>
                                        <Text className='text-xl font-semibold text-text mb-2'>Grau de Seletividade</Text>
                                        <SelectInput
                                            options={foodSelectivityOptions}
                                            selectedValue={seletividade ?? undefined}
                                            onValueChange={(value: string) => setSeletividade(value || null)} // Permite 'Não definido'
                                            placeholder="Selecione o grau..."
                                        />
                                    </View>
                                </>
                            )}

                            {/* --- BOTÃO DE QUESTIONÁRIOS REMOVIDO --- */}

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