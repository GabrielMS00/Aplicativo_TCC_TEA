// app-tea/app/(tabs)/Home.tsx
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { WatchedCard } from '../../components/WatchedCard';
import React, { useState, useEffect, useCallback } from 'react';
import { CardData } from '../../types/CardData'; // Tipo que define os dados esperados pelo WatchedCard
import { router, useFocusEffect } from 'expo-router'; // Hooks para navegação e foco da tela
import { getAssistidosApi, deleteAssistidoApi, Assistido } from '../../api/assistidos'; // Funções da API para assistidos
import { useAuth } from '../../context/AuthContext'; // Hook para acessar dados de autenticação (usuário, token, logout)

// Função auxiliar para calcular a idade a partir da data de nascimento (formato AAAA-MM-DD)
const calcularIdade = (dataNascimento: string): string => {
    try {
        // Valida se a data existe e está no formato esperado
        if (!dataNascimento || !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) return 'N/I';
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        // Verifica se a data convertida é válida
        if (isNaN(nascimento.getTime())) return 'N/I';

        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        // Ajusta a idade se ainda não fez aniversário no ano corrente
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        // Retorna a idade ou 'N/A' se for inválida (ex: data futura)
        return idade >= 0 ? idade.toString() : 'N/A';
    } catch (e) {
        console.error("Erro ao calcular idade:", e);
        return 'N/A'; // Retorna 'N/A' em caso de erro
    }
};

