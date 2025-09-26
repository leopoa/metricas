import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Search, TrendingUp } from 'lucide-react'
import LeadTimeChart from './LeadTimeChart'
import MonthlySummary from './MonthlySummary'
import ItemsList from './ItemsList'

const DiscoveryTab = ({ processedData }) => {
  // Funções de utilidade (movidas de CsvUpload ou duplicadas para clareza)
  const parseDate = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;
    try {
      const [datePart, timePart, period] = dateString.split(' ');
      const [day, monthStr, year] = datePart.split('/');
      const monthMap = {
        'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
      };
      const month = monthMap[monthStr.toLowerCase()];
      const fullYear = 2000 + parseInt(year);
      const [hours, minutes] = timePart.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      return new Date(fullYear, month, parseInt(day), hour, parseInt(minutes));
    } catch (error) {
      console.error('Erro ao converter data:', dateString, error);
      return null;
    }
  };

  const calculateMedian = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Adicione esta verificação para garantir que processedData não seja undefined
  if (!processedData || processedData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum dado processado disponível. Por favor, faça o upload de um arquivo CSV válido na aba "Upload".
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar apenas itens com dados de discovery válidos
  const discoveryData = processedData.filter(item => 
    item.analiseToAguardandoTime !== null && 
    item.analiseToAguardandoTime !== undefined &&
    item.aguardandoPriorizacaoData
  )

  if (discoveryData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum item com dados de discovery válidos encontrado. Verifique se o CSV contém as colunas "Campo personalizado (ANALISE_DATA)" e "Campo personalizado (AGUARDANDO_PRIORIZAÇÃO_DATA)" com dados válidos.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Agrupar dados por mês (baseado na data de aguardando priorização)
  const groupByMonth = (items) => {
    const grouped = {}
    
    items.forEach(item => {
      const aguardandoDate = parseDate(item.aguardandoPriorizacaoData)
      if (!aguardandoDate) return
      
      const monthKey = `${aguardandoDate.getFullYear()}-${String(aguardandoDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = aguardandoDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          name: monthName,
          items: []
        }
      }
      
      grouped[monthKey].items.push(item)
    })
    
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
  }

  const monthlyData = groupByMonth(discoveryData)

  // Preparar dados para gráfico mensal por tipo
  const monthlyChartData = monthlyData.map(month => {
    const typeGroups = {}
    
    month.items.forEach(item => {
      if (!typeGroups[item.type]) {
        typeGroups[item.type] = []
      }
      typeGroups[item.type].push(item.analiseToAguardandoTime)
    })
    
    const result = { name: month.name }
    Object.entries(typeGroups).forEach(([type, values]) => {
      result[type] = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    })
    
    return result
  })

  // Obter tipos únicos para datasets
  const uniqueTypes = [...new Set(discoveryData.map(item => item.type))]
  const typeColors = {
    'Bug': 'rgba(239, 68, 68, 0.6)',
    'Feature': 'rgba(59, 130, 246, 0.6)',
    'Task': 'rgba(34, 197, 94, 0.6)',
    'Story': 'rgba(168, 85, 247, 0.6)'
  }

  const datasets = uniqueTypes.map(type => ({
    key: type,
    name: type,
    color: typeColors[type] || 'rgba(156, 163, 175, 0.6)'
  }))

  // Preparar dados para gráficos por tipo
  const typeCharts = uniqueTypes.map(type => {
    const typeItems = discoveryData.filter(item => item.type === type)
    const values = typeItems.map(item => item.analiseToAguardandoTime)
    
    return {
      type,
      data: typeItems.map(item => ({ 
        key: item.key, 
        value: item.analiseToAguardandoTime,
        name: item.key,
        analiseData: item.analiseData,
        aguardandoPriorizacaoData: item.aguardandoPriorizacaoData
      })),
      stats: {
        count: typeItems.length,
        average: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
        median: Math.round(calculateMedian(values)),
        max: Math.max(...values)
      }
    }
  })

  // Colunas para a lista de itens
  const itemsColumns = [
    { key: 'key', label: 'Chave do Item', className: 'font-mono' },
    { key: 'type', label: 'Tipo', className: '' },
    { key: 'analiseData', label: 'Início Análise', type: 'date', className: 'text-sm' },
    { key: 'aguardandoPriorizacaoData', label: 'Aguardando Priorização', type: 'date', className: 'text-sm' },
    { key: 'analiseToAguardandoTime', label: 'Tempo Discovery', type: 'days', className: 'font-semibold' }
  ]

  return (
    <div className="space-y-6">
      {/* Resumos Mensais */}
      <MonthlySummary 
        data={discoveryData}
        calculateMedian={calculateMedian}
        title="Discovery"
        type="discovery"
      />

      {/* Gráficos */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gráficos de Discovery</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gráfico Discovery Médio por Mês e Tipo */}
          {monthlyChartData.length > 0 && (
            <LeadTimeChart
              title="Tempo Discovery por Mês e Tipo"
              description="Evolução do tempo de discovery (Análise → Aguardando Priorização) por mês e tipo"
              data={monthlyChartData}
              isMultiDataset={true}
              datasets={datasets}
              xAxisKey="name"
              formula="Média(Aguardando Priorização - Análise) agrupado por Mês e Tipo"
              columns={['Campo personalizado (ANALISE_DATA)', 'Campo personalizado (AGUARDANDO_PRIORIZAÇÃO_DATA)', 'Tipo de item']}
            />
          )}

          {/* Gráficos por Tipo */}
          {typeCharts.map((typeChart) => (
            <LeadTimeChart
              key={typeChart.type}
              title={`Discovery - ${typeChart.type}`}
              description={`Tempo de discovery em dias para itens do tipo "${typeChart.type}" (${typeChart.stats.count} itens)`}
              data={typeChart.data}
              dataKey="value"
              formula="Aguardando Priorização - Análise (em dias)"
              columns={['Campo personalizado (ANALISE_DATA)', 'Campo personalizado (AGUARDANDO_PRIORIZAÇÃO_DATA)']}
              colors={[typeColors[typeChart.type] || 'rgba(156, 163, 175, 0.6)']}
            />
          ))}
        </div>
      </div>

      {/* Lista de Itens */}
      <ItemsList
        title="Itens com Dados de Discovery"
        items={discoveryData}
        columns={itemsColumns}
        type="discovery"
      />
    </div>
  )
}

export default DiscoveryTab


