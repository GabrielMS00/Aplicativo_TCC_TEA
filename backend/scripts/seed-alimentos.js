const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Carrega o .env da raiz

const { Pool } = require('pg');

// --- DADOS MESTRE DE ALIMENTOS E PERFIS ---

const alimentosParaInserir = [
  // --- Frutas (Expandido) ---
  { nome: 'Banana', grupo_alimentar: 'Frutas', perfis: [ { forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Amassada', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Frita', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Almoço'] }, { forma_de_preparo: 'Vitamina', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] } ] },
  { nome: 'Maçã', grupo_alimentar: 'Frutas', perfis: [ { forma_de_preparo: 'Crua (com casca)', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Vermelho', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Crua (sem casca)', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Cozida (Papinha)', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Raspada', textura: 'Granulada', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] } ] },
  { nome: 'Mamão', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Uva', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Suculenta', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Melancia', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Aguada', sabor: 'Doce', cor_predominante: 'Vermelho', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Laranja', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Em gomos', textura: 'Suculenta', sabor: 'Ácido', cor_predominante: 'Laranja', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Morango', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Ácido', cor_predominante: 'Vermelho', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Pêra', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Crua', textura: 'Granulada', sabor: 'Doce', cor_predominante: 'Verde', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Abacate', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Amassado', textura: 'Pastosa', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Vitamina', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Kiwi', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Ácido', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Abacaxi', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Fibrosa', sabor: 'Ácido', cor_predominante: 'Amarelo', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Manga', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Melão', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Suculenta', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Ameixa', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Goiaba', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Rosa', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Pêssego', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Suculenta', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Em calda', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Tangerina', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Em gomos', textura: 'Suculenta', sabor: 'Ácido', cor_predominante: 'Laranja', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Figo', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Granulada', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Caju', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Fibrosa', sabor: 'Ácido', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Caqui', grupo_alimentar: 'Frutas', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },

  // --- Verduras e Legumes (Expandido) ---
  { nome: 'Cenoura', grupo_alimentar: 'Verduras e Legumes', perfis: [ { forma_de_preparo: 'Crua (Palito)', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Ambiente', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }, { forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Ralada', textura: 'Fibrosa', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] } ] },
  { nome: 'Brócolis', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Alface', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Crua', textura: 'Crocante', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Tomate', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cru', textura: 'Suculento', sabor: 'Ácido', cor_predominante: 'Vermelho', temperatura_servico: 'Ambiente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Molho', textura: 'Pastosa', sabor: 'Ácido', cor_predominante: 'Vermelho', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Cereja', textura: 'Suculenta', sabor: 'Doce', cor_predominante: 'Vermelho', temperatura_servico: 'Ambiente', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }] },
  { nome: 'Beterraba', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Crua (Ralada)', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Abobrinha', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Refogada', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Espinafre', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Refogado', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Couve-flor', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Gratinada', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Pepino', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cru', textura: 'Crocante', sabor: 'Aguado', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Pimentão', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cru', textura: 'Crocante', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Ambiente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Abóbora', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Purê', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Couve', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Refogada', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Palmito', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Conserva', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Berinjela', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Refogada', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Roxo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'À milanesa', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Ervilha', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Conserva', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Verde', temperatura_servico: 'Ambiente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Vagem', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Fibrosa', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Rúcula', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Crua', textura: 'Crocante', sabor: 'Amargo', cor_predominante: 'Verde', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Chuchu', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Macia', sabor: 'Aguado', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Rabanete', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Cru', textura: 'Crocante', sabor: 'Picante', cor_predominante: 'Rosa', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Quiabo', grupo_alimentar: 'Verduras e Legumes', perfis: [{ forma_de_preparo: 'Refogado', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Verde', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  
  // --- Proteínas (Expandido) ---
  { nome: 'Carne Bovina', grupo_alimentar: 'Proteínas', perfis: [ { forma_de_preparo: 'Moída', textura: 'Granulada', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Bife', textura: 'Firme', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Cozida (Panela)', textura: 'Desfiada', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Hambúrguer (Caseiro)', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }, { forma_de_preparo: 'Almôndega', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] } ] },
  { nome: 'Frango', grupo_alimentar: 'Proteínas', perfis: [ { forma_de_preparo: 'Grelhado', textura: 'Firme', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Desfiado', textura: 'Desfiada', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }, { forma_de_preparo: 'Assado (Coxa)', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Empanado (Caseiro)', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }, { forma_de_preparo: 'Sopa (Cubos)', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Jantar'] } ] },
  { nome: 'Ovo', grupo_alimentar: 'Proteínas', perfis: [ { forma_de_preparo: 'Cozido', textura: 'Firme', sabor: 'Suave', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Lanche', 'Almoço', 'Jantar'] }, { forma_de_preparo: 'Mexido', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Jantar'] }, { forma_de_preparo: 'Frito', textura: 'Elástica', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Almoço'] }, { forma_de_preparo: 'Omelete', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Jantar'] } ] },
  { nome: 'Feijão', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Peixe', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Grelhado', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Empanado', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Cozido', textura: 'Desfiada', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Lentilha', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Carne de porco', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Grelhada', textura: 'Firme', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Grão-de-bico', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Tofu', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Grelhado', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Salmão', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Assado', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Laranja', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Linguiça', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Grelhada', textura: 'Firme', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Atum', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Enlatado', textura: 'Desfiada', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Frio', refeicoes: ['Lanche', 'Jantar'] }] },
  { nome: 'Sardinha', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Enlatada', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Prata', temperatura_servico: 'Frio', refeicoes: ['Lanche', 'Jantar'] }] },
  { nome: 'Quibe', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Frito', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Jantar'] }] },
  { nome: 'Soja', grupo_alimentar: 'Proteínas', perfis: [{ forma_de_preparo: 'Texturizada (Refogada)', textura: 'Granulada', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  
  // --- Cereais e Tubérculos (Expandido) ---
  { nome: 'Arroz', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Branco Cozido', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Integral Cozido', textura: 'Firme', sabor: 'Neutro', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Batata', grupo_alimentar: 'Cereais e Tubérculos', perfis: [ { forma_de_preparo: 'Frita (Palito)', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }, { forma_de_preparo: 'Frita (Chips)', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Purê', textura: 'Pastosa', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Assada', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Sopa (Creme)', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Jantar'] } ] },
  { nome: 'Macarrão', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Molho Vermelho', textura: 'Macia', sabor: 'Ácido', cor_predominante: 'Vermelho', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Molho Branco', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Alho e Óleo', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Pão', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Forma', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Francês', textura: 'Crocante', sabor: 'Neutro', cor_predominante: 'Dourado', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Na chapa (com manteiga)', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Torrada', textura: 'Crocante', sabor: 'Neutro', cor_predominante: 'Dourado', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Batata-doce', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Assada', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Laranja', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }] },
  { nome: 'Mandioca', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Frita', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Milho', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Jantar'] }, { forma_de_preparo: 'Creme', textura: 'Cremosa', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Aveia', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Mingau', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã'] }, { forma_de_preparo: 'Flocos', textura: 'Seca', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Quinoa', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Inhame', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Macia', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Purê', textura: 'Pastosa', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Cuscuz', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozido', textura: 'Granulada', sabor: 'Neutro', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Jantar'] }] },
  { nome: 'Tapioca', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Feita', textura: 'Elástica', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Polenta', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Frita', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Batata Baroa', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Purê', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Biscoito de Arroz', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Natural', textura: 'Crocante', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Granola', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Natural', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Farofa', grupo_alimentar: 'Cereais e Tubérculos', perfis: [{ forma_de_preparo: 'Pronta', textura: 'Seca', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Almoço', 'Jantar'] }] },
  
  // --- Laticínios (Expandido) ---
  { nome: 'Leite', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Líquido', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Com Achocolatado', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Iogurte', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Natural', textura: 'Cremosa', sabor: 'Ácido', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Sabor Morango', textura: 'Cremosa', sabor: 'Doce', cor_predominante: 'Rosa', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Grego', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Queijo', grupo_alimentar: 'Laticínios', perfis: [ { forma_de_preparo: 'Mussarela', textura: 'Elástica', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Prato', textura: 'Elástica', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Minas Frescal', textura: 'Macia', sabor: 'Suave', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Cottage', textura: 'Granulada', sabor: 'Suave', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Parmesão Ralado', textura: 'Seca', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Almoço', 'Jantar'] }, { forma_de_preparo: 'Ricota', textura: 'Granulada', sabor: 'Suave', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] } ] },
  { nome: 'Requeijão', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Cremoso', textura: 'Cremosa', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Manteiga', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Pastosa', textura: 'Pastosa', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Leite em pó', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Pó', textura: 'Seca', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Creme de Leite', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Natural', textura: 'Cremosa', sabor: 'Neutro', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }] },
  { nome: 'Leite Fermentado', grupo_alimentar: 'Laticínios', perfis: [{ forma_de_preparo: 'Líquido', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },

  // --- Outros (Alimentos Processados e Itens de Conforto) (Expandido) ---
  { nome: 'Biscoito', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Maisena', textura: 'Seca', sabor: 'Doce', cor_predominante: 'Dourado', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Recheado', textura: 'Crocante', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Água e Sal', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }, { forma_de_preparo: 'Polvilho', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Chocolate', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Barra', textura: 'Firme', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Suco de caixinha', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Líquido', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Variada', temperatura_servico: 'Frio', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Refrigerante', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Líquido', textura: 'Líquida', sabor: 'Doce', cor_predominante: 'Variada', temperatura_servico: 'Frio', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }] },
  { nome: 'Gelatina', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Natural', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Variada', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Pipoca', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Salgada', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Branco', temperatura_servico: 'Quente', refeicoes: ['Lanche'] }] },
  { nome: 'Batata Frita (industrializada)', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Frita', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }] },
  { nome: 'Salgadinho', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Pacote', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Bolo', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Simples', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Amarelo', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }, { forma_de_preparo: 'Chocolate', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Pão de queijo', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Assado', textura: 'Elástica', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Pizza', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Queijo', textura: 'Elástica', sabor: 'Salgado', cor_predominante: 'Amarelo', temperatura_servico: 'Quente', refeicoes: ['Jantar', 'Lanche'] }] },
  { nome: 'Hambúrguer (industrializado)', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Grelhado', textura: 'Firme', sabor: 'Salgado', cor_predominante: 'Marrom', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar'] }] },
  { nome: 'Salsicha', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Cozida', textura: 'Macia', sabor: 'Salgado', cor_predominante: 'Rosa', temperatura_servico: 'Quente', refeicoes: ['Lanche', 'Jantar'] }] },
  { nome: 'Danoninho', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Natural', textura: 'Cremosa', sabor: 'Doce', cor_predominante: 'Rosa', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Nuggets', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Frito', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Almoço', 'Jantar', 'Lanche'] }] },
  { nome: 'Pastel', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Frito', textura: 'Crocante', sabor: 'Salgado', cor_predominante: 'Dourado', temperatura_servico: 'Quente', refeicoes: ['Lanche'] }] },
  { nome: 'Geleia', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Natural', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Variada', temperatura_servico: 'Ambiente', refeicoes: ['Café da Manhã', 'Lanche'] }] },
  { nome: 'Doce de Leite', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Pastoso', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Açaí', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Tigela', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Roxo', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Sorvete', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Massa', textura: 'Cremosa', sabor: 'Doce', cor_predominante: 'Variada', temperatura_servico: 'Frio', refeicoes: ['Lanche'] }] },
  { nome: 'Brigadeiro', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Enrolado', textura: 'Macia', sabor: 'Doce', cor_predominante: 'Marrom', temperatura_servico: 'Ambiente', refeicoes: ['Lanche'] }] },
  { nome: 'Ketchup', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Molho', textura: 'Pastosa', sabor: 'Doce', cor_predominante: 'Vermelho', temperatura_servico: 'Ambiente', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }] },
  { nome: 'Maionese', grupo_alimentar: 'Outros', perfis: [{ forma_de_preparo: 'Molho', textura: 'Cremosa', sabor: 'Ácido', cor_predominante: 'Branco', temperatura_servico: 'Frio', refeicoes: ['Lanche', 'Almoço', 'Jantar'] }] },
];

const refeicoesParaInserir = ['Café da Manhã', 'Lanche', 'Almoço', 'Jantar'];

// --- LÓGICA DO SCRIPT ---

// Configura a conexão com o banco de dados.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function seedAlimentosEPerfis() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seeding de alimentos, perfis e refeições...');
    await client.query('BEGIN');

    // Garante que todas as refeições existam e carrega seus IDs para um mapa de acesso rápido.
    await Promise.all(refeicoesParaInserir.map(refeicao =>
      client.query('INSERT INTO refeicoes (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING', [refeicao])
    ));
    const refeicoesDb = (await client.query('SELECT * FROM refeicoes')).rows;
    const mapaRefeicoes = Object.fromEntries(refeicoesDb.map(r => [r.nome, r.id]));

    // Itera sobre a lista de alimentos para inserir/atualizar no banco.
    for (const alimento of alimentosParaInserir) {
      const resAlimento = await client.query(
        'INSERT INTO alimentos (nome, grupo_alimentar) VALUES ($1, $2) ON CONFLICT (nome) DO UPDATE SET grupo_alimentar = EXCLUDED.grupo_alimentar RETURNING id',
        [alimento.nome, alimento.grupo_alimentar]
      );
      const alimentoId = resAlimento.rows[0].id;

      if (alimento.perfis && alimento.perfis.length > 0) {
        for (const perfil of alimento.perfis) {
          // Insere/atualiza o perfil sensorial.
          const resPerfil = await client.query(
            `INSERT INTO perfis_sensoriais (alimento_id, forma_de_preparo, textura, sabor, cor_predominante, temperatura_servico)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (alimento_id, forma_de_preparo) DO UPDATE SET textura = EXCLUDED.textura RETURNING id`,
            [alimentoId, perfil.forma_de_preparo, perfil.textura, perfil.sabor, perfil.cor_predominante, perfil.temperatura_servico]
          );
          const perfilId = resPerfil.rows[0].id;

          // Associa o perfil às suas refeições na tabela de junção.
          if (perfil.refeicoes && perfil.refeicoes.length > 0) {
            for (const nomeRefeicao of perfil.refeicoes) {
              const refeicaoId = mapaRefeicoes[nomeRefeicao];
              if (refeicaoId) {
                await client.query(
                  'INSERT INTO perfil_refeicao (perfil_sensorial_id, refeicao_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [perfilId, refeicaoId]
                );
              }
            }
          }
        }
      }
    }
    
    console.log('Dados de alimentos, perfis e refeições processados.');
    await client.query('COMMIT');
    console.log('✅ Seeding de alimentos concluído.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante o seeding de alimentos:', error);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seedAlimentosEPerfis();