import { RelatorioGeral } from '../api/relatorio';
import { format } from 'date-fns';

export const generateReportHtml = (data: RelatorioGeral): string => {
  
  const formattedDate = (dateString: string) => {
      try {
          return format(new Date(dateString), 'dd/MM/yyyy');
      } catch { return 'N/I'; }
  };

  const formattedDateTime = (dateString: string) => {
      try {
          return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
      } catch { return 'N/I'; }
  };

  // Gera as linhas da tabela de questionários
  const questionariosRows = data.questionarios.length > 0 
    ? data.questionarios.map(q => `
        <tr>
            <td><strong>${q.questionario}</strong></td>
            <td>${q.texto_pergunta}</td>
            <td class="response">${q.texto_opcao}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3">Nenhum questionário respondido.</td></tr>`;

  // Gera os blocos do histórico
  const historicoBlocks = data.historicoTrocas.length > 0
    ? data.historicoTrocas.map(troca => `
        <div class="troca-block">
            <div class="troca-header">
                <span>${troca.refeicao}</span>
                <span>${formattedDateTime(troca.data)}</span>
            </div>
            <ul class="troca-items">
                ${troca.itens.map(item => `
                    <li>
                        <strong>${item.alimento}</strong> 
                        <span class="status-${item.status}">${item.status.toUpperCase()}</span>
                        ${item.motivo ? `<br><small>${item.motivo}</small>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>
      `).join('')
    : `<p>Nenhuma troca registrada.</p>`;

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #87CFCF; text-align: center; margin-bottom: 10px; }
          h2 { border-bottom: 2px solid #87CFCF; padding-bottom: 5px; margin-top: 30px; color: #2C3E50; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .label { font-weight: bold; color: #666; font-size: 0.9em; }
          .value { font-size: 1.1em; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; }
          th { background-color: #f2f2f2; }
          .response { color: #A6C98C; font-weight: bold; }

          .troca-block { border: 1px solid #eee; border-radius: 5px; margin-bottom: 15px; page-break-inside: avoid; }
          .troca-header { background-color: #f9f9f9; padding: 10px; display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #eee; }
          .troca-items { list-style: none; padding: 10px; margin: 0; }
          .troca-items li { margin-bottom: 8px; }
          
          .status-aceito { color: #A6C98C; font-weight: bold; margin-left: 5px; }
          .status-recusado { color: #F16038; font-weight: bold; margin-left: 5px; }
          
          footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #999; }
        </style>
      </head>
      <body>
        <h1>Relatório Geral - TEA App</h1>
        
        <h2>Dados Pessoais</h2>
        <div class="info-grid">
            <div><div class="label">Nome</div><div class="value">${data.dadosPessoais.nome}</div></div>
            <div><div class="label">Nascimento</div><div class="value">${formattedDate(data.dadosPessoais.dataNascimento)}</div></div>
            <div><div class="label">Nível de Suporte</div><div class="value">${data.dadosPessoais.nivelSuporte || 'N/I'}</div></div>
            <div><div class="label">Grau de Seletividade</div><div class="value">${data.dadosPessoais.grauSeletividade || 'N/I'}</div></div>
        </div>

        <h2>Respostas aos Questionários</h2>
        <table>
            <thead>
                <tr>
                    <th width="25%">Questionário</th>
                    <th width="50%">Pergunta</th>
                    <th width="25%">Resposta</th>
                </tr>
            </thead>
            <tbody>
                ${questionariosRows}
            </tbody>
        </table>

        <h2>Histórico de Trocas Alimentares</h2>
        ${historicoBlocks}

        <footer>
            Gerado em ${new Date().toLocaleDateString()} pelo Aplicativo de Apoio à Seletividade Alimentar.
        </footer>
      </body>
    </html>
  `;
};