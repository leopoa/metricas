import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { TrendingUp, Target, Award } from 'lucide-react'
import FilteredItemsList from './FilteredItemsList'
import MonthlyPercentilesCard from './MonthlyPercentilesCard'
import MonthlyDistributionCard from './MonthlyDistributionCard'
import LeadTimeChart from './LeadTimeChart'

const LeadTimeTab = ({ processedData }) => {
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

  // Filtrar apenas itens com lead time válido e que não sejam do tipo 'epic'
  const leadTimeData = processedData.filter(item => 
    item.leadTime !== null && 
    item.leadTime !== undefined &&
    item.resolved &&
    item.type?.toLowerCase() !== 'epic'
  );

  if (leadTimeData.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum item com lead time válido encontrado. Verifique se o CSV contém as colunas "Criado" e "Resolvido" com dados válidos.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Função para calcular percentil
  const calculatePercentile = (values, percentile) => {
    const sorted = [...values].sort((a, b) => a - b)
    const index = percentile * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    
    if (upper >= sorted.length) return sorted[sorted.length - 1]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  // Agrupar dados por mês (baseado na data de resolução)
  const groupByMonth = (items) => {
    const grouped = {}
    
    items.forEach(item => {
      const resolvedDate = parseDate(item.resolved)
      if (!resolvedDate) return
      
      const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = resolvedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
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

  const monthlyData = groupByMonth(leadTimeData)

  // Função para agrupar por mês e calcular percentis
  const getMonthlyPercentileData = (items) => {
    const monthlyData = groupByMonth(items);
    
    return monthlyData.map(month => {
      const leadTimes = month.items.map(item => item.leadTime);
      if (leadTimes.length === 0) {
        return {
          name: month.name,
          p70: null,
          p85: null,
          p95: null
        };
      }
      
      return {
        name: month.name,
        p70: Math.round(calculatePercentile(leadTimes, 0.70)),
        p85: Math.round(calculatePercentile(leadTimes, 0.85)),
        p95: Math.round(calculatePercentile(leadTimes, 0.95))
      };
    });
  };
  
  const monthlyPercentileData = getMonthlyPercentileData(leadTimeData);

  // Preparar dados para gráfico mensal por tipo
  const monthlyChartData = monthlyData.map(month => {
    const typeGroups = {}
    
    month.items.forEach(item => {
      if (!typeGroups[item.type]) {
        typeGroups[item.type] = []
      }
      typeGroups[item.type].push(item.leadTime)
    })
    
    const result = { name: month.name }
    Object.entries(typeGroups).forEach(([type, values]) => {
      result[type] = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
    })
    
    return result
  })

  // Obter tipos únicos para datasets
  const uniqueTypes = [...new Set(leadTimeData.map(item => item.type))]
  const typeColors = {
    'Bug': 'rgba(239, 68, 68, 0.8)',
    'Feature': 'rgba(59, 130, 246, 0.8)',
    'Task': 'rgba(34, 197, 94, 0.8)',
    'Story': 'rgba(168, 85, 247, 0.8)',
    'historias': 'rgba(168, 85, 247, 0.8)',
    'melhorias': 'rgba(59, 130, 246, 0.8)',
    'incidentes': 'rgba(239, 68, 68, 0.8)'
  }

  const datasets = uniqueTypes.map(type => ({
    key: type,
    name: type,
    color: typeColors[type] || 'rgba(156, 163, 175, 0.8)'
  }))

  // Preparar dados para gráficos por tipo (agrupados por mês)
  const monthlyTypeCharts = monthlyData.map(month => {
    const typeCharts = uniqueTypes.map(type => {
      const typeItems = month.items.filter(item => item.type === type)
      const values = typeItems.map(item => item.leadTime)
      
      if (typeItems.length === 0) return null
      
      return {
        monthName: month.name,
        type,
        data: typeItems,
        stats: {
          count: typeItems.length,
          average: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
          median: Math.round(calculateMedian(values)),
          max: Math.max(...values)
        }
      }
    }).filter(chart => chart !== null)
    
    return {
      monthName: month.name,
      typeCharts
    }
  })

  return (
    <div className="space-y-8">
      
      {/* Percentis por Mês e Tipo */}
      <MonthlyPercentilesCard 
        data={leadTimeData}
        calculatePercentile={calculatePercentile}
        parseDate={parseDate}
        title="Percentis de Lead Time por Mês e Tipo"
      />

      {/* Distribuição em Faixas por Mês e Tipo */}
      {/* Para seguir o mesmo layout da listagem 1, o componente MonthlyDistributionCard
        precisa ser ajustado para usar uma grade de 3 colunas. A lógica do layout
        deve estar dentro desse componente.
      */}
      <MonthlyDistributionCard 
        data={leadTimeData}
        parseDate={parseDate}
        title="Distribuição de Lead Time em Faixas por Mês e Tipo"
      />

      {/* Gráficos */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <TrendingUp className="h-5 w-5" />
            Gráficos de Lead Time
          </CardTitle>
          <CardDescription className="text-gray-600">
            Visualização gráfica da evolução do lead time ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Gráfico Lead Time Médio por Mês e Tipo */}
          {monthlyChartData.length > 0 && (
            <div className="mb-8">              
              <div className="grid grid-cols-1 gap-6">
                <EnhancedLeadTimeChart
                  title="Lead time médio agrupado por mês e tipo de item"
                  description=""
                  data={monthlyChartData}
                  isMultiDataset={true}
                  datasets={datasets}
                  xAxisKey="name"                  
                  columns={['Criado', 'Resolvido', 'Tipo de item']}
                />
              </div>
            </div>
          )}

          {/* NOVO GRÁFICO DE PERCENTIL POR MÊS */}
          {monthlyPercentileData.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6">
                <LeadTimeChart
                  title="Evolução dos Percentis de Lead Time por Mês"
                  description="Visualize a estabilidade e a tendência do seu lead time através dos percentis ao longo do tempo."
                  data={monthlyPercentileData}
                  isMultiDataset={true}
                  xAxisKey="name"
                  datasets={[
                    { key: 'p70', name: 'Percentil 70', color: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgba(59, 130, 246, 1)' },
                    { key: 'p85', name: 'Percentil 85', color: 'rgba(34, 197, 94, 0.6)', borderColor: 'rgba(34, 197, 94, 1)' },
                    { key: 'p95', name: 'Percentil 95', color: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgba(239, 68, 68, 1)' }
                  ]}
                  chartType="line"
                  columns={['Criado', 'Resolvido', 'Lead Time']}
                />
              </div>
            </div>
          )}

          {/* Gráficos por Mês e Tipo */}
          {monthlyTypeCharts.map((monthData) => (
            <div key={monthData.monthName} className="space-y-4">
              <h3 className="text-m font-semibold text-gray-800 border-b border-gray-200 pb-2">
                {monthData.monthName} - Lead Time por Tipo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthData.typeCharts.map((typeChart) => (
                  
                      <LeadTimeChart
                        title={`${typeChart.type}`}
                        description={`${typeChart.stats.count} itens • Média: ${typeChart.stats.average}d • Máx: ${typeChart.stats.max}d`}
                        data={typeChart.data}                        
                        columns={['Criado', 'Resolvido']}
                        colors={[typeColors[typeChart.type] || 'rgba(156, 163, 175, 0.8)']}
                      />
                  
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lista de Itens com Filtros */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <TrendingUp className="h-5 w-5" />
              Lista Detalhada de Itens com Lead Time
            </CardTitle>
          <CardDescription className="text-gray-600">
            Lista completa com filtros por tipo de item e faixas de lead time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {/* Comentário: A cor de fundo do filtro precisa ser ajustada dentro do componente FilteredItemsList. */}
          <FilteredItemsList
            title="Lista Detalhada de Itens com Lead Time"
            items={leadTimeData}
            type="leadtime"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default LeadTimeTab