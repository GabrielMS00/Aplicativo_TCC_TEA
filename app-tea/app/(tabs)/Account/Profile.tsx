import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState, useCallback } from 'react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SelectInput } from '../../../components/SelectInput';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getPerfilApi, updatePerfilApi, UpdatePerfilData } from '../../../api/cuidador';
import { getAssistidoByIdApi, updateAssistidoApi } from '../../../api/assistidos';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { formatCPF, unformatCPF, parseDateToLocal } from '../../../utils/formatters';


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
    { label: 'Não sei informar', value: 'nao_sei' }, // Opção adicionada
];

const Screen = () => {
    const { user, signOut, updateUser } = useAuth();
    const router = useRouter();
    const isPadrao = user?.tipo_usuario === 'padrao';
    const assistidoId = user?.assistidoIdPadrao;

    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [cpf, setCpf] = useState('');
    const [dataNascimento, setDataNascimento] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividade, setSeletividade] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPerfilData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        let nomeHeader = user.nome;

        const perfilData = await getPerfilApi();
        if (perfilData) {
            nomeHeader = perfilData.nome;
            setNome(perfilData.nome);
            setEmail(perfilData.email);
            setCpf(formatCPF(perfilData.cpf || ''));
            setDataNascimento(parseDateToLocal(perfilData.data_nascimento));
        } else {
            Alert.alert("Erro", "Não foi possível carregar seus dados pessoais.");
        }

        if (isPadrao && assistidoId) {
            const assistidoData = await getAssistidoByIdApi(assistidoId);
            if (assistidoData) {
                setNome(assistidoData.nome);
                setDataNascimento(parseDateToLocal(assistidoData.data_nascimento));
                setSuporte(assistidoData.nivel_suporte);
                setSeletividade(assistidoData.grau_seletividade);
                nomeHeader = assistidoData.nome;
            } else {
                Alert.alert("Erro", "Não foi possível carregar seus dados de perfil.");
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

    const handleViewReport = () => {
        if (assistidoId) {
            router.push({
                pathname: '/Reports/ViewReport',
                params: { assistidoId: assistidoId }
            });
        } else {
            Alert.alert("Erro", "ID do perfil não encontrado.");
        }
    };

    const handleSalvar = async () => {
        if (!nome.trim() || !email.trim() || !cpf.trim()) {
            Alert.alert('Erro', 'Nome, e-mail e CPF são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        const formattedCpf = unformatCPF(cpf);
        const formattedDate = format(dataNascimento, 'yyyy-MM-dd');

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

        await updateUser({
            nome: updateCuidadorData.nome,
            email: updateCuidadorData.email,
            cpf: updateCuidadorData.cpf,
            data_nascimento: updateCuidadorData.data_nascimento
        });
        if (isPadrao && assistidoId) {
            const resultAssistido = await updateAssistidoApi(assistidoId, {
                nome: nome.trim(),
                data_nascimento: formattedDate,
                nivel_suporte: suporte,
                grau_seletividade: seletividade
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

            <View className='justify-center items-center p-5 pb-0'>
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
                        <View className='pt-2'>

                            {isPadrao && (
                                <View className="mb-6 mt-2">
                                    <Button title="📄 Ver Meu Relatório de Trocas" type="default" onPress={handleViewReport} />
                                </View>
                            )}

                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Nome</Text>
                                <Input value={nome} onChangeText={setNome} />
                            </View>
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>E-mail</Text>
                                <Input value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize='none' />
                            </View>
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>CPF</Text>
                                <Input
                                    value={cpf}
                                    onChangeText={(text) => setCpf(formatCPF(text))}
                                    keyboardType='numeric'
                                    maxLength={14}
                                />
                            </View>

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

                            {isPadrao && (
                                <>
                                    <View className='mb-6'>
                                        <Text className='text-xl font-semibold text-text mb-2'>Nível de Suporte (TEA)</Text>
                                        <SelectInput
                                            options={suportOptions}
                                            selectedValue={suporte ?? undefined}
                                            onValueChange={(value: string) => setSuporte(value || null)}
                                            placeholder="Selecione o nível..."
                                        />
                                    </View>

                                    <View className='mb-8'>
                                        <Text className='text-xl font-semibold text-text mb-2'>Grau de Seletividade</Text>
                                        <SelectInput
                                            options={foodSelectivityOptions}
                                            selectedValue={seletividade ?? undefined}
                                            onValueChange={(value: string) => setSeletividade(value || null)}
                                            placeholder="Selecione o grau..."
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            )}

            <View className='flex-row justify-around items-center w-full p-4 mb-5'>
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