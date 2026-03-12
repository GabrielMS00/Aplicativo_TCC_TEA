import 'react-native-gesture-handler/jestSetup';

global.ReanimatedDataMock = {
    now: () => 0,
};
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');

    Reanimated.default.useAnimatedGestureHandler = () => () => {};

    return Reanimated;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    mergeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    flushGetRequests: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
}));

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        canGoBack: jest.fn(() => true),
        back: jest.fn(),
    },
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: jest.fn(cb => cb()),
    useSegments: jest.fn(() => ['(tabs)', 'Home']),
}));

jest.mock('expo-print', () => ({
    printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'mock-uri.pdf' })),
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    shareAsync: jest.fn(() => Promise.resolve()),
}));