import { Stack } from "expo-router";

// Layout para agrupar as telas do fluxo de questionário
export default function QuestionnaireFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Screen" />
      {/* Se tiver mais telas nesse fluxo, adicionar aqui*/}
    </Stack>
  );
}