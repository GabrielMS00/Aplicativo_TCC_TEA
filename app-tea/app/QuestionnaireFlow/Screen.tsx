// app-tea/app/QuestionnaireFlow/Screen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Adicionar useCallback
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { RadioButton } from '../../components/RadioButton';
// Importar funções da API de questionários
import { getModelosApi, getModeloCompletoApi, salvarRespostasApi, ModeloInfo, PerguntaQuestionario, OpcaoResposta, RespostaItem, SalvarRespostasBody } from '../../api/questionario';
// Importar função da API de assistidos
import { createAssistidoApi, CreateAssistidoData } from '../../api/assistidos';

// Mantém a estrutura das respostas locais
type Respostas = Record<string, string>; // { [pergunta_id]: opcao_id }

// Ordem desejada dos questionários
const questionnaireOrder = ['Frequência Alimentar', 'Questionário BAMBI', 'STEP-CHILD'];

const QuestionnaireScreen = () => {
  const router = useRouter();
  const {
    questionnaireIndex: questionnaireIndexStr = '0',
    assistidoData: assistidoDataStr = '{}',
    respostasAnteriores: respostasAnterioresStr = '{}',
  } = useLocalSearchParams<{ questionnaireIndex?: string, assistidoData?: string, respostasAnteriores?: string }>();

  const questionnaireIndex = parseInt(questionnaireIndexStr, 10);

  // Estado para guardar os IDs e nomes dos modelos
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloInfo[]>([]);
  const [modeloAtual, setModeloAtual] = useState<ModeloInfo | null>(null);

  // Estado para a estrutura do questionário atual
  const [perguntas, setPerguntas] = useState<PerguntaQuestionario[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Para o botão Finalizar

  // 1. Busca todos os modelos de questionário uma vez
  useEffect(() => {
    const fetchModelos = async () => {
      const data = await getModelosApi();
      if (data) {
        // Ordena os modelos conforme a ordem definida em questionnaireOrder
        const orderedData = questionnaireOrder.map(name =>
          data.find(model => model.nome === name)
        ).filter((model): model is ModeloInfo => model !== undefined); // Filtra caso algum nome não seja encontrado

        if (orderedData.length !== questionnaireOrder.length) {
          console.error("Nem todos os questionários esperados foram encontrados na API:", orderedData);
          Alert.alert("Erro", "Não foi possível encontrar todos os modelos de questionário necessários.");
          // Considerar voltar ou ir para home
          if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
          return;
        }
        setModelosDisponiveis(orderedData);
      } else {
        Alert.alert("Erro", "Não foi possível carregar os modelos de questionário.");
        if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
      }
    };
    fetchModelos();
  }, []); // Executa apenas uma vez

  // 2. Busca a estrutura do questionário atual QUANDO os modelos estiverem carregados E o índice mudar
  useEffect(() => {
    const fetchEstruturaQuestionario = async () => {
      if (modelosDisponiveis.length > 0 && questionnaireIndex < modelosDisponiveis.length) {
        setIsLoading(true);
        const currentModel = modelosDisponiveis[questionnaireIndex];
        setModeloAtual(currentModel); // Guarda o modelo atual
        const data = await getModeloCompletoApi(currentModel.id);
        if (data) {
          // A API retorna diretamente o array de perguntas com opções
          setPerguntas(data);
          setRespostas({}); // Limpa respostas ao carregar
        } else {
          Alert.alert("Erro", `Não foi possível carregar as perguntas para "${currentModel.nome}".`);
          // Considerar voltar
          if (router.canGoBack()) router.back();
        }
        setIsLoading(false);
      } else if (modelosDisponiveis.length > 0 && questionnaireIndex >= modelosDisponiveis.length) {
        // Caso o índice seja inválido após carregar modelos
        console.error("Índice de questionário inválido:", questionnaireIndex);
        Alert.alert("Erro", "Índice de questionário inválido.");
        if (router.canGoBack()) router.back(); else router.replace('/(tabs)/Home');
      }
      // Se modelosDisponiveis ainda está vazio, espera o primeiro useEffect terminar
    };

    fetchEstruturaQuestionario();
  }, [questionnaireIndex, modelosDisponiveis]); // Depende do índice e da lista de modelos

  // Função para atualizar a resposta (mantida)
  const handleSelectOption = (perguntaId: string, opcaoId: string) => {
    setRespostas(prev => ({ ...prev, [perguntaId]: opcaoId }));
  };

  // Função para lidar com o botão "Próximo" ou "Finalizar" (ATUALIZADA)
  const handleNext = async () => { // Agora é async
    if (Object.keys(respostas).length < perguntas.length) {
      Alert.alert("Atenção", "Por favor, responda todas as perguntas antes de continuar.");
      return;
    }

    // Prepara as respostas atuais no formato da API [{pergunta_id, opcao_id}]
    const respostasFormatadas: RespostaItem[] = Object.entries(respostas).map(([perguntaId, opcaoId]) => ({
      pergunta_id: perguntaId,
      opcao_id: opcaoId,
    }));

    const respostasAcumuladas = {
      ...JSON.parse(respostasAnterioresStr),
      // Guarda as respostas formatadas junto com o ID do modelo
      [modeloAtual!.id]: respostasFormatadas // Usamos o ID do modelo como chave
    };

    const isLastQuestionnaire = questionnaireIndex === modelosDisponiveis.length - 1;

    if (!isLastQuestionnaire) {
      // Navega para o próximo questionário (mesma lógica de antes)
      router.push({
        pathname: '/QuestionnaireFlow/Screen',
        params: {
          questionnaireIndex: (questionnaireIndex + 1).toString(),
          assistidoData: assistidoDataStr,
          respostasAnteriores: JSON.stringify(respostasAcumuladas)
        }
      });
    } else {
      // --- Lógica de Finalização ---
      setIsSubmitting(true);
      try {
        // 1. Criar o Assistido
        const assistidoData: CreateAssistidoData = JSON.parse(assistidoDataStr);
        const createResponse = await createAssistidoApi(assistidoData);

        if (!createResponse || !createResponse.assistido) {
          Alert.alert("Erro", "Falha ao cadastrar os dados básicos do assistido.");
          setIsSubmitting(false);
          return; // Interrompe se não conseguir criar o assistido
        }

        const assistidoId = createResponse.assistido.id;
        console.log("Assistido criado com ID:", assistidoId);

        // 2. Salvar Respostas de TODOS os questionários
        let todasRespostasSalvas = true;
        for (const modeloId in respostasAcumuladas) {
          const respostasDoModelo: RespostaItem[] = respostasAcumuladas[modeloId];
          const body: SalvarRespostasBody = {
            modelo_questionario_id: modeloId,
            respostas: respostasDoModelo
          };
          console.log(`Salvando respostas para assistido ${assistidoId} e modelo ${modeloId}...`);
          const saveResponse = await salvarRespostasApi(assistidoId, body);
          if (!saveResponse) {
            todasRespostasSalvas = false;
            const modeloInfo = modelosDisponiveis.find(m => m.id === modeloId);
            Alert.alert("Erro", `Falha ao salvar respostas do questionário "${modeloInfo?.nome || modeloId}".`);
            // Você pode decidir se quer parar aqui ou tentar salvar os outros
            // break; // Descomente para parar no primeiro erro
          } else {
            console.log(`Respostas para modelo ${modeloId} salvas com sucesso.`);
          }
        }

        if (todasRespostasSalvas) {
          Alert.alert("Cadastro Concluído!", "Assistido e respostas registrados com sucesso.");
          router.replace('/(tabs)/Home'); // Vai para a Home
        } else {
          Alert.alert("Atenção", "O assistido foi criado, mas houve erro ao salvar algumas respostas dos questionários. Verifique os logs.");
          // Decide se quer ir pra Home mesmo assim ou ficar na tela
          router.replace('/(tabs)/Home');
        }

      } catch (error) {
        console.error("Erro no processo de finalização:", error);
        Alert.alert("Erro Crítico", "Ocorreu um erro inesperado ao finalizar o cadastro.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- Renderização (semelhante a antes, mas usa 'perguntas' do estado) ---
  if (isLoading || !modeloAtual) {
    return (
      <View className='flex-1 justify-center items-center bg-background'>
        <ActivityIndicator size="large" color="#87CFCF" />
      </View>
    );
  }

  const totalQuestionnaires = modelosDisponiveis.length; // Usa o total de modelos carregados
  const isLastQuestionnaire = questionnaireIndex === totalQuestionnaires - 1;

  return (
    <View className='flex-1 bg-background p-5'>
      {/* Botão Voltar */}
      <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
        <Text className="text-primary text-xl">{'<'} Voltar</Text>
      </TouchableOpacity>

      <Text className='text-3xl font-bold text-text text-center mt-28 mb-4'>{modeloAtual.nome}</Text>
      <Text className='text-lg text-gray-600 text-center mb-8'>
        Passo {questionnaireIndex + 1} de {totalQuestionnaires}
      </Text>

      <ScrollView className='flex-1'>
        {perguntas.map((pergunta) => (
          <View key={pergunta.id} className=" p-4 bg-white rounded-lg shadow">
            <Text className="text-lg font-semibold text-text mb-4">{pergunta.texto_pergunta}</Text>
            {/* Usa as opções específicas da pergunta que vieram da API */}
            {pergunta.opcoes.map((opcao) => (
              <RadioButton
                key={opcao.id}
                label={opcao.texto_opcao}
                selected={respostas[pergunta.id] === opcao.id}
                onSelect={() => handleSelectOption(pergunta.id, opcao.id)}
              />
            ))}
          </View>
        ))}

        <View className="mt-6">
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#A6C98C" />
          ) : (
            <Button
              title={isLastQuestionnaire ? 'Finalizar Cadastro' : 'Próximo Questionário'}
              type="success"
              onPress={handleNext}
              disabled={isLoading} // Desabilita enquanto carrega o questionário
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuestionnaireScreen;