import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { FoodCard } from '../../../components/FoodCard';
import { Button } from '../../../components/Button';
import { useRouter, router, useLocalSearchParams, useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { getSugestaoParaRefeicaoApi, SugestaoRefeicaoResponse, SugestaoItem } from '../../../api/sugestoes'; // Importar API

// Função auxiliar para determinar a cor da borda com base no status do item
const getBorderColor = (status: string) => {
    switch (status) {
        case 'base_segura': return '#A6C98C'; // Verde para alimento seguro
        case 'sugerido': return '#87CFCF'; // Azul para sugestão
        case 'vazio': return '#DFE1E2'; // Cinza para item vazio/sem sugestão
        default: return '#DFE1E2'; // Padrão cinza
    }
};

const Screen = () => {
    const router = useRouter();
    // Obtém os parâmetros passados pela rota (ID do assistido e nome da refeição)
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
             Alert.alert("Aviso", "Não foi possível gerar sugestões no momento."); // Informa se não houver sugestões
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
      }, [fetchSugestao]) // Depende da função fetchSugestao memoizada
    );

    // Navega para a tela de avaliação de feedback
    const handleAvaliarSugestoes = () => {
        if (!sugestao || !assistidoId || !mealName) return; // Não faz nada se não houver sugestão

        // Filtra apenas os itens que foram 'sugerido' e possuem os IDs necessários
        const itemsSugeridos = sugestao.itens.filter(
             (item): item is SugestaoItem & { alimentoId: string; perfilId: string } =>
                 item.status === 'sugerido' && !!item.perfilId && !!item.alimentoId
         );

         // Verifica se há itens a serem avaliados
         if (itemsSugeridos.length === 0) {
            Alert.alert("Sem sugestões", "Não há itens sugeridos para avaliar nesta refeição.");
            return;
         }

        // Navega para a tela de Remake, passando os dados necessários como parâmetros
        router.push({
            pathname: '(tabs)/FoodExchange/FoodExchangeRemake', // Caminho da próxima tela
            params: {
                assistidoId: assistidoId,
                mealName: mealName,
                trocaAlimentarId: sugestao.trocaAlimentarId, // ID da troca atual
                suggestionItems: JSON.stringify(itemsSugeridos) // Itens a serem avaliados
            }
        });
    };

    return (
        <View className='flex-1 bg-background p-5'>
            {/* Botão para voltar à tela anterior */}
             <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
                 <Text className="text-primary text-3xl">{'<'} Voltar</Text>
             </TouchableOpacity>

            {/* Título da Refeição */}
            <Text className='text-4xl lg:text-5xl font-extrabold text-text text-center mt-28 mb-8'>
                {mealName || 'Refeição'}
            </Text>

            {/* Exibe indicador de carregamento ou a lista de sugestões */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#87CFCF" className="mt-10" />
            ) : !sugestao || sugestao.itens.length === 0 ? (
                 <Text className='text-text text-xl text-center mt-10'>Nenhuma sugestão encontrada.</Text>
            ) : (
                <ScrollView className='flex-1 mt-6' contentContainerStyle={{ paddingBottom: 80 }}>
                    <View>
                        {/* Mapeia os itens da sugestão para componentes FoodCard */}
                        {sugestao.itens.map((item, index) => (
                            <View
                                key={item.detalheTrocaId || `item-${index}`} // Chave única para cada item
                                style={{ borderLeftWidth: 8, borderLeftColor: getBorderColor(item.status), marginBottom: 15 }}
                                className="w-full bg-card rounded-md shadow" // Estilização do card
                            >
                                <FoodCard
                                    food={item.alimento || "Vazio"} // Nome do alimento
                                    preparation={ // Texto descritivo baseado no status
                                        item.status === 'base_segura' ? 'Alimento Seguro' :
                                        item.status === 'sugerido' ? 'Sugestão' :
                                        item.status === 'vazio' ? 'Sem sugestão' : item.status
                                    }
                                    foodGroup={item.grupo_alimentar} // Grupo alimentar
                                />
                                {/* Mostra o motivo da sugestão se houver */}
                                {item.status === 'sugerido' && item.motivo && (
                                     <Text className="text-xs text-gray-600 px-6 pb-2 -mt-4">{item.motivo}</Text>
                                )}
                             </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Botão para avaliar sugestões, visível apenas se houver itens 'sugerido' */}
             {!isLoading && sugestao?.itens?.some(i => i.status === 'sugerido') && (
                <View className="absolute bottom-5 left-5 right-5">
                    <Button title='Avaliar Sugestões' type='success' onPress={handleAvaliarSugestoes} />
                </View>
            )}
             {/* Mensagem exibida se não houver itens 'sugerido' para avaliar */}
             {!isLoading && sugestao && !sugestao.itens.some(i => i.status === 'sugerido') && sugestao.itens.length > 0 && (
                 <Text className='text-text text-center my-4 pb-5'>Não há novas sugestões para avaliar.</Text>
             )}
        </View>
    );
};

export default Screen;