import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'; // Add TouchableOpacity
import { Button } from '../../components/Button';
import { FoodCardChecable } from '../../components/FoodCardChecable';
import { router, useLocalSearchParams } from 'expo-router';
import { processarFeedbackESugerirNovaApi, FeedbackItem, SugestaoItem } from '../../api/sugestoes';

// Interface ajustada para incluir isChecked localmente
interface FoodFeedbackItem extends SugestaoItem {
    isChecked: boolean;
}

const Screen = () => {
    const { assistidoId, mealName, trocaAlimentarId, suggestionItems: suggestionItemsString } = useLocalSearchParams<{
        assistidoId?: string;
        mealName?: string;
        trocaAlimentarId?: string; // ID da sugestão original que está sendo avaliada
        suggestionItems?: string;
    }>();

    const [foodList, setFoodList] = useState<FoodFeedbackItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (suggestionItemsString) {
            try {
                // Tipagem explícita para os itens parseados
                const parsedItems: SugestaoItem[] = JSON.parse(suggestionItemsString);
                // Mapeia para o estado local, garantindo que todos os campos existam
                setFoodList(parsedItems.map(item => ({
                    ...item,
                    // Garante que campos opcionais tenham um valor padrão se não vierem (embora a query deva trazer)
                    alimentoId: item.alimentoId || '',
                    perfilId: item.perfilId || '',
                    isChecked: false, // Inicializa como não checado (recusado)
                })));
            } catch (error) {
                console.error("Erro ao parsear suggestionItems:", error);
                Alert.alert("Erro", "Não foi possível carregar os itens da sugestão para avaliação.");
                if (router.canGoBack()) router.back(); // Volta se der erro ao carregar
            }
        } else if (!isSubmitting) { // Evita alerta se estiver submetendo
            Alert.alert("Erro", "Nenhum item de sugestão recebido para avaliação.");
            if (router.canGoBack()) router.back();
        }
    }, [suggestionItemsString]); // Roda apenas quando a string de itens muda


    const handleCheckChange = (detalheTrocaIdClicado: string, newValue: boolean) => {
        setFoodList(currentFoodList =>
            currentFoodList.map(food =>
                food.detalheTrocaId === detalheTrocaIdClicado
                    ? { ...food, isChecked: newValue }
                    : food
            )
        );
    };

    const handleProsseguir = async () => {
        if (!assistidoId || !mealName || foodList.length === 0) {
            Alert.alert("Erro", "Dados insuficientes para enviar o feedback.");
            return;
        }

        setIsSubmitting(true);

        const feedbackParaApi: FeedbackItem[] = foodList.map(item => ({
            detalheTrocaId: item.detalheTrocaId,
            status: item.isChecked ? 'aceito' : 'recusado',
            alimentoId: item.alimentoId as string, // Envia SEMPRE
            perfilId: item.perfilId as string,     // Envia SEMPRE  
        }));


        // Chama a API. A resposta será a *nova* sugestão ou null.
        const novaSugestao = await processarFeedbackESugerirNovaApi(assistidoId, mealName, feedbackParaApi);

        setIsSubmitting(false);

        if (novaSugestao !== null) { // Verifica se a API não retornou erro
            Alert.alert("Feedback Enviado", "A sugestão foi atualizada.");
            // Volta para a tela anterior (FoodExchangeOption), que vai recarregar
            if (router.canGoBack()) {
                router.back();
            } else {
                // Fallback: vai para a tela de opções de refeição se não puder voltar
                router.replace({ pathname: '(tabs)/FoodExchange/MealOption', params: { assistidoId } });
            }
        }
        // Erro já tratado no apiClient
    };

    return (
        <View className='flex-1 bg-background p-5'>
            {/* Botão Voltar (Adicionado) */}
            <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
                <Text className="text-primary text-3xl">{'<'} Voltar</Text>
            </TouchableOpacity>

            <Text className='text-3xl lg:text-4xl font-extrabold text-text text-center mt-28 mb-2'>
                Avaliar Sugestões ({mealName})
            </Text>

            <Text className='text-lg font-semibold text-text text-center mb-8'>
                Marque os alimentos que foram aceitos.
            </Text>

            {foodList.length === 0 ? (
                <Text className='text-text text-xl text-center mt-10'>Carregando...</Text>
            ) : (
                <FlatList
                    data={foodList}
                    keyExtractor={item => item.detalheTrocaId}
                    renderItem={({ item }) => (
                        <FoodCardChecable
                            // Mostra apenas o nome do alimento
                            foodName={item.alimento?.split(' (')[0] || 'Alimento inválido'}
                            isChecked={item.isChecked}
                            onValueChange={(newValue) => handleCheckChange(item.detalheTrocaId, newValue)}
                        />
                    )}
                    className='flex-1 mt-6'
                    contentContainerStyle={{ paddingBottom: 80 }} // Aumenta padding para não cobrir botão
                />
            )}

            {/* Botão sempre visível, mas pode estar desabilitado pelo loading */}
            <View className="absolute bottom-5 left-5 right-5">
                {isSubmitting ? (
                    <ActivityIndicator size="large" color="#A6C98C" />
                ) : (
                    <Button
                        title='Confirmar Avaliação'
                        type='success'
                        onPress={handleProsseguir}
                        disabled={isSubmitting} // Desabilita durante o envio
                    />
                )}
            </View>

        </View>
    );
};

export default Screen;