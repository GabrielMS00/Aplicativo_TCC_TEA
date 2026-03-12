const db = require('../../src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Usado para gerar sufixos únicos

// Limpa todas as tabelas (A ordem é crucial devido às chaves estrangeiras)
const clearDatabase = async () => {
  await db.query('DELETE FROM respostas');
  await db.query('DELETE FROM questionarios_respondidos');
  await db.query('DELETE FROM modelos_opcoes_respostas');
  await db.query('DELETE FROM modelos_perguntas');
  await db.query('DELETE FROM modelos_questionarios');
  await db.query('DELETE FROM detalhes_troca');
  await db.query('DELETE FROM trocas_alimentares');
  await db.query('DELETE FROM alimentos_seguros');
  await db.query('DELETE FROM perfil_refeicao');
  await db.query('DELETE FROM perfis_sensoriais');
  await db.query('DELETE FROM refeicoes');
  await db.query('DELETE FROM alimentos');
  await db.query('DELETE FROM assistidos');
  await db.query('DELETE FROM cuidadores');
};

// Cria Cuidador e Assistido com dados ÚNICOS para evitar conflito de CPF/Email
const createUserAndAssistido = async (tipo = 'padrao') => {
  // Gera um sufixo aleatório hexadecimal para garantir unicidade
  const randomSuffix = crypto.randomBytes(3).toString('hex'); 
  const timestamp = Date.now();
  
  const senhaHash = await bcrypt.hash('12345678', 10);
  
  // Gera CPF fake único (11 dígitos): últimos 6 do timestamp + 5 aleatórios
  const cpfFake = `${timestamp}`.slice(-6) + Math.floor(Math.random() * 90000 + 10000);

  // Insere Cuidador (Incluindo palavra_seguranca)
  const userRes = await db.query(
    `INSERT INTO cuidadores (nome, email, senha_hash, cpf, data_nascimento, tipo_usuario, palavra_seguranca) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email`,
    [
      `User Teste ${randomSuffix}`, 
      `teste_${timestamp}_${randomSuffix}@email.com`, 
      senhaHash, 
      cpfFake, 
      '1990-01-01', 
      tipo,
      'segredo123'
    ]
  );
  const cuidador = userRes.rows[0];

  // Insere Assistido vinculado
  const assistidoRes = await db.query(
    `INSERT INTO assistidos (nome, data_nascimento, nivel_suporte, grau_seletividade, cuidador_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [`Filho Teste ${randomSuffix}`, '2015-01-01', '1', 'leve', cuidador.id]
  );
  
  return {
    cuidadorId: cuidador.id,
    email: cuidador.email,
    assistidoId: assistidoRes.rows[0].id
  };
};

const seedQuestionario = async () => {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(2).toString('hex');

  // Cria Modelo
  const modeloRes = await db.query(
    "INSERT INTO modelos_questionarios (nome) VALUES ($1) RETURNING id",
    [`Frequência Alimentar Teste ${randomSuffix}`]
  );
  const modeloId = modeloRes.rows[0].id;

  // Garante compatibilidade com serviço que busca nome fixo 'Frequência Alimentar'
  let modeloRealId = modeloId;
  const buscaOficial = await db.query("SELECT id FROM modelos_questionarios WHERE nome = 'Frequência Alimentar'");
  if (buscaOficial.rows.length > 0) {
      modeloRealId = buscaOficial.rows[0].id;
  } else {
      await db.query("UPDATE modelos_questionarios SET nome = 'Frequência Alimentar' WHERE id = $1", [modeloId]);
  }

  // Cria Pergunta
  const pergRes = await db.query(
    "INSERT INTO modelos_perguntas (texto_pergunta, modelo_questionario_id) VALUES ($1, $2) RETURNING id",
    [`Com que frequência o assistido come Arroz Teste ${randomSuffix}?`, modeloRealId]
  );
  const perguntaId = pergRes.rows[0].id;

  // Cria Opções
  const op1 = await db.query(
    "INSERT INTO modelos_opcoes_respostas (texto_opcao, modelo_pergunta_id) VALUES ('Nunca', $1) RETURNING id",
    [perguntaId]
  );
  const op2 = await db.query(
    "INSERT INTO modelos_opcoes_respostas (texto_opcao, modelo_pergunta_id) VALUES ('1x por dia ou mais', $1) RETURNING id",
    [perguntaId]
  );

  return {
    modeloId: modeloRealId,
    perguntaId,
    opcaoNuncaId: op1.rows[0].id,
    opcaoSempreId: op2.rows[0].id,
    nomeAlimento: `Arroz Teste ${randomSuffix}`
  };
};

const seedAlimentosBasicos = async () => {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(2).toString('hex');

  // Cria Refeição
  const refRes = await db.query("INSERT INTO refeicoes (nome) VALUES ($1) RETURNING id", [`Almoço Teste ${randomSuffix}`]);
  const almocoId = refRes.rows[0].id;

  // Cria Alimentos
  const alim1 = await db.query("INSERT INTO alimentos (nome, grupo_alimentar) VALUES ($1, 'Cereais e Tubérculos') RETURNING id", [`Arroz Teste ${randomSuffix}`]);
  const alim2 = await db.query("INSERT INTO alimentos (nome, grupo_alimentar) VALUES ($1, 'Cereais e Tubérculos') RETURNING id", [`Batata Teste ${randomSuffix}`]);
  
  const arrozId = alim1.rows[0].id;
  const batataId = alim2.rows[0].id;

  // Cria Perfis Sensoriais
  const p1 = await db.query(
    `INSERT INTO perfis_sensoriais (alimento_id, forma_de_preparo, textura, sabor, cor_predominante, temperatura_servico)
     VALUES ($1, 'Cozido', 'Macia', 'Suave', 'Branca', 'Quente') RETURNING id`, [arrozId]
  );
  const p2 = await db.query(
    `INSERT INTO perfis_sensoriais (alimento_id, forma_de_preparo, textura, sabor, cor_predominante, temperatura_servico)
     VALUES ($1, 'Assada', 'Macia', 'Suave', 'Amarela', 'Quente') RETURNING id`, [batataId]
  );

  // Vincula Perfis à Refeição
  await db.query("INSERT INTO perfil_refeicao (perfil_sensorial_id, refeicao_id) VALUES ($1, $2)", [p1.rows[0].id, almocoId]);
  await db.query("INSERT INTO perfil_refeicao (perfil_sensorial_id, refeicao_id) VALUES ($1, $2)", [p2.rows[0].id, almocoId]);

  return { 
      arrozId, 
      batataId, 
      perfilArrozId: p1.rows[0].id, 
      perfilBatataId: p2.rows[0].id, 
      almocoNome: `Almoço Teste ${randomSuffix}` 
  };
};

module.exports = { clearDatabase, createUserAndAssistido, seedQuestionario, seedAlimentosBasicos };