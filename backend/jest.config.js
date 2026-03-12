module.exports = {
  // Ambiente de teste Node.js
  testEnvironment: 'node',

  // Diz ao Jest que a raiz dos seus testes é a pasta 'tests/'
  roots: ['<rootDir>/tests'],

  // (Opcional, mas recomendado) Limpa mocks entre testes
  clearMocks: true,

  // (Opcional) Configurar setup/teardown global, se necessário
  // globalSetup: './tests/setup.js',
  // globalTeardown: './tests/teardown.js',

  // Timeout para testes (aumentar se necessário para testes de API)
  testTimeout: 10000, // 10 segundos
};