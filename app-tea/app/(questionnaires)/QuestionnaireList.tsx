// app/questionnaires/QuestionnaireList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/Button';
// import { getModelosQuestionarioApi, ModeloQuestionario } from '../../api/questionarios'; // API real comentada

// Interface para o modelo (mantida)
interface ModeloQuestionario {
    id: string;
    nome: string;
}

const QuestionnaireListScreen = () => {
    const router = useRouter();
    const { assistidoId, assistidoNome } = useLocalSearchParams<{ assistidoId?: string; assistidoNome?: string }>();
    const [modelos, setModelos] = useState<ModeloQuestionario[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModelos = async () => {
            if (!assistidoId) {
                Alert.alert("Erro Simulado", "ID do assistido não recebido (simulado)."); // Mensagem simulada
                setIsLoading(false);
                if (router.canGoBack()) router.back();
                return;
            }
            setIsLoading(true);
            console.log(`(Simulado) Buscando modelos de questionário...`);

            // --- Simulação de chamada API com dados estáticos ---
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da rede
            const dataSimulada: ModeloQuestionario[] = [
                 { id: 'uuid-qfa', nome: 'Frequência Alimentar' },
                 { id: 'uuid-bambi', nome: 'Questionário BAMBI' },
                 { id: 'uuid-step', nome: 'STEP-CHILD' },
                 // Adicione mais se precisar testar a rolagem
            ];
            // --- Fim da Simulação ---

            // const data = await getModelosQuestionarioApi(); // Chamada real comentada

            setModelos(dataSimulada); // Usa os dados simulados
            setIsLoading(false);
        };

        fetchModelos();
    }, [assistidoId]);

    // Navega para a tela de responder (sem alterações)
    const handleSelectQuestionnaire = (modeloId: string, nomeQuestionario: string) => {
         if (!assistidoId) return;
         router.push({
             pathname: '/questionnaires/QuestionnaireScreen',
             params: { assistidoId, assistidoNome, modeloQuestionarioId: modeloId, nomeQuestionario }
         });
    };

    // Navega de volta para a Home (sem alterações)
    const handleConcluir = () => {
        router.replace('/(tabs)/Home');
    }

    // Exibe loading (sem alterações)
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    // Renderiza a tela principal (sem alterações no JSX principal)
    return (
        <View className='flex-1 bg-background p-5 pt-20'>
            <Text className='text-3xl font-bold text-text text-center mb-4'>
                Questionários para {assistidoNome || 'Assistido'}
            </Text>
             <Text className='text-lg text-text text-center mb-8'>
                Responda os questionários abaixo.
            </Text>

            <FlatList
                data={modelos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-card p-4 rounded-lg mb-4 border-l-4 border-primary"
                        onPress={() => handleSelectQuestionnaire(item.id, item.nome)}
                    >
                        <Text className="text-xl font-semibold text-text">{item.nome}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            <View className="absolute bottom-5 left-5 right-5">
                <Button title="Concluir e Voltar para Home" type="success" onPress={handleConcluir} />
            </View>
        </View>
    );
};

export default QuestionnaireListScreen;