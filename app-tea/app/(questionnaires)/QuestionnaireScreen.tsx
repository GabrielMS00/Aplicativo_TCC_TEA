// app/questionnaires/QuestionnaireScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/Button';
// import { getModeloCompletoApi, salvarRespostasApi, PerguntaComOpcoes, RespostaPayloadItem } from '../../api/questionarios'; // API real comentada

// Interfaces (mantidas)
interface OpcaoResposta {
    id: string;
    texto_opcao: string;
}
interface PerguntaComOpcoes {
    id: string;
    texto_pergunta: string;
    opcoes: OpcaoResposta[];
}
interface RespostaPayloadItem {
    pergunta_id: string;
    opcao_id: string;
}

const QuestionnaireScreen = () => {
    const router = useRouter();
    const { assistidoId, assistidoNome, modeloQuestionarioId, nomeQuestionario } = useLocalSearchParams<{
        assistidoId?: string;
        assistidoNome?: string;
        modeloQuestionarioId?: string;
        nomeQuestionario?: string;
    }>();

    const [perguntas, setPerguntas] = useState<PerguntaComOpcoes[]>([]);
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPerguntas = async () => {
             if (!modeloQuestionarioId) {
                Alert.alert("Erro Simulado", "ID do modelo não recebido (simulado).");
                setIsLoading(false);
                if (router.canGoBack()) router.back();
                return;
            }
            setIsLoading(true);
            console.log(`(Simulado) Buscando perguntas para modelo ${modeloQuestionarioId}`);

            // --- Simulação de chamada API com dados estáticos ---
            await new Promise(resolve => setTimeout(resolve, 1200)); // Simula delay
            let dataSimulada: PerguntaComOpcoes[] = [];
             if (modeloQuestionarioId === 'uuid-qfa') {
                  dataSimulada = [
                     { id: 'p1-qfa', texto_pergunta: 'Com que frequência come Banana?', opcoes: [{id: 'o1-qfa-banana', texto_opcao: 'Nunca'}, {id: 'o2-qfa-banana', texto_opcao: '1x na semana'}, {id: 'o3-qfa-banana', texto_opcao: '2-4x na semana'}, {id: 'o4-qfa-banana', texto_opcao: '5-6x na semana'}, {id: 'o5-qfa-banana', texto_opcao: '1x por dia ou mais'}] },
                     { id: 'p2-qfa', texto_pergunta: 'Com que frequência come Maçã?', opcoes: [{id: 'o1-qfa-maca', texto_opcao: 'Nunca'}, {id: 'o2-qfa-maca', texto_opcao: '1x na semana'}, {id: 'o3-qfa-maca', texto_opcao: '2-4x na semana'}, {id: 'o4-qfa-maca', texto_opcao: '5-6x na semana'}, {id: 'o5-qfa-maca', texto_opcao: '1x por dia ou mais'}] },
                     { id: 'p3-qfa', texto_pergunta: 'Com que frequência come Brócolis?', opcoes: [{id: 'o1-qfa-broc', texto_opcao: 'Nunca'}, {id: 'o2-qfa-broc', texto_opcao: '1x na semana'}, {id: 'o3-qfa-broc', texto_opcao: '2-4x na semana'}, {id: 'o4-qfa-broc', texto_opcao: '5-6x na semana'}, {id: 'o5-qfa-broc', texto_opcao: '1x por dia ou mais'}] },
                     // Adicione mais para testar rolagem
                  ];
             } else if (modeloQuestionarioId === 'uuid-bambi') {
                 dataSimulada = [
                      { id: 'p1-bambi', texto_pergunta: 'Meu filho(a) se recusa a sentar à mesa na hora das refeições.', opcoes: [{id: 'o1-bambi-p1', texto_opcao: 'Nunca'}, {id: 'o2-bambi-p1', texto_opcao: 'Raramente'}, {id: 'o3-bambi-p1', texto_opcao: 'Às vezes'}, {id: 'o4-bambi-p1', texto_opcao: 'Frequentemente'}, {id: 'o5-bambi-p1', texto_opcao: 'Sempre'}] },
                      { id: 'p2-bambi', texto_pergunta: 'Meu filho(a) tem crises de birra ou se irrita durante as refeições.', opcoes: [{id: 'o1-bambi-p2', texto_opcao: 'Nunca'}, {id: 'o2-bambi-p2', texto_opcao: 'Raramente'}, {id: 'o3-bambi-p2', texto_opcao: 'Às vezes'}, {id: 'o4-bambi-p2', texto_opcao: 'Frequentemente'}, {id: 'o5-bambi-p2', texto_opcao: 'Sempre'}] },
                      // Adicione mais para testar rolagem
                 ];
             } else if (modeloQuestionarioId === 'uuid-step') {
                 // Adicione perguntas simuladas para STEP-CHILD aqui
                 dataSimulada = [
                     { id: 'p1-step', texto_pergunta: 'Recusa alimentos frequentemente.', opcoes: [{id: 'o1-step-p1', texto_opcao: 'Ausente'}, {id: 'o2-step-p1', texto_opcao: '1 a 10 vezes/mês'}, {id: 'o3-step-p1', texto_opcao: 'Mais de 10 vezes/mês'}] },
                     // ...
                 ];
             }
             // --- Fim da Simulação ---

            // const data = await getModeloCompletoApi(modeloQuestionarioId as string); // Chamada real comentada

            if (dataSimulada && dataSimulada.length > 0) {
                setPerguntas(dataSimulada); // Usa dados simulados
                setRespostas({});
            } else {
                 Alert.alert("Aviso Simulado", "Este questionário simulado não tem perguntas.");
                 setPerguntas([]);
                 if (router.canGoBack()) router.back();
            }
            setIsLoading(false);
        };

        fetchPerguntas();
    }, [modeloQuestionarioId]);

    // Atualiza o estado de respostas (sem alterações)
    const handleSelectOption = (perguntaId: string, opcaoId: string) => {
        setRespostas(prev => ({
            ...prev,
            [perguntaId]: opcaoId,
        }));
    };

    // Simula o salvamento das respostas
    const handleSalvar = async () => {
         if (!assistidoId || !modeloQuestionarioId) {
            Alert.alert("Erro Simulado", "Dados insuficientes para salvar (simulado).");
            return;
        }
         const todasRespondidas = perguntas.every(p => respostas[p.id]);
         if (!todasRespondidas) {
              const continuar = await new Promise((resolve) => {
                  Alert.alert("Atenção", "Nem todas as perguntas foram respondidas. Deseja salvar mesmo assim?",
                      [{ text: "Cancelar", style: "cancel", onPress: () => resolve(false) }, { text: "Salvar", onPress: () => resolve(true) }]
                  );
              });
              if (!continuar) return;
         }

        setIsSubmitting(true);
        const payload: RespostaPayloadItem[] = Object.entries(respostas).map(([pergunta_id, opcao_id]) => ({
             pergunta_id,
             opcao_id
        }));
        console.log("(Simulado) Enviando respostas:", payload);

        // --- Simulação de chamada API de salvar ---
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simula delay da rede
        const sucessoSimulado = true; // Altere para false para testar erro
        // --- Fim da Simulação ---

        // const result = await salvarRespostasApi(assistidoId as string, modeloQuestionarioId as string, payload); // Chamada real comentada

        setIsSubmitting(false);

        if (sucessoSimulado) { // Usa o resultado simulado
            Alert.alert("Sucesso (Simulado)", "Respostas salvas!");
             if (router.canGoBack()) {
                router.back(); // Volta para a lista
            }
        } else {
             Alert.alert("Erro (Simulado)", "Não foi possível salvar as respostas.");
        }
    };

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
            <TouchableOpacity onPress={() => router.back()} className="absolute top-10 left-5 z-10 p-2">
                 <Text className="text-primary text-2xl">{'<'} Voltar</Text>
             </TouchableOpacity>

            <Text className='text-3xl font-bold text-text text-center mb-2'>
                {nomeQuestionario || 'Questionário'}
            </Text>
             <Text className='text-lg text-text text-center mb-6'>
                Para: {assistidoNome || 'Assistido'}
            </Text>

            <FlatList
                data={perguntas}
                keyExtractor={(item) => item.id}
                renderItem={({ item: pergunta }) => (
                    <View className="mb-6 p-4 bg-card rounded-lg shadow">
                        <Text className="text-lg font-semibold text-text mb-3">{pergunta.texto_pergunta}</Text>
                        {pergunta.opcoes.map(opcao => (
                            <TouchableOpacity
                                key={opcao.id}
                                className={`flex-row items-center p-3 my-1 rounded border ${respostas[pergunta.id] === opcao.id ? 'bg-primary border-secondary' : 'bg-white border-gray-300'}`}
                                onPress={() => handleSelectOption(pergunta.id, opcao.id)}
                            >
                                <View className={`w-5 h-5 rounded-full border-2 mr-3 ${respostas[pergunta.id] === opcao.id ? 'bg-secondary border-secondary' : 'border-gray-400'}`} />
                                <Text className={`text-base flex-1 ${respostas[pergunta.id] === opcao.id ? 'text-white font-bold' : 'text-text'}`}>
                                    {opcao.texto_opcao}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <View className="absolute bottom-5 left-5 right-5">
                 {isSubmitting ? (
                     <ActivityIndicator size="large" color="#A6C98C" />
                 ) : (
                     <Button title="Salvar Respostas" type="success" onPress={handleSalvar} disabled={perguntas.length === 0} />
                 )}
            </View>
        </View>
    );
};

export default QuestionnaireScreen;