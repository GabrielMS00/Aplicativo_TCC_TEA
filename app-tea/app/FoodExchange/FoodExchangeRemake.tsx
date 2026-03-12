import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from '../../components/Button';
import { router, useLocalSearchParams } from 'expo-router';
import { processarFeedbackESugerirNovaApi, FeedbackItem, SugestaoItem } from '../../api/sugestoes';

// Tipo de estado interno para rastrear o feedback de cada item
type FeedbackStatus = 'aceito' | 'recusado' | 'sugerido';

// Mapeia o ID do item (detalheTrocaId) para seu estado de feedback
type FeedbackState = Record<string, FeedbackStatus>;

// Interface ajustada para os dados recebidos
interface FoodFeedbackItem extends SugestaoItem {
}

const Screen = () => {
    const { assistidoId, mealName, trocaAlimentarId, suggestionItems: suggestionItemsString } = useLocalSearchParams<{
        assistidoId?: string;
        mealName?: string;
        trocaAlimentarId?: string;
        suggestionItems?: string;
    }>();

    const [foodList, setFoodList] = useState<FoodFeedbackItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [feedbackStatus, setFeedbackStatus] = useState<FeedbackState>({});

    useEffect(() => {
        if (suggestionItemsString) {
            try {
                const parsedItems: SugestaoItem[] = JSON.parse(suggestionItemsString);

                setFoodList(parsedItems.map(item => ({
                    ...item,
                    alimentoId: item.alimentoId || '',
                    perfilId: item.perfilId || '',
                })));

                // Inicializa o estado de feedback: todos os itens começam como 'sugerido' (Não Tentei)
                const initialState: FeedbackState = {};
                for (const item of parsedItems) {
                    initialState[item.detalheTrocaId] = 'sugerido';
                }
                setFeedbackStatus(initialState);

            } catch (error) {
                console.error("Erro ao parsear suggestionItems:", error);
                Alert.alert("Erro", "Não foi possível carregar os itens da sugestão para avaliação.");
                if (router.canGoBack()) router.back();
            }
        } else if (!isSubmitting) {
            Alert.alert("Erro", "Nenhum item de sugestão recebido para avaliação.");
            if (router.canGoBack()) router.back();
        }
    }, [suggestionItemsString]);


    // Manipulador para os botões de feedback
    const handleFeedbackChange = (detalheTrocaId: string, newStatus: FeedbackStatus) => {
        setFeedbackStatus(currentStatus => ({
            ...currentStatus,
            [detalheTrocaId]: newStatus,
        }));
    };

    const handleProsseguir = async () => {
        if (!assistidoId || !mealName || foodList.length === 0) {
            Alert.alert("Erro", "Dados insuficientes para enviar o feedback.");
            return;
        }

        setIsSubmitting(true);

        // Filtra apenas os itens que tiveram feedback ativo ('aceito' ou 'recusado')
        const feedbackParaApi: FeedbackItem[] = [];

        for (const item of foodList) {
            const status = feedbackStatus[item.detalheTrocaId];

            // Só envia para a API se o status for 'aceito' ou 'recusado'
            if (status === 'aceito' || status === 'recusado') {
                feedbackParaApi.push({
                    detalheTrocaId: item.detalheTrocaId,
                    status: status,
                    alimentoId: item.alimentoId as string,
                    perfilId: item.perfilId as string,
                });
            }
        }

        const novaSugestao = await processarFeedbackESugerirNovaApi(assistidoId, mealName, feedbackParaApi);

        setIsSubmitting(false);

        if (novaSugestao !== null) {
            Alert.alert("Feedback Enviado", "A sugestão foi atualizada.");
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace({ pathname: '(tabs)/FoodExchange/MealOption', params: { assistidoId } });
            }
        }
    };

    // Renderiza cada item da lista de avaliação
    const renderFeedbackItem = ({ item }: { item: FoodFeedbackItem }) => {
        const currentStatus = feedbackStatus[item.detalheTrocaId];
        const foodName = item.alimento?.split(' (')[0] || 'Alimento inválido';

        return (
            <View style={styles.card}>
                <Text style={styles.foodName}>{foodName}</Text>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[
                            styles.button,
                            currentStatus === 'aceito' ? styles.aceitoActive : styles.aceitoInactive
                        ]}
                        onPress={() => handleFeedbackChange(item.detalheTrocaId, 'aceito')}
                    >
                        <Text style={[
                            styles.buttonTextBase,
                            currentStatus === 'aceito' ? styles.activeButtonText : styles.aceitoInactiveText
                        ]}>✓</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={1}
                        style={[
                            styles.button,
                            currentStatus === 'sugerido' ? styles.naoTenteiActive : styles.naoTenteiInactive
                        ]}
                        onPress={() => handleFeedbackChange(item.detalheTrocaId, 'sugerido')}
                    >
                        <Text style={[
                            styles.buttonTextBase,
                            currentStatus === 'sugerido' ? styles.activeButtonText : styles.naoTenteiInactiveText
                        ]}>?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={1}
                        style={[
                            styles.button,
                            currentStatus === 'recusado' ? styles.recuseiActive : styles.recuseiInactive
                        ]}
                        onPress={() => handleFeedbackChange(item.detalheTrocaId, 'recusado')}
                    >
                        <Text style={[
                            styles.buttonTextBase,
                            currentStatus === 'recusado' ? styles.activeButtonText : styles.recuseiInactiveText
                        ]}>X</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className='flex-1 bg-background p-5'>
            <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
                <Text className="text-primary text-3xl">{'<'} Voltar</Text>
            </TouchableOpacity>

            <Text className='text-3xl lg:text-4xl font-extrabold text-text text-center mt-28 mb-2'>
                Avaliar Sugestões ({mealName})
            </Text>

            <Text className='text-lg font-semibold text-text text-center mb-8'>
                Como foi a aceitação desta refeição?
            </Text>

            <View className="mb-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <View className="flex-row justify-around">
                    <View className="flex-row items-center">
                        <View style={[styles.legendIcon, styles.aceitoActive]}>
                            <Text style={styles.legendIconText}>✓</Text>
                        </View>
                        <Text className="text-text">Aceitei</Text>
                    </View>

                    <View className="flex-row items-center">
                        <View style={[styles.legendIcon, styles.naoTenteiActive]}>
                            <Text style={styles.legendIconText}>?</Text>
                        </View>
                        <Text className="text-text">Não Tentei</Text>
                    </View>

                    <View className="flex-row items-center">
                        <View style={[styles.legendIcon, styles.recuseiActive]}>
                            <Text style={styles.legendIconText}>X</Text>
                        </View>
                        <Text className="text-text">Recusei</Text>
                    </View>
                </View>
            </View>


            {foodList.length === 0 ? (
                <Text className='text-text text-xl text-center mt-10'>Carregando...</Text>
            ) : (
                <FlatList
                    data={foodList}
                    keyExtractor={item => item.detalheTrocaId}
                    renderItem={renderFeedbackItem}
                    className='flex-1'
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            <View className="absolute bottom-5 left-5 right-5">
                {isSubmitting ? (
                    <ActivityIndicator size="large" color="#A6C98C" />
                ) : (
                    <Button
                        title='Confirmar Avaliação'
                        type='success'
                        onPress={handleProsseguir}
                        disabled={isSubmitting}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 15,
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DFE1E2',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    foodName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        flex: 1,
    },
    buttonGroup: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    legendIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    legendIconText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 2,
    },
    buttonTextBase: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeButtonText: {
        color: 'white',
    },

    aceitoActive: {
        backgroundColor: '#A6C98C',
        borderColor: '#A6C98C',
    },
    aceitoInactive: {
        backgroundColor: 'transparent',
        borderColor: '#A6C98C',
    },
    aceitoInactiveText: {
        color: '#A6C98C',
    },

    naoTenteiActive: {
        backgroundColor: '#87CFCF',
        borderColor: '#87CFCF',
    },
    naoTenteiInactive: {
        backgroundColor: 'transparent',
        borderColor: '#87CFCF',
    },
    naoTenteiInactiveText: {
        color: '#87CFCF',
    },

    recuseiActive: {
        backgroundColor: '#F16038',
        borderColor: '#F16038',
    },
    recuseiInactive: {
        backgroundColor: 'transparent',
        borderColor: '#F16038',
    },
    recuseiInactiveText: {
        color: '#F16038',
    },
});

export default Screen;