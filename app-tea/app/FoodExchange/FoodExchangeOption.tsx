import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Modal, Pressable } from 'react-native';
import React, { useState, useCallback } from 'react';
import { Button } from '../../components/Button';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getSugestaoParaRefeicaoApi, SugestaoRefeicaoResponse, SugestaoItem } from '../../api/sugestoes';
import { Feather } from '@expo/vector-icons';

// Cores mais discretas e funcionais
const getBorderColor = (status: string) => {
    switch (status) {
        case 'base_segura': return '#A6C98C'; // Verde (Conforto)
        case 'sugerido': return '#87CFCF';    // Azul (Sugestão)
        default: return '#DFE1E2';            // Cinza (Vazio)
    }
};

const Screen = () => {
    const router = useRouter();
    const { assistidoId, mealName } = useLocalSearchParams<{ assistidoId?: string; mealName?: string }>();

    const [sugestao, setSugestao] = useState<SugestaoRefeicaoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [infoVisible, setInfoVisible] = useState(false);

    const fetchSugestao = useCallback(async () => {
        if (!assistidoId || !mealName) {
            Alert.alert("Erro", "ID do assistido ou nome da refeição inválido.");
            setIsLoading(false);
            if (router.canGoBack()) router.back();
            return;
        }
        setIsLoading(true);
        const data = await getSugestaoParaRefeicaoApi(assistidoId, mealName);
        setSugestao(data);
        if (!data) {
            Alert.alert("Aviso", "Não foi possível gerar sugestões no momento.");
        }
        setIsLoading(false);
    }, [assistidoId, mealName]);

    useFocusEffect(
        useCallback(() => {
            fetchSugestao();
        }, [fetchSugestao])
    );

    const handleAvaliarSugestoes = () => {
        if (!sugestao || !sugestao.itens || !assistidoId || !mealName) return;

        const itemsParaAvaliar = sugestao.itens.filter(
            (item): item is SugestaoItem & { alimentoId: string; perfilId: string } =>
                (item.status === 'sugerido' || item.status === 'base_segura') && !!item.perfilId && !!item.alimentoId
        );

        if (itemsParaAvaliar.length === 0) {
            Alert.alert("Sem itens", "Não há itens para avaliar nesta refeição.");
            return;
        }

        router.push({
            pathname: '/FoodExchange/FoodExchangeRemake',
            params: {
                assistidoId: assistidoId,
                mealName: mealName,
                trocaAlimentarId: sugestao.trocaAlimentarId,
                suggestionItems: JSON.stringify(itemsParaAvaliar)
            }
        });
    };

    return (
        <View className='flex-1 bg-background p-5'>
            <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
                <Text className="text-primary text-3xl">{'<'} Voltar</Text>
            </TouchableOpacity>

            {/* Título com Botão de Informação */}
            <View className="mt-28 mb-8 flex-row justify-center items-center">
                <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mr-3'>
                    {mealName || 'Refeição'}
                </Text>
                <TouchableOpacity onPress={() => setInfoVisible(true)} hitSlop={20}>
                    <Feather name="info" size={26} color="#87CFCF" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#87CFCF" className="mt-10" />
            ) : !sugestao || sugestao.itens.length === 0 ? (
                <Text className='text-text text-xl text-center mt-10'>Nenhuma sugestão encontrada.</Text>
            ) : (
                <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 100 }}>
                    <View>
                        {sugestao.itens.map((item, index) => (
                            <View
                                key={item.detalheTrocaId || `item-${index}`}
                                style={{
                                    borderLeftWidth: 8,
                                    borderLeftColor: getBorderColor(item.status),
                                    marginBottom: 15,
                                    backgroundColor: 'white', // Garante fundo branco no card
                                    borderRadius: 8,
                                    // Sombra leve
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    elevation: 2
                                }}
                            >
                                <View className="p-4">
                                    {/* Nome do Alimento e Grupo */}
                                    <Text className="font-bold text-2xl pb-1 text-text">
                                        {item.alimento}
                                    </Text>
                                    <Text className="text-lg text-gray-600 mb-2">
                                        {item.grupo_alimentar}
                                    </Text>

                                    {/* Motivo (Discreto) */}
                                    {item.motivo && (
                                        <Text className="text-sm text-gray-500 italic">
                                            {item.motivo}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {!isLoading && sugestao && sugestao.itens.length > 0 && (
                <View className="absolute bottom-5 left-5 right-5">
                    <Button title='Avaliar Refeição' type='success' onPress={handleAvaliarSugestoes} />
                </View>
            )}

            {/* Modal de Explicação - Texto Neutro e Detalhado */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={infoVisible}
                onRequestClose={() => setInfoVisible(false)}
            >
                <Pressable
                    className="flex-1 bg-black/60 justify-center items-center p-5"
                    onPress={() => setInfoVisible(false)}
                >
                    <Pressable className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl" onPress={(e) => e.stopPropagation()}>
                        <Text className="text-2xl font-extrabold text-primary mb-6 text-center">
                            Como sugerimos?
                        </Text>

                        {/* Passo 1: Similaridade (Bridging) */}
                        <View className="mb-5 flex-row">
                            <Text className="text-2xl mr-3">🔎</Text>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-text mb-1">1. Ponte Sensorial</Text>
                                <Text className="text-base text-gray-600 leading-5">
                                    Analisamos o que já é aceito e buscamos opções com texturas, cores ou sabores parecidos.
                                </Text>
                            </View>
                        </View>

                        {/* Passo 2: Templates (Nutrição) */}
                        <View className="mb-5 flex-row">
                            <Text className="text-2xl mr-3">🍽️</Text>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-text mb-1">2. Estrutura do Prato</Text>
                                <Text className="text-base text-gray-600 leading-5">
                                    Mantemos o equilíbrio nutricional sugerindo os grupos corretos para cada horário (ex: Proteína e Vegetais).
                                </Text>
                            </View>
                        </View>

                        {/* Passo 3: Base Segura (Segurança) */}
                        <View className="mb-8 flex-row">
                            <Text className="text-2xl mr-3">😌</Text>
                            <View className="flex-1">
                                <Text className="text-lg font-bold text-text mb-1">3. Segurança</Text>
                                <Text className="text-base text-gray-600 leading-5">
                                    Misturamos novidades com alimentos já conhecidos ("Base Segura") para reduzir a ansiedade na hora de comer.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            className="bg-primary py-3 rounded-xl shadow-sm"
                            onPress={() => setInfoVisible(false)}
                        >
                            <Text className="text-white text-center font-bold text-lg">Entendi</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default Screen;