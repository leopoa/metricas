# Analisador de Lead Time

Uma aplicação React avançada para análise de métricas de tempo baseada em dados CSV, com interface organizada em abas e suporte a múltiplos tipos de análise.

## Funcionalidades

1. **Upload Inteligente de CSV**
- Mapeamento Flexível de Colunas: Interface intuitiva para mapear as colunas do seu CSV com os campos necessários
- Validação em Tempo Real: Verificação automática da estrutura do arquivo e dados obrigatórios
- Pré-visualização: Visualização prévia dos dados antes do processamento
- Estatísticas de Upload: Relatório detalhado com taxas de sucesso e erros encontrados

2. **Análise de Lead Time**
- Percentis por Mês e Tipo: Visualização de percentis (70%, 85%, 95%) agrupados por tipo de item
- Distribuição em Faixas: Análise de como os itens se distribuem em diferentes faixas de tempo
- Gráficos Interativos: Evolução temporal dos lead times com filtros por área e tipo
- Lista Filtrada: Tabela detalhada com múltiplos filtros (tipo, status, área, faixa de tempo)

3. **Cálculo de Esforço**
- Análise por Fase: Breakdown do tempo gasto em cada fase do desenvolvimento:
--- Análise → Aprovação
--- Refinamento → Priorização
--- Sprint → Review
--- Release → Entrega
- Gestão de Bloqueios: Detecção e cálculo automático de tempos de bloqueio
- Comparação com Estimativas: Análise de variação entre esforço real e estimado

4. **Monitoramento de Itens em Review**
- Dias em Review: Cálculo automático do tempo em estado de revisão
- Classificação por Período: Agrupamento em faixas (até 30 dias, 31-60 dias, etc.)
- Filtros Avançados: Por tipo, área e tempo em review
- Alertas Visuais: Destaque para itens com maior tempo parado

## Como usar

1. **Iniciar a aplicação**:
   ```bash
   cd leadtime-analyzer
   pnpm install
   pnpm run dev --host
   ```

2. **Acessar no navegador**: http://localhost:5174

3. **Fazer upload do CSV**: Clique em "Selecione o arquivo CSV" e escolha seu arquivo

## Tecnologias utilizadas

- **React 19**: Framework principal
- **Chart.js**: Biblioteca para gráficos
- **Papa Parse**: Parser de CSV
- **Tailwind CSS**: Estilização
- **shadcn/ui**: Componentes de interface
- **Vite**: Build tool
