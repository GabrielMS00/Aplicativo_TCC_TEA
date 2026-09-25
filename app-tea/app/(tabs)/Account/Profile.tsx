import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SelectInput } from '../../../components/SelectInput';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getPerfilApi, updatePerfilApi, UpdatePerfilData } from '../../../api/cuidador';
import { getAssistidoByIdApi, updateAssistidoApi } from '../../../api/assistidos';
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
    { label: 'Não sei informar', value: 'nao_sei' },
];

const Screen = () => {
    const { user, signOut, updateUser } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isPadrao = user?.tipo_usuario === 'padrao';
    const assistidoId = user?.assistidoIdPadrao;

    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [cpf, setCpf] = useState('');
    const [dataNascimentoStr, setDataNascimentoStr] = useState('');

    const [suporte, setSuporte] = useState<string | null>(null);
    const [seletividade, setSeletividade] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Função de máscara de data
    const handleDateChange = (text: string) => {
        let v = text.replace(/\D/g, ''); 
        if (v.length > 8) v = v.slice(0, 8); 
        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setDataNascimentoStr(v);
    };

    // Converte a data do banco para a string formatada do Input
    const formatDbDateToStr = (dbDate: any) => {
        if (!dbDate) return '';
        const dateObj = parseDateToLocal(dbDate);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

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
            setDataNascimentoStr(formatDbDateToStr(perfilData.data_nascimento));
        } else {
            Alert.alert("Erro", "Não foi possível carregar seus dados pessoais.");
        }

        if (isPadrao && assistidoId) {
            const assistidoData = await getAssistidoByIdApi(assistidoId);
            if (assistidoData) {
                setNome(assistidoData.nome);
                setDataNascimentoStr(formatDbDateToStr(assistidoData.data_nascimento));
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

        // Validação da Data de Nascimento
        if (dataNascimentoStr.length !== 10) {
            Alert.alert('Erro', 'Preencha a data de nascimento completa (DD/MM/AAAA).');
            return;
        }

        const [day, month, year] = dataNascimentoStr.split('/');
        const dateObj = new Date(`${year}-${month}-${day}T12:00:00`); 

        if (isNaN(dateObj.getTime()) || Number(day) > 31 || Number(month) > 12 || Number(day) === 0 || Number(month) === 0) {
            Alert.alert('Erro', 'Data de nascimento inválida.');
            return;
        }

        if (dateObj > new Date()) {
            Alert.alert('Erro', 'A data de nascimento não pode ser futura.');
            return;
        }

        setIsSubmitting(true);
        const formattedCpf = unformatCPF(cpf);
        const formattedDate = `${year}-${month}-${day}`; // Prepara para o banco

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

    return (
        <View className='flex-1 bg-background'>
            <View
                className="w-full bg-primary justify-center items-center flex-row pb-8"
                style={{ paddingTop: insets.top + 24 }}
            >
                <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1">
                        <View className="ml-4 flex-1">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold" numberOfLines={1}>{nome || 'Usuário'}</Text>
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

                            {/* NOVO CAMPO DE DATA COM MÁSCARA */}
                            <View className='mb-8'>
                                <Text className='text-xl font-semibold text-text mb-2'>Data de Nascimento</Text>
                                <Input 
                                    value={dataNascimentoStr} 
                                    onChangeText={handleDateChange} 
                                    placeholder="DD/MM/AAAA" 
                                    keyboardType="numeric" 
                                    maxLength={10}
                                />
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

            <View
                className='flex-row justify-around items-center w-full p-4'
                style={{ paddingBottom: insets.bottom + 16 }}
            >
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
