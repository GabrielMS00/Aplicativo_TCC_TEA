const processamentoService = require('../../src/services/processamentoQuestionarioService');
const db = require('../../src/config/db');

jest.mock('../../src/config/db');

describe('ProcessamentoQuestionarioService - Unitário', () => {
  afterEach(() => jest.clearAllMocks());

  it('Deve identificar alimentos de alta frequência', async () => {
    const mockClient = { query: jest.fn(), release: jest.fn() };
    db.pool.connect.mockResolvedValue(mockClient);

    // 1. BEGIN
    mockClient.query.mockResolvedValueOnce({});
    // 2. Busca Questionário
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    // 3. Busca Respostas
    mockClient.query.mockResolvedValueOnce({ rows: [{ modelo_pergunta_id: 10 }] });
    // 4. Busca Alimentos
    mockClient.query.mockResolvedValueOnce({ rows: [{ alimento_id: 'uuid-alimento' }] });
    // 5. Insert
    mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
    // 6. Commit
    mockClient.query.mockResolvedValueOnce({});

    const res = await processamentoService.processarRespostasEGerarAlimentosSeguros('assistido-id');
    expect(res).toEqual(['uuid-alimento']);
  });
});