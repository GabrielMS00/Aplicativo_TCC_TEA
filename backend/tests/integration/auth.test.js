// backend/tests/integration/auth.test.js

// --- Carregar Variáveis de Ambiente ---
// Adicione estas linhas no topo para carregar o .env da raiz do projeto
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') }); // <-- Carrega o .env da raiz

// --- Importações Padrão ---
const request = require('supertest');
const app = require('../../src/app'); // Ajuste o caminho se necessário
const db = require('../../src/config/db'); // db.js será carregado DEPOIS do dotenv

// --- Setup e Teardown ---

beforeAll(async () => {
  // Garante que a tabela de cuidadores está vazia antes de começar os testes
  // É importante usar uma base de dados SEPARADA para testes em cenários mais complexos
  try {
    await db.query('DELETE FROM cuidadores');
    console.log('Tabela de cuidadores limpa antes dos testes.');
  } catch (error) {
    console.error('Erro ao limpar tabela de cuidadores antes dos testes:', error);
    // Considerar lançar o erro para parar os testes se a limpeza falhar
    // throw error; // Descomente se quiser que os testes parem se a limpeza falhar
  }
});

afterAll(async () => {
  // Limpa a tabela após os testes e fecha a pool de conexão
  try {
    await db.query('DELETE FROM cuidadores');
    console.log('Tabela de cuidadores limpa após os testes.');
  } catch (error) {
    console.error('Erro ao limpar tabela de cuidadores após os testes:', error);
  } finally {
    // É CRUCIAL fechar a pool para o Jest terminar corretamente
    if (db && db.pool) { // Adiciona verificação para evitar erro se db não carregar
      await db.pool.end();
      console.log('Pool de conexão da base de dados fechada.');
    }
  }
});

// --- Testes ---

describe('API de Autenticação - /api/auth', () => {
  const testUser = {
    nome: 'Utilizador de Teste de Integração',
    email: 'integracao@teste.com',
    senha: 'passwordValida123',
    cpf: '111.111.111-11', // Use um CPF válido único para testes
    data_nascimento: '1995-05-15',
  };

  // --- Testes de Registro (/register) ---

  describe('POST /api/auth/register', () => {
    it('Deve registrar um novo cuidador com sucesso e retornar status 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Cuidador cadastrado com sucesso!');
      expect(res.body).toHaveProperty('cuidador');
      expect(res.body.cuidador).toHaveProperty('id');
      expect(res.body.cuidador).toHaveProperty('nome', testUser.nome);
      expect(res.body.cuidador).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('token'); // Verifica se o token JWT foi retornado
    });

    it('Deve retornar erro 409 se tentar registrar com um email já existente', async () => {
      // Tenta registrar o mesmo utilizador novamente
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('error', 'Este e-mail já está em uso.');
    });

    it('Deve retornar erro 409 se tentar registrar com um CPF já existente', async () => {
      const userComMesmoCpf = {
        ...testUser,
        email: 'outroemail@teste.com', // Email diferente
        cpf: testUser.cpf, // Mesmo CPF
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(userComMesmoCpf);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('error', 'O CPF informado já está em uso.');
    });

    it('Deve retornar erro 400 se faltar o campo nome', async () => {
      const { nome, ...userSemNome } = testUser; // Cria objeto sem o nome
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userSemNome, email: 'semnome@teste.com', cpf: '222.222.222-22' }); // Email e CPF únicos

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Todos os campos são obrigatórios.');
    });

     it('Deve retornar erro 400 se a senha for muito curta', async () => {
      const userSenhaCurta = {
        ...testUser,
        email: 'senhacurta@teste.com', // Email único
        cpf: '333.333.333-33', // CPF único
        senha: '123', // Senha curta
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(userSenhaCurta);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'A senha precisa ter no mínimo 8 caracteres.');
    });

    // Adicionar mais testes para outros campos obrigatórios, se necessário (email, senha, cpf, data_nascimento)
  });

  // --- Testes de Login (/login) ---

  describe('POST /api/auth/login', () => {
    it('Deve logar um cuidador existente com sucesso e retornar status 200', async () => {
      // Usa o utilizador registrado no primeiro teste de registro
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          senha: testUser.senha,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Login bem-sucedido!');
      expect(res.body).toHaveProperty('cuidador');
      expect(res.body.cuidador).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('token');
    });

    it('Deve retornar erro 401 para senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          senha: 'senha-errada-propositalmente',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
    });

    it('Deve retornar erro 401 para email não registrado', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email.nao.existe@exemplo.com',
          senha: 'qualquersenha',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
    });

    it('Deve retornar erro 400 se faltar o campo email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ senha: testUser.senha }); // Envia sem email

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'E-mail e senha são obrigatórios.');
    });

    it('Deve retornar erro 400 se faltar o campo senha', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email }); // Envia sem senha

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'E-mail e senha são obrigatórios.');
    });
  });
});