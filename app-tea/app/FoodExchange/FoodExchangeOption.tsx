import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { FoodCard } from '../../components/FoodCard';
import { Button } from '../../components/Button';
import { useRouter, router, useLocalSearchParams, useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { getSugestaoParaRefeicaoApi, SugestaoRefeicaoResponse, SugestaoItem } from '../../api/sugestoes'; // Importar API

// Função auxiliar para determinar a cor da borda com base no status do item
const getBorderColor = (status: string) => {
    switch (status) {
        case 'base_segura': return '#A6C98C';
        case 'sugerido': return '#87CFCF';
        case 'vazio': return '#DFE1E2';
        default: return '#DFE1E2';
    }
};

const Screen = () => {
    const router = useRouter();
    const { assistidoId, mealName } = useLocalSearchParams<{ assistidoId?: string; mealName?: string }>();

    const [sugestao, setSugestao] = useState<SugestaoRefeicaoResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Função assíncrona para buscar a sugestão da API
    const fetchSugestao = useCallback(async () => {
        // Verifica se os parâmetros necessários estão presentes
        if (!assistidoId || !mealName) {
            Alert.alert("Erro", "ID do assistido ou nome da refeição inválido.");
            setIsLoading(false);
            if (router.canGoBack()) router.back(); // Volta se houver erro nos parâmetros
            return;
        }
        setIsLoading(true); // Ativa o indicador de carregamento
        // Chama a API para obter a sugestão
        const data = await getSugestaoParaRefeicaoApi(assistidoId, mealName);
        setSugestao(data); // Atualiza o estado com a sugestão recebida (ou null)
        if (!data) {
            Alert.alert("Aviso", "Não foi possível gerar sugestões no momento.");
        }
        setIsLoading(false); // Desativa o indicador de carregamento
    }, [assistidoId, mealName]); // Recria a função se os parâmetros mudarem

    // Hook que executa a busca de sugestão sempre que a tela recebe foco
    useFocusEffect(
        useCallback(() => {
            // Define e chama a função assíncrona para buscar os dados
            const loadData = async () => {
                await fetchSugestao();
            };
            loadData();
        }, [fetchSugestao])
    );


    const handleAvaliarSugestoes = () => {
        if (!sugestao || !sugestao.itens || !assistidoId || !mealName) {
            Alert.alert("Erro", "Não foi possível carregar os dados da sugestão para avaliação.");
            return;
        }

        const itemsParaAvaliar = sugestao.itens.filter(
            (item): item is SugestaoItem & { alimentoId: string; perfilId: string } =>
                (item.status === 'sugerido' || item.status === 'base_segura') && !!item.perfilId && !!item.alimentoId
        );

        if (itemsParaAvaliar.length === 0) {
            Alert.alert("Sem itens", "Não há itens para avaliar nesta refeição.");
            return;
        }

        // Navega para a tela de Remake, passando os dados necessários como parâmetros
        router.push({
            pathname: '/FoodExchange/FoodExchangeRemake', // Navega para a próxima tela no mesmo stack
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

            <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mt-28 mb-8'>
                {mealName || 'Refeição'}
            </Text>

            {isLoading ? (
                <ActivityIndicator size="large" color="#87CFCF" className="mt-10" />
            ) : !sugestao || sugestao.itens.length === 0 ? (
                <Text className='text-text text-xl text-center mt-10'>Nenhuma sugestão encontrada.</Text>
            ) : (
                <ScrollView className='flex-1 mt-6' contentContainerStyle={{ paddingBottom: 80 }}>
                    <View>
                        {sugestao.itens.map((item, index) => (
                            <View
                                key={item.detalheTrocaId || `item-${index}`} // Chave única para cada item
                                style={{ borderLeftWidth: 8, borderLeftColor: getBorderColor(item.status), marginBottom: 15 }}
                                className="w-full bg-card rounded-md shadow"
                            >
                                <FoodCard
                                    food={item.alimento || "Vazio"}
                                    preparation={
                                        item.status === 'base_segura' ? 'Alimento Seguro' :
                                            item.status === 'sugerido' ? 'Sugestão' :
                                                item.status === 'vazio' ? 'Sem sugestão' : item.status
                                    }
                                    foodGroup={item.grupo_alimentar}
                                />
                                {item.status === 'sugerido' && item.motivo && (
                                    <Text className="text-xs text-gray-600 px-6 pb-2 -mt-4">{item.motivo}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {!isLoading && sugestao && sugestao.itens.length > 0 && (
                <>
                    {sugestao.itens.some(i => (i.status === 'sugerido' || i.status === 'base_segura') && !!i.perfilId) ? (
                        <View className="absolute bottom-5 left-5 right-5">
                            <Button title='Avaliar Refeição' type='success' onPress={handleAvaliarSugestoes} />
                        </View>
                    ) : (
                        <Text className='text-text text-center my-4 pb-5'>
                            Não há itens para avaliar no momento.
                        </Text>
                    )}
                </>
            )}
        </View>
    );
};

export default Screen;