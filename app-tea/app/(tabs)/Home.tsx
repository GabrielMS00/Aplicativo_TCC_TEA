// app-tea/app/(tabs)/Home.tsx
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { WatchedCard } from '../../components/WatchedCard';
import React, { useState, useEffect, useCallback } from 'react'; // Importar useCallback
import { CardData } from '../../types/CardData'; // Certifique-se que CardData.ts define suporte como string
import { router, useFocusEffect } from 'expo-router'; // Importar useFocusEffect
import { getAssistidosApi, deleteAssistidoApi, Assistido } from '../../api/assistidos'; // Importar API
import { useAuth } from '../../context/AuthContext'; // Para pegar nome do cuidador e signOut

// Função para calcular idade (simplificada) - Colocada fora do componente
const calcularIdade = (dataNascimento: string): string => {
    try {
        // Validação básica do formato YYYY-MM-DD
        if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return 'N/I';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        // Verifica se a data é válida
        if (isNaN(nascimento.getTime())) return 'N/I';

        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade >= 0 ? idade.toString() : 'N/A'; // Retorna N/A se a idade for negativa (data futura)
    } catch (e) {
        console.error("Erro ao calcular idade:", e); // Loga o erro
        return 'N/A';
    }
};

const Screen = () => {
    const { user, signOut } = useAuth(); // Pegar usuário logado e função signOut
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAssistido, setSelectedAssistido] = useState<{ id: string; name: string } | null>(null);
    const [assistidos, setAssistidos] = useState<Assistido[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Função para buscar assistidos, usando useCallback para otimização com useFocusEffect
    const fetchAssistidos = useCallback(async () => {
        setIsLoading(true);
        const data = await getAssistidosApi();
        // Garante que o estado sempre seja um array
        setAssistidos(Array.isArray(data) ? data : []);
        setIsLoading(false);
    }, []); // Sem dependências, a função não muda entre renders

    // useFocusEffect para buscar dados sempre que a tela ganhar foco
    useFocusEffect(
        useCallback(() => {
            fetchAssistidos();
            // Função de cleanup opcional (não necessária aqui)
            // return () => console.log("Screen unfocused");
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
            // Navega para a tela inicial de trocas, passando o ID do assistido
            // Ajuste o pathname se a pasta FoodExchange não estiver dentro de (tabs)
            router.push({
                pathname: '(tabs)/FoodExchange/MealOption',
                params: { assistidoId: selectedAssistido.id }
            });
            handleCloseModal();
        }
    };

    const handleNavigateToUpdate = () => {
         if (selectedAssistido) {
            // TODO: Criar e navegar para a tela de edição de assistido
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
                            handleCloseModal(); // Fecha antes de tentar excluir
                            setIsLoading(true); // Mostra loading na lista
                            const result = await deleteAssistidoApi(assistidoIdToDelete);
                            setIsLoading(false); // Esconde loading após a tentativa
                            if (result) {
                                Alert.alert("Sucesso", result.message);
                                // Remove o item da lista localmente para feedback visual
                                setAssistidos(prev => prev.filter(a => a.id !== assistidoIdToDelete));
                            }
                            // O erro já é tratado e exibido pelo apiClient
                        }
                    }
                ]
            );
        }
    };

     // >>> FUNÇÃO MOVIDA PARA ANTES DO RETURN <<<
     const renderAssistidoCard = ({ item }: { item: Assistido }) => {
        const cardData: CardData = {
            id: item.id,
            name: item.nome,
            idade: calcularIdade(item.data_nascimento),
            // Garante que sempre passamos uma string. Usa 'N/I' se for null/undefined/vazio.
            suporte: item.nivel_suporte || 'N/I', // <<< Fallback para string aqui
            onPressOptions: handleOpenModal, // A função passada para o Card chama handleOpenModal
        };
        // O onPress dentro do Card chamará handleOpenModal com id e nome
        return <WatchedCard {...cardData} />;
    };


    return (
        <View className='flex-1 bg-background'>

            {/* Header */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            {/* Mostra o nome do usuário logado */}
                            <Text className="text-text text-4xl font-bold">{user?.nome || 'Usuário'}</Text>
                            {/* Botão Sair */}
                            <TouchableOpacity onPress={signOut}>
                                <Text className="text-attention text-2xl font-bold pt-5">SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Conteúdo Principal */}
            <View className='flex-1 p-5'>
                {isLoading && assistidos.length === 0 ? ( // Mostra loading apenas no carregamento inicial
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#87CFCF" />
                    </View>
                ) : !isLoading && assistidos.length === 0 ? ( // Mensagem se não houver assistidos após carregar
                    <View className="flex-1 justify-center items-center">
                         <Text className='text-text text-xl'>Ainda não há assistidos cadastrados!</Text>
                         <Text className='text-text text-lg mt-2'>Use a aba 'Cadastrar'.</Text>
                    </View>
                ) : ( // Exibe a lista
                    <FlatList
                        data={assistidos}
                        renderItem={renderAssistidoCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }} // Espaçamento inferior
                        // Adiciona um refresh control simples (opcional)
                        refreshing={isLoading}
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
                {/* Permite fechar clicando fora */}
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseModal}>
                    <View className="flex-1 justify-center items-center bg-black/50">
                        {/* Evita que o clique no conteúdo feche o modal */}
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

                                {/* Botão Fechar */}
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