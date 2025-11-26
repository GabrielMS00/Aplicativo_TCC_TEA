import { Stack } from "expo-router";

export default function QuestionnaireFlowLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Screen" />
    </Stack>
  );
}