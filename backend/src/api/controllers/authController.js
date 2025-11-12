const Cuidador = require('../models/Cuidador');
const Assistido = require('../models/Assistido');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); 

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { nome, email, senha, cpf, data_nascimento, tipo_usuario } = req.body;

  if (!nome || !email || !senha || !cpf || !data_nascimento || !tipo_usuario) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (senha.length < 8) {
     return res.status(400).json({ error: 'A senha precisa ter no mínimo 8 caracteres.' });
  }

  // Inicia o client de transação
  const client = await db.pool.connect();

  try {
    // Inicia a transação
    await client.query('BEGIN');

    // Verifica se o cuidador já existe (usando 'db.query' normal, não o client)
    // Usamos o pool 'db' aqui porque é só uma leitura, não precisa bloquear a transação
    const cuidadorExistente = await Cuidador.findByEmail(email);
    if (cuidadorExistente) {
      await client.query('ROLLBACK'); // Cancela a transação
      client.release();
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }
    
    // (Verificação de CPF)
    // const cpfExistente = await db.query('SELECT 1 FROM cuidadores WHERE cpf = $1', [cpf]);
    // if (cpfExistente.rows.length > 0) {
    //   await client.query('ROLLBACK');
    //   client.release();
    //   return res.status(409).json({ error: 'O CPF informado já está em uso.' });
    // }


    // Cria o Cuidador (passando o 'client' da transação)
    const novoCuidador = await Cuidador.create({ nome, email, senha, cpf, data_nascimento, tipo_usuario }, client);

    let assistidoIdPadrao = null;

    if (novoCuidador.tipo_usuario === 'padrao') {
      // Cria o Assistido Fantasma (passando o 'client' da transação)
      const novoAssistido = await Assistido.create({
        nome: novoCuidador.nome,
        data_nascimento: data_nascimento,
        cuidador_id: novoCuidador.id,
        nivel_suporte: null, 
        grau_seletividade: null 
      }, client);
      assistidoIdPadrao = novoAssistido.id;
    }

    // Confirma a transação
    await client.query('COMMIT');

    // Se tudo deu certo, retorna a resposta
    res.status(201).json({
      message: 'Cuidador cadastrado com sucesso!',
      cuidador: {
        id: novoCuidador.id,
        nome: novoCuidador.nome,
        email: novoCuidador.email,
        tipo_usuario: novoCuidador.tipo_usuario,
      },
      token: generateToken(novoCuidador.id),
      assistidoIdPadrao: assistidoIdPadrao
    });

  } catch (error) {
    // Desfaz a transação em CASO de erro
    await client.query('ROLLBACK');

    console.error('Erro ao cadastrar cuidador (ROLLBACK):', error);
    if (error.code === '23505') { // Erro de violação de constraint (UNIQUE)
      if (error.constraint === 'cuidadores_cpf_key') {
         return res.status(409).json({ error: 'O CPF informado já está em uso.' });
      }
      if (error.constraint === 'cuidadores_email_key') {
         return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      }
      return res.status(409).json({ error: 'Conflito de dados (CPF ou E-mail já em uso).' });
    }
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  } finally {
    // Libera o client de volta para o pool
    client.release();
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    // Encontra o cuidador
    const cuidador = await Cuidador.findByEmail(email);
    if (!cuidador) {
      // (Banco limpo ou e-mail errado)
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Compara a senha
    const senhaCorreta = await bcrypt.compare(senha, cuidador.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // LÓGICA DE LOGIN (Cuidador vs Padrão)
    let assistidoIdPadrao = null;

    if (cuidador.tipo_usuario === 'padrao') {
      const assistidoQuery = 'SELECT id FROM assistidos WHERE cuidador_id = $1 AND nome = $2';
      const assistidoRes = await db.query(assistidoQuery, [cuidador.id, cuidador.nome]);
      
      if (assistidoRes.rows.length > 0) {
        assistidoIdPadrao = assistidoRes.rows[0].id;
      } else {
        // Se o usuário é 'padrao' mas não tem assistido (cadastro falhou),
        // o login deve falhar.
        console.error(`Usuário padrão ${cuidador.id} não possui um assistido vinculado.`);
        return res.status(500).json({ error: 'Erro ao carregar perfil de usuário. Assistido vinculado não encontrado.' });
      }
    }
    
    // Retorna sucesso
    res.status(200).json({
      message: 'Login bem-sucedido!',
      cuidador: {
        id: cuidador.id,
        nome: cuidador.nome,
        email: cuidador.email,
        tipo_usuario: cuidador.tipo_usuario,
      },
      token: generateToken(cuidador.id),
      assistidoIdPadrao: assistidoIdPadrao // Retorna o ID (se 'padrao') ou null (se 'cuidador')
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};