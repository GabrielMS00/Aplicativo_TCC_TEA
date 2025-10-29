// app-tea/app/QuestionnaireFlow/_layout.tsx
import { Stack } from "expo-router";

// Layout para agrupar as telas do fluxo de questionário
export default function QuestionnaireFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Screen" />
      {/* Se tiver mais telas nesse fluxo (ex: tela de sucesso), adicione aqui */}
    </Stack>
  );
}