const Cuidador = require('../models/Cuidador');
const Assistido = require('../models/Assistido');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db'); 

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Função auxiliar para verificar se o usuário padrão já completou o fluxo
async function checkQuestionariosConcluidos(assistidoId) {
    const query = `SELECT 1 FROM questionarios_respondidos WHERE assistido_id = $1 LIMIT 1`;
    const { rows } = await db.query(query, [assistidoId]);
    return rows.length > 0;
}

exports.register = async (req, res) => {
  // Extrair novos campos do body
  const { nome, email, senha, cpf, data_nascimento, tipo_usuario, palavra_seguranca, nivel_suporte, grau_seletividade } = req.body;

  // Validação de campos obrigatórios gerais
  if (!nome || !email || !senha || !cpf || !data_nascimento || !tipo_usuario) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }
  
  // Validação da palavra de segurança
  if (!palavra_seguranca || palavra_seguranca.trim().length < 3) {
      return res.status(400).json({ error: 'Defina uma palavra de segurança válida.' });
  }

  // Validação de senha
  if (senha.length < 8) {
     return res.status(400).json({ error: 'A senha precisa ter no mínimo 8 caracteres.' });
  }

  // Validação específica para usuário padrão
  if (tipo_usuario === 'padrao') {
      if (!nivel_suporte || !grau_seletividade) {
          return res.status(400).json({ error: 'Nível de suporte e grau de seletividade são obrigatórios para contas pessoais.' });
      }
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Verifica duplicidade de e-mail
    const cuidadorExistente = await Cuidador.findByEmail(email);
    if (cuidadorExistente) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    // Cria o Cuidador
    const novoCuidador = await Cuidador.create({ 
        nome, email, senha, cpf, data_nascimento, tipo_usuario, palavra_seguranca 
    }, client);

    let assistidoIdPadrao = null;

    if (novoCuidador.tipo_usuario === 'padrao') {
      const novoAssistido = await Assistido.create({
        nome: novoCuidador.nome,
        data_nascimento: data_nascimento,
        cuidador_id: novoCuidador.id,
        nivel_suporte: nivel_suporte,       
        grau_seletividade: grau_seletividade 
      }, client);
      assistidoIdPadrao = novoAssistido.id;
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Cuidador cadastrado com sucesso!',
      cuidador: {
        id: novoCuidador.id,
        nome: novoCuidador.nome,
        email: novoCuidador.email,
        tipo_usuario: novoCuidador.tipo_usuario,
      },
      token: generateToken(novoCuidador.id),
      assistidoIdPadrao: assistidoIdPadrao,
      questionariosConcluidos: false // Novo registro sempre começa como false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar:', error);
    if (error.code === '23505') {
      if (error.constraint === 'cuidadores_cpf_key') return res.status(409).json({ error: 'O CPF informado já está em uso.' });
      if (error.constraint === 'cuidadores_email_key') return res.status(409).json({ error: 'Este e-mail já está em uso.' });
      return res.status(409).json({ error: 'Conflito de dados.' });
    }
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const cuidador = await Cuidador.findByEmail(email);
    if (!cuidador) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const senhaCorreta = await bcrypt.compare(senha, cuidador.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Credenciais inválidas.' });

    let assistidoIdPadrao = null;
    let questionariosConcluidos = true; // Padrão é true (liberado) para cuidadores

    if (cuidador.tipo_usuario === 'padrao') {
      const assistidoQuery = 'SELECT id FROM assistidos WHERE cuidador_id = $1 AND nome = $2';
      const assistidoRes = await db.query(assistidoQuery, [cuidador.id, cuidador.nome]);
      
      if (assistidoRes.rows.length > 0) {
        assistidoIdPadrao = assistidoRes.rows[0].id;
        // Verifica no banco se o usuário padrão já respondeu aos questionários
        questionariosConcluidos = await checkQuestionariosConcluidos(assistidoIdPadrao);
      } else {
        return res.status(500).json({ error: 'Erro de consistência: Usuário padrão sem assistido.' });
      }
    }
    
    res.status(200).json({
      message: 'Login bem-sucedido!',
      cuidador: {
        id: cuidador.id,
        nome: cuidador.nome,
        email: cuidador.email,
        tipo_usuario: cuidador.tipo_usuario,
      },
      token: generateToken(cuidador.id),
      assistidoIdPadrao: assistidoIdPadrao,
      questionariosConcluidos: questionariosConcluidos // Envia flag para frontend controlar navegação
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
  }
};

exports.recoverPassword = async (req, res) => {
    const { email, palavra_seguranca, nova_senha } = req.body;

    if (!email || !palavra_seguranca || !nova_senha) {
        return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    if (nova_senha.length < 8) {
        return res.status(400).json({ error: 'A nova senha precisa ter no mínimo 8 caracteres.' });
    }

    try {
        const cuidador = await Cuidador.findByEmail(email);
        if (!cuidador) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        if (!cuidador.palavra_seguranca) {
            return res.status(400).json({ error: 'Este usuário não possui palavra de segurança configurada.' });
        }

        // Normaliza a palavra enviada para comparar
        const palavraInputFormatada = palavra_seguranca.toLowerCase().replace(/\s+/g, '');
        
        if (palavraInputFormatada !== cuidador.palavra_seguranca) {
            return res.status(401).json({ error: 'Palavra de segurança incorreta.' });
        }

        await Cuidador.updatePassword(cuidador.id, nova_senha);

        res.status(200).json({ message: 'Senha alterada com sucesso! Faça login com a nova senha.' });

    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ error: 'Erro interno ao redefinir senha.' });
    }
};