import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { WatchedCard } from '../../components/WatchedCard';
import React, { useState, useEffect, useCallback } from 'react';
import { CardData } from '../../types/CardData';
import { router, useFocusEffect } from 'expo-router';
import { getAssistidosApi, deleteAssistidoApi, Assistido } from '../../api/assistidos';
import { useAuth } from '../../context/AuthContext';

// Função para calcular idade (simplificada) - Colocada fora do componente
const calcularIdade = (dataNascimento: string): string => {
    try {
        if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return 'N/I';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        if (isNaN(nascimento.getTime())) return 'N/I';

        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade >= 0 ? idade.toString() : 'N/A';
    } catch (e) {
        console.error("Erro ao calcular idade:", e);
        return 'N/A';
    }
};

const Screen = () => {
    const { user, signOut } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAssistido, setSelectedAssistido] = useState<{ id: string; name: string } | null>(null);
    const [assistidos, setAssistidos] = useState<Assistido[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Começa como true

    // Função para buscar assistidos 
    const fetchAssistidos = useCallback(async () => {
        if (!user) {
            console.log("[Home] Aguardando usuário...");
            setIsLoading(true);
            return; // Não faz nada se o usuário não estiver carregado
        }

        setIsLoading(true);

        // --- LÓGICA DE ROTEAMENTO ---
        if (user.tipo_usuario === 'padrao') {
            if (user.assistidoIdPadrao) {
                // Se é padrão e temos o ID, redireciona direto
                console.log(`[Home] Usuário padrão detectado. Redirecionando para MealOption com assistidoId: ${user.assistidoIdPadrao}`);
                router.replace({
                    pathname: '/FoodExchange/MealOption',
                    params: { assistidoId: user.assistidoIdPadrao }
                });
                // Não precisa setar loading false ou buscar dados, pois estamos saindo
                return;
            } else {
                // Fallback de segurança: Isso não deveria acontecer se o login/registro funcionou.
                console.error("[Home] Usuário padrão não tem assistidoIdPadrao no contexto!");
                Alert.alert("Erro de Perfil", "Não foi possível carregar seu perfil. Tente fazer login novamente.");
                setIsLoading(false);
                signOut(); // Força o logout
                return;
            }
        }

        // --- FLUXO CUIDADOR (lógica antiga) ---
        console.log("[Home] Usuário cuidador detectado. Buscando assistidos...");
        const data = await getAssistidosApi();
        setAssistidos(Array.isArray(data) ? data : []);
        setIsLoading(false);

    }, [user, router, signOut]); // Depende do 'user'

    // useFocusEffect para buscar dados sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            fetchAssistidos();
        }, [fetchAssistidos]) // Depende da função memoizada fetchAssistidos
    );

    const handleOpenModal = (assistidoId: string, assistidoName: string) => {
        setSelectedAssistido({ id: assistidoId, name: assistidoName });
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedAssistido(null);
    };

    const handleNavigateToTrocas = () => {
        if (selectedAssistido) {
            router.push({
                pathname: '/FoodExchange/MealOption',
                params: { assistidoId: selectedAssistido.id }
            });
            handleCloseModal();
        }
    };

    const handleNavigateToUpdate = () => {
        if (selectedAssistido) {
            Alert.alert("Editar", "Funcionalidade de edição ainda não implementada.");
            handleCloseModal();
        }
    };

    const handleDeleteAssistido = () => {
        if (selectedAssistido) {
            Alert.alert(
                "Confirmar Exclusão",
                `Tem certeza que deseja excluir ${selectedAssistido.name}? Esta ação não pode ser desfeita.`,
                [
                    { text: "Cancelar", style: "cancel", onPress: handleCloseModal },
                    {
                        text: "Excluir", style: "destructive",
                        onPress: async () => {
                            const assistidoIdToDelete = selectedAssistido.id;
                            handleCloseModal();
                            setIsLoading(true);
                            const result = await deleteAssistidoApi(assistidoIdToDelete);
                            setIsLoading(false);
                            if (result) {
                                Alert.alert("Sucesso", result.message);
                                setAssistidos(prev => prev.filter(a => a.id !== assistidoIdToDelete));
                            }
                        }
                    }
                ]
            );
        }
    };

    const renderAssistidoCard = ({ item }: { item: Assistido }) => {
        const cardData: CardData = {
            id: item.id,
            name: item.nome,
            idade: calcularIdade(item.data_nascimento),
            suporte: item.nivel_suporte || 'N/I',
            onPressOptions: handleOpenModal,
        };
        return <WatchedCard {...cardData} />;
    };

    // Se isLoading ou for usuário 'padrao', mostra o loading.
    // O 'useFocusEffect' cuidará do redirecionamento do usuário 'padrao'.
    if (isLoading || user?.tipo_usuario === 'padrao') {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#87CFCF" />
                {user?.tipo_usuario === 'padrao' && (
                    <Text className="text-text text-lg mt-4">Carregando seu perfil...</Text>
                )}
            </View>
        );
    }

    // O resto da renderização só será alcançado se for 'cuidador' e não estiver carregando
    return (
        <View className='flex-1 bg-background'>

            {/* Header */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            <Text className="text-text text-4xl font-bold">{user?.nome || 'Usuário'}</Text>
                            <TouchableOpacity onPress={signOut}>
                                <Text className="text-attention text-2xl font-bold pt-5">SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Conteúdo Principal (Agora só para cuidadores) */}
            <View className='flex-1 p-5'>
                {assistidos.length === 0 ? ( // Não precisa mais do !isLoading aqui
                    <View className="flex-1 justify-center items-center">
                        <Text className='text-text text-xl'>Ainda não há assistidos cadastrados!</Text>
                        <Text className='text-text text-lg mt-2'>Use a aba 'Cadastrar'.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={assistidos}
                        renderItem={renderAssistidoCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshing={isLoading} // O loading da lista ainda é útil
                        onRefresh={fetchAssistidos}
                    />
                )}
            </View>

            {/* Modal de Opções */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                {/* ... (Conteúdo do Modal - mantido) ... */}
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseModal}>
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View className="w-4/5 bg-modal rounded-xl p-6 items-center shadow-lg min-h-[240px]">
                                <Text className="text-2xl text-white font-bold mb-6 text-center">
                                    {selectedAssistido?.name}
                                </Text>

                                <TouchableOpacity onPress={handleNavigateToTrocas} className="mb-4 w-full items-center py-2">
                                    <Text className="text-xl color-secondary font-semibold">Ver Trocas Alimentares</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleNavigateToUpdate} className="mb-4 w-full items-center py-2">
                                    <Text className="text-xl color-secondary font-semibold">Atualizar dados</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDeleteAssistido} className="mb-4 w-full items-center py-2">
                                    <Text className="text-xl color-attention font-semibold">Apagar assistido</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-primary rounded-lg px-8 py-2 mt-4"
                                    onPress={handleCloseModal}
                                >
                                    <Text className="text-white font-bold text-base">Fechar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
};

export default Screen;