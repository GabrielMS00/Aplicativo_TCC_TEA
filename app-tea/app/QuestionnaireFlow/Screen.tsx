import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/Button';
import { RadioButton } from '../../components/RadioButton';
import { getModelosApi, getModeloCompletoApi, salvarRespostasApi, ModeloInfo, PerguntaQuestionario, RespostaItem, SalvarRespostasBody } from '../../api/questionario';
import { createAssistidoApi, CreateAssistidoData } from '../../api/assistidos';
import { useAuth } from '../../context/AuthContext';

type Respostas = Record<string, string>;
const questionnaireOrder = ['Frequência Alimentar', 'Questionário BAMBI', 'STEP-CHILD'];

const QuestionnaireScreen = () => {
  const router = useRouter();
  const { user, completeQuestionnaireFlow } = useAuth();

  const {
    questionnaireIndex: questionnaireIndexStr = '0',
    assistidoData: assistidoDataStr = '{}',
    respostasAnteriores: respostasAnterioresStr = '{}',
    assistidoId: assistidoIdParam,
  } = useLocalSearchParams<{
    questionnaireIndex?: string,
    assistidoData?: string,
    respostasAnteriores?: string,
    assistidoId?: string,
  }>();

  // Lógica de Detecção de Fluxo
  const isLoggedUserStandard = user?.tipo_usuario === 'padrao';
  const isCadastroPeloCuidador = !!(assistidoDataStr && assistidoDataStr !== '{}' && !assistidoIdParam);
  const isReTeste = !!(assistidoIdParam && !isLoggedUserStandard);

  const questionnaireIndex = parseInt(questionnaireIndexStr, 10);
  const [modelosDisponiveis, setModelosDisponiveis] = useState<ModeloInfo[]>([]);
  const [modeloAtual, setModeloAtual] = useState<ModeloInfo | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaQuestionario[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});


  const [erros, setErros] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Carrega a lista de modelos de questionário
  useEffect(() => {
    const fetchModelos = async () => {
      setIsLoading(true);
      const data = await getModelosApi();
      if (data) {
        const orderedData = questionnaireOrder.map(name =>
          data.find(model => model.nome === name)
        ).filter((model): model is ModeloInfo => model !== undefined);

        if (orderedData.length !== questionnaireOrder.length) {
          Alert.alert("Erro", "Não foi possível encontrar todos os modelos de questionário necessários.");
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
  }, []);

  // Carrega as perguntas do modelo atual
  useEffect(() => {
    const fetchEstruturaQuestionario = async () => {
      if (modelosDisponiveis.length > 0 && questionnaireIndex < modelosDisponiveis.length) {
        setIsLoading(true);
        setErros([]); // Limpa erros ao mudar de tela
        const currentModel = modelosDisponiveis[questionnaireIndex];
        setModeloAtual(currentModel);
        const data = await getModeloCompletoApi(currentModel.id);
        if (data) {
          setPerguntas(data);
          setRespostas({});
        } else {
          Alert.alert("Erro", `Não foi possível carregar as perguntas para "${currentModel.nome}".`);
          if (router.canGoBack()) router.back();
        }
        setIsLoading(false);
      }
    };
    fetchEstruturaQuestionario();
  }, [questionnaireIndex, modelosDisponiveis]);

  const handleSelectOption = (perguntaId: string, opcaoId: string) => {
    setRespostas(prev => ({ ...prev, [perguntaId]: opcaoId }));

    // Remove o erro visual dessa pergunta assim que o usuário seleciona algo
    if (erros.includes(perguntaId)) {
      setErros(prev => prev.filter(id => id !== perguntaId));
    }
  };

  const handleNext = async () => {
    const perguntasSemResposta = perguntas
      .filter(p => !respostas[p.id])
      .map(p => p.id);

    if (perguntasSemResposta.length > 0) {
      setErros(perguntasSemResposta);
      Alert.alert("Atenção", "Existem perguntas não respondidas (marcadas em vermelho).");
      // Rola para o topo para ver os erros 
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // Formata respostas atuais
    const respostasFormatadas: RespostaItem[] = Object.entries(respostas).map(([perguntaId, opcaoId]) => ({
      pergunta_id: perguntaId,
      opcao_id: opcaoId,
    }));

    // Acumula com as anteriores
    const respostasAcumuladas = {
      ...JSON.parse(respostasAnterioresStr),
      [modeloAtual!.id]: respostasFormatadas
    };

    const isLastQuestionnaire = questionnaireIndex === modelosDisponiveis.length - 1;

    if (!isLastQuestionnaire) {
      router.push({
        pathname: '/QuestionnaireFlow/Screen',
        params: {
          questionnaireIndex: (questionnaireIndex + 1).toString(),
          assistidoData: assistidoDataStr,
          respostasAnteriores: JSON.stringify(respostasAcumuladas),
          assistidoId: assistidoIdParam,
        }
      });
    } else {
      setIsSubmitting(true);
      try {
        let finalAssistidoId: string;

        if (isLoggedUserStandard) {
          if (!user?.assistidoIdPadrao) {
            Alert.alert("Erro", "Identificador do perfil não encontrado. Tente logar novamente.");
            setIsSubmitting(false);
            return;
          }
          finalAssistidoId = user.assistidoIdPadrao;
        }
        else if (isReTeste && assistidoIdParam) {
          finalAssistidoId = assistidoIdParam;
        }
        else if (isCadastroPeloCuidador) {
          const assistidoData: CreateAssistidoData = JSON.parse(assistidoDataStr);
          const createResponse = await createAssistidoApi(assistidoData);
          if (!createResponse || !createResponse.assistido) {
            Alert.alert("Erro", "Falha ao cadastrar os dados básicos do assistido.");
            setIsSubmitting(false);
            return;
          }
          finalAssistidoId = createResponse.assistido.id;
        } else {
          Alert.alert("Erro", "Não foi possível determinar para quem salvar as respostas.");
          setIsSubmitting(false);
          return;
        }

        let todasRespostasSalvas = true;
        for (const modeloId in respostasAcumuladas) {
          const respostasDoModelo = respostasAcumuladas[modeloId];
          const body: SalvarRespostasBody = {
            modelo_questionario_id: modeloId,
            respostas: respostasDoModelo
          };
          const saveResponse = await salvarRespostasApi(finalAssistidoId, body);
          if (!saveResponse) todasRespostasSalvas = false;
        }

        if (todasRespostasSalvas) {
          if (isLoggedUserStandard) {
            await completeQuestionnaireFlow();
            Alert.alert(
              "Sucesso",
              "Perfil configurado com sucesso! Bem-vindo.",
              [
                {
                  text: "OK",
                  onPress: () => router.replace('/(tabs)/Home')
                }
              ]
            );
          } else {
            Alert.alert("Sucesso", "Assistido cadastrado e questionários respondidos.", [
              { text: "OK", onPress: () => router.replace('/(tabs)/Home') }
            ]);
          }
        } else {
          Alert.alert("Atenção", "Houve erro ao salvar algumas respostas. Tente novamente.", [
            { text: "OK", onPress: () => router.replace('/(tabs)/Home') }
          ]);
        }

      } catch (error) {
        console.error("Erro ao finalizar:", error);
        Alert.alert("Erro Crítico", "Ocorreu um erro inesperado ao salvar os dados.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading || !modeloAtual) {
    return (
      <View className='flex-1 justify-center items-center bg-background'>
        <ActivityIndicator size="large" color="#87CFCF" />
      </View>
    );
  }

  const totalQuestionnaires = modelosDisponiveis.length;
  const isLastQuestionnaire = questionnaireIndex === totalQuestionnaires - 1;

  return (
    <View className='flex-1 bg-background p-5'>
      {(!isLoggedUserStandard || questionnaireIndex > 0) && (
        <TouchableOpacity onPress={() => router.back()} className="absolute top-16 left-5 z-10 p-2">
          <Text className="text-primary text-xl">{'<'} Voltar</Text>
        </TouchableOpacity>
      )}

      <Text className='text-3xl font-bold text-text text-center mt-28 mb-4'>{modeloAtual.nome}</Text>
      <Text className='text-lg text-gray-600 text-center mb-8'>
        Passo {questionnaireIndex + 1} de {totalQuestionnaires}
      </Text>

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false} ref={scrollViewRef}>
        {perguntas.map((pergunta) => {
          const temErro = erros.includes(pergunta.id);
          return (
            <View
              key={pergunta.id}
              // Lógica condicional de estilo: se temErro, adiciona borda vermelha
              className={`mb-4 p-4 bg-white rounded-lg shadow ${temErro ? 'border-2 border-red-500' : ''}`}
            >
              <Text className={`text-lg font-semibold mb-4 ${temErro ? 'text-red-600' : 'text-text'}`}>
                {pergunta.texto_pergunta}
                {temErro && " *"}
              </Text>

              {pergunta.opcoes.map((opcao) => (
                <RadioButton
                  key={opcao.id}
                  label={opcao.texto_opcao}
                  selected={respostas[pergunta.id] === opcao.id}
                  onSelect={() => handleSelectOption(pergunta.id, opcao.id)}
                />
              ))}
            </View>
          );
        })}

        <View className="mt-6 mb-10">
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#A6C98C" />
          ) : (
            <Button
              title={isLastQuestionnaire ? 'Finalizar' : 'Próximo'}
              type="success"
              onPress={handleNext}
              disabled={isLoading}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuestionnaireScreen;