const fs = require('fs');
const path = require('path');

// 1. Defina aqui as pastas onde está o SEU código real (evitamos node_modules e arquivos gerados)
const pastasParaLer = [
    './backend/src',
    './app-tea/app',
    './app-tea/api',
    './app-tea/components',
    './app-tea/utils',
    './app-tea/context'
];

// 2. Extensões que queremos capturar
const extensoesValidas = ['.js', '.ts', '.tsx'];
const arquivoDeSaida = './codigo_fonte_limpo.txt';

let conteudoFinal = '';

function lerDiretorio(diretorio) {
    const arquivos = fs.readdirSync(diretorio);
    arquivos.forEach(arquivo => {
        const caminhoCompleto = path.join(diretorio, arquivo);
        const status = fs.statSync(caminhoCompleto);

        // Se for uma pasta, entra nela (recursividade)
        if (status.isDirectory()) {
            lerDiretorio(caminhoCompleto);
        } else if (extensoesValidas.includes(path.extname(caminhoCompleto))) {
            processarArquivo(caminhoCompleto);
        }
    });
}

function processarArquivo(caminhoArquivo) {
    let conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');

    // MÁGICA: Remove comentários de bloco (/* ... */) e de linha (// ...)
    // A expressão ([^:]|^) garante que não quebramos os links http://
    conteudo = conteudo.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*/g, '$1');

    // Remove as linhas em branco excessivas que ficam após apagar os comentários
    conteudo = conteudo.replace(/^\s*[\r\n]/gm, '');

    // Adiciona um cabeçalho bonito para separar cada ficheiro
    conteudoFinal += `\n\n========================================================\n`;
    conteudoFinal += `ARQUIVO: ${caminhoArquivo}\n`;
    conteudoFinal += `========================================================\n\n`;
    conteudoFinal += conteudo;
}

// Inicia o processo
console.log('A processar o código-fonte...');
pastasParaLer.forEach(pasta => {
    if (fs.existsSync(pasta)) {
        lerDiretorio(pasta);
    }
});

// Guarda o ficheiro final
fs.writeFileSync(arquivoDeSaida, conteudoFinal, 'utf-8');
console.log(`✅ Concluído! O seu código limpo foi guardado em: ${arquivoDeSaida}`);