// Componente principal da tela Home
const Screen = () => {
    // Obtém dados do usuário logado, função de logout e token do contexto de autenticação
    const { user, signOut, token } = useAuth();
    // Estado para controlar a visibilidade do modal de opções
    const [modalVisible, setModalVisible] = useState(false);
    // Estado para armazenar o ID e nome do assistido selecionado no modal
    const [selectedAssistido, setSelectedAssistido] = useState<{ id: string; name: string } | null>(null);
    // Estado para armazenar a lista de assistidos buscada da API
    const [assistidos, setAssistidos] = useState<Assistido[]>([]);
    // Estado para controlar o indicador de carregamento (loading)
    const [isLoading, setIsLoading] = useState(false); // Inicia como false
    // Estado para controlar se a busca inicial já foi tentada
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

    // Função memoizada para buscar a lista de assistidos da API
    const fetchAssistidos = useCallback(async () => {
        // Só busca se houver um token (usuário logado)
        if (!token) {
            console.log("Home.tsx: Sem token, busca de assistidos ignorada.");
            setAssistidos([]); // Limpa a lista
            setIsLoading(false);
            setHasAttemptedFetch(true); // Marca que tentou buscar (ou pulou por falta de token)
            return;
        }

        console.log("Home.tsx: Token encontrado, buscando assistidos...");
        setIsLoading(true);
        setHasAttemptedFetch(true);
        const data = await getAssistidosApi(); // Chama a API
        setAssistidos(Array.isArray(data) ? data : []); // Atualiza o estado (garante que seja um array)
        setIsLoading(false);
    }, [token]); // Recria a função se o token mudar

    // Hook que executa a busca de dados sempre que a tela recebe foco
    useFocusEffect(
        useCallback(() => {
            // Verifica se tem token e se a busca ainda não foi tentada nesta "sessão" da tela
            if (token && !hasAttemptedFetch) {
                 fetchAssistidos();
            } else if (!token) {
                 // Limpa dados se o token desaparecer (ex: logout)
                 setAssistidos([]);
                 setHasAttemptedFetch(false); // Permite buscar novamente se re-logar
            }
        }, [token, fetchAssistidos, hasAttemptedFetch]) // Dependências do efeito
    );

    // Abre o modal de opções para o assistido selecionado
    const handleOpenModal = (assistidoId: string, assistidoName: string) => {
        setSelectedAssistido({ id: assistidoId, name: assistidoName });
        setModalVisible(true);
    };

    // Fecha o modal de opções
    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedAssistido(null);
    };

    // Navega para a tela de seleção de refeição para troca alimentar
    const handleNavigateToTrocas = () => {
        if (selectedAssistido) {
            router.push({
                pathname: '(tabs)/FoodExchange/MealOption', // Caminho para a tela de opções de refeição
                params: { assistidoId: selectedAssistido.id } // Passa o ID do assistido selecionado
            });
            handleCloseModal(); // Fecha o modal após navegar
        }
    };

    // Placeholder para a funcionalidade de editar assistido
    const handleNavigateToUpdate = () => {
         if (selectedAssistido) {
            Alert.alert("Editar", "Funcionalidade de edição ainda não implementada."); // Aviso temporário
            handleCloseModal();
        }
    };

     // Lida com a exclusão de um assistido, incluindo confirmação
     const handleDeleteAssistido = () => {
        if (selectedAssistido) {
            Alert.alert(
                "Confirmar Exclusão", // Título do Alerta
                `Tem certeza que deseja excluir ${selectedAssistido.name}?`, // Mensagem
                [ // Botões do Alerta
                    { text: "Cancelar", style: "cancel", onPress: handleCloseModal }, // Botão Cancelar
                    {
                        text: "Excluir", style: "destructive", // Botão Excluir (vermelho)
                        onPress: async () => { // Ação ao clicar em Excluir
                            const assistidoIdToDelete = selectedAssistido.id;
                            handleCloseModal();
                            setIsLoading(true); // Ativa loading na lista
                            const result = await deleteAssistidoApi(assistidoIdToDelete); // Chama a API de exclusão
                            setIsLoading(false); // Desativa loading
                            if (result) {
                                Alert.alert("Sucesso", result.message); // Mostra mensagem de sucesso
                                // Remove o assistido da lista no estado local para atualização visual
                                setAssistidos(prev => prev.filter(a => a.id !== assistidoIdToDelete));
                            }
                            // Erros da API são tratados pelo apiClient
                        }
                    }
                ]
            );
        }
    };

     // Função que renderiza cada item (assistido) na FlatList
     const renderAssistidoCard = ({ item }: { item: Assistido }) => {
        // Mapeia os dados do assistido (API) para o formato esperado pelo componente WatchedCard
        const cardData: CardData = {
            id: item.id,
            name: item.nome,
            idade: calcularIdade(item.data_nascimento),
            // Usa o nível de suporte ou 'N/I' como fallback (garante que é string)
            suporte: item.nivel_suporte || 'N/I',
            onPressOptions: handleOpenModal, // Passa a função para abrir o modal
        };
        // Retorna o componente WatchedCard com os dados e a ação ao clicar nos '...'
        return <WatchedCard {...cardData} onPressOptions={handleOpenModal} />;
    };

    // JSX do componente
    return (
        <View className='flex-1 bg-background'>

            {/* Cabeçalho da Tela */}
            <View className="w-full bg-primary h-60 justify-center items-center flex-row">
                 <View className="w-full px-6 flex-row justify-between items-center">
                    <View className="flex-row items-center ">
                        <View className="ml-4">
                            <Text className="text-text text-2xl">Olá,</Text>
                            {/* Exibe o nome do cuidador logado */}
                            <Text className="text-text text-4xl font-bold">{user?.nome || 'Usuário'}</Text>
                            {/* Botão para deslogar */}
                            <TouchableOpacity onPress={signOut}>
                                <Text className="text-attention text-2xl font-bold pt-5">SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Corpo Principal (Lista de Assistidos ou Mensagens) */}
            <View className='flex-1 p-5'>
                {/* Mostra loading apenas no primeiro carregamento */}
                {isLoading && assistidos.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#87CFCF" />
                    </View>
                /* Mostra mensagem se a busca foi tentada e não há assistidos */
                ) : hasAttemptedFetch && assistidos.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                         <Text className='text-text text-xl'>Nenhum assistido cadastrado.</Text>
                         <Text className='text-text text-lg mt-2'>Use a aba 'Cadastrar'.</Text>
                    </View>
                ) : ( // Exibe a lista de assistidos usando FlatList
                    <FlatList
                        data={assistidos} // Array de assistidos vindo do estado
                        renderItem={renderAssistidoCard} // Função para renderizar cada item
                        keyExtractor={item => item.id} // Chave única para cada item
                        contentContainerStyle={{ paddingBottom: 20 }} // Espaçamento no final da lista
                        refreshing={isLoading} // Controla o indicador de "puxar para atualizar"
                        onRefresh={fetchAssistidos} // Função chamada ao puxar para atualizar
                    />
                )}
            </View>

            {/* Modal de Opções do Assistido */}
             <Modal
                transparent={true} // Fundo transparente
                visible={modalVisible} // Controlado pelo estado modalVisible
                animationType="fade" // Animação de fade
                onRequestClose={handleCloseModal} // Ação ao pressionar o botão voltar (Android)
             >
                {/* Overlay semi-transparente que fecha o modal ao clicar fora */}
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCloseModal}>
                    <View className="flex-1 justify-center items-center bg-black/50">
                        {/* Container do conteúdo do modal (impede o fechamento ao clicar nele) */}
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View className="w-4/5 bg-modal rounded-xl p-6 items-center shadow-lg min-h-[240px]">
                                {/* Nome do Assistido Selecionado */}
                                <Text className="text-2xl text-white font-bold mb-6 text-center">
                                    {selectedAssistido?.name}
                                </Text>

                                {/* Opções do Modal */}
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