import { Stack } from "expo-router";

// Define a navegação tipo "Stack" (pilha) para as telas dentro de /questionnaires
export default function QuestionnaireLayout() {
    return (
        // Configura a Stack e esconde o header padrão
        <Stack screenOptions={{ headerShown: false }}>
            {/* Define as telas que pertencem a esta pilha */}
            <Stack.Screen name="QuestionnaireList" />
            <Stack.Screen name="QuestionnaireScreen" />
        </Stack>
    );
}