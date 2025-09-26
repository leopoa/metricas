import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { TrendingUp } from 'lucide-react'
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

  const leadTimeData = processedData.filter(item => 
    item.leadTime !== null && 
    item.leadTime !== undefined &&
    item.resolved &&
    item.type?.toLowerCase() !== 'epic' &&
    item.type?.toLowerCase() !== 'bug'
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

  const calculatePercentile = (values, percentile) => {
    const sorted = [...values].sort((a, b) => a - b)
    const index = percentile * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1
    
    if (upper >= sorted.length) return sorted[sorted.length - 1]
    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  const groupByMonth = (items) => {
    const grouped = {}
    
    items.forEach(item => {
      const resolvedDate = parseDate(item.resolved)
      if (!resolvedDate) return
      
      const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = resolvedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          key: monthKey,
          name: monthName,
          items: [],
          date: new Date(resolvedDate.getFullYear(), resolvedDate.getMonth(), 1) // Data para ordenação
        }
      }
      
      grouped[monthKey].items.push(item)
    })
    
    return Object.values(grouped).sort((a, b) => a.date - b.date) // Ordenar por data
  }

  // Função para calcular percentis mensais
  const getMonthlyPercentileData = (items) => {
    const monthlyData = groupByMonth(items)
    
    return monthlyData.map(month => {
      const leadTimes = month.items.map(item => item.leadTime)
      const sortedLeadTimes = [...leadTimes].sort((a, b) => a - b)
      
      return {
        name: month.name,
        p70: Math.round(calculatePercentile(sortedLeadTimes, 0.70)),
        p85: Math.round(calculatePercentile(sortedLeadTimes, 0.85)),
        p95: Math.round(calculatePercentile(sortedLeadTimes, 0.95)),
        totalItems: leadTimes.length
      }
    }).filter(month => month.totalItems > 0)
  }

  // Função para calcular lead time médio por tipo e mês
  const getMonthlyLeadTimeByType = (items) => {
    const monthlyData = groupByMonth(items)
    
    return monthlyData.map(month => {
      // Agrupar itens por tipo dentro do mês
      const itemsByType = {}
      month.items.forEach(item => {
        if (!item.type) return
        
        if (!itemsByType[item.type]) {
          itemsByType[item.type] = []
        }
        itemsByType[item.type].push(item.leadTime)
      })
      
      // Calcular lead time médio para cada tipo
      const result = { name: month.name }
      Object.keys(itemsByType).forEach(type => {
        const leadTimes = itemsByType[type]
        const average = Math.round(leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length)
        result[type] = average
      })
      
      return result
    }).filter(month => Object.keys(month).length > 1) // Filtra meses que têm pelo menos um tipo
  }

  // Áreas únicas para filtro
  const uniqueAreas = useMemo(() => {
    return [...new Set(leadTimeData.map(item => item.area).filter(Boolean))]
  }, [leadTimeData])

  // Tipos únicos para filtro
  const uniqueTypes = useMemo(() => {
    return [...new Set(leadTimeData.map(item => item.type).filter(Boolean))]
  }, [leadTimeData])

  // Estados SEPARADOS para cada gráfico
  const [percentileSelectedAreas, setPercentileSelectedAreas] = useState([])
  const [percentileSelectedTypes, setPercentileSelectedTypes] = useState([])
  const [leadtimeSelectedAreas, setLeadtimeSelectedAreas] = useState([])
  const [leadtimeSelectedTypes, setLeadtimeSelectedTypes] = useState([])

  // Filtrar dados para o gráfico de percentis
  const filteredPercentileData = useMemo(() => {
    let data = leadTimeData;
    if (percentileSelectedAreas.length > 0) {
      data = data.filter(item => percentileSelectedAreas.includes(item.area))
    }
    if (percentileSelectedTypes.length > 0) {
      data = data.filter(item => percentileSelectedTypes.includes(item.type))
    }
    return data;
  }, [leadTimeData, percentileSelectedAreas, percentileSelectedTypes])

  // Filtrar dados para o gráfico de lead time por tipo
  const filteredLeadTimeData = useMemo(() => {
    let data = leadTimeData;
    if (leadtimeSelectedAreas.length > 0) {
      data = data.filter(item => leadtimeSelectedAreas.includes(item.area))
    }
    if (leadtimeSelectedTypes.length > 0) {
      data = data.filter(item => leadtimeSelectedTypes.includes(item.type))
    }
    return data;
  }, [leadTimeData, leadtimeSelectedAreas, leadtimeSelectedTypes])

  const monthlyPercentileData = useMemo(() => {
    return getMonthlyPercentileData(filteredPercentileData)
  }, [filteredPercentileData])

  const monthlyLeadTimeByType = useMemo(() => {
    return getMonthlyLeadTimeByType(filteredLeadTimeData)
  }, [filteredLeadTimeData])
  
  // Handlers SEPARADOS para cada gráfico
  const handlePercentileAreaChange = (newSelectedAreas) => {
    setPercentileSelectedAreas(newSelectedAreas);
  };

  const handlePercentileTypeChange = (newSelectedTypes) => {
    setPercentileSelectedTypes(newSelectedTypes);
  };

  const handleLeadtimeAreaChange = (newSelectedAreas) => {
    setLeadtimeSelectedAreas(newSelectedAreas);
  };

  const handleLeadtimeTypeChange = (newSelectedTypes) => {
    setLeadtimeSelectedTypes(newSelectedTypes);
  };
  
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
      <MonthlyDistributionCard 
        data={leadTimeData}
        parseDate={parseDate}
        title="Distribuição de Lead Time em Faixas por Mês e Tipo"
      />

      {/* Gráficos */}          
          {/* GRÁFICO DE PERCENTIL POR MÊS */}
          <div className="mb-8">
            {monthlyPercentileData.length > 0 ? (
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
                  showAreaFilter={true}
                  allAreas={uniqueAreas}
                  selectedAreas={percentileSelectedAreas}
                  onAreaChange={handlePercentileAreaChange}
                  allTypes={uniqueTypes}
                  selectedTypes={percentileSelectedTypes}
                  onTypeChange={handlePercentileTypeChange}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                Nenhum dado de lead time encontrado para os filtros selecionados.
              </div>
            )}
          </div>
          
          {/* GRÁFICO DE LEADTIME POR TIPO */}
          <div className="mb-8">
            {monthlyLeadTimeByType.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                <LeadTimeChart
                  title="Evolução do Leadtime por Tipo"
                  description="Visualize a evolução do lead time médio para cada tipo de item ao longo do tempo."
                  data={monthlyLeadTimeByType}
                  isMultiDataset={true}
                  xAxisKey="name"
                  datasets={uniqueTypes.map((type, index) => {
                    const colors = [
                      'rgba(59, 130, 246, 0.6)',   // Azul
                      'rgba(34, 197, 94, 0.6)',    // Verde
                      'rgba(251, 191, 36, 0.6)',   // Amarelo
                      'rgba(239, 68, 68, 0.6)',    // Vermelho
                      'rgba(168, 85, 247, 0.6)',   // Roxo
                      'rgba(236, 72, 153, 0.6)',   // Rosa
                      'rgba(14, 165, 233, 0.6)',   // Azul claro
                      'rgba(132, 204, 22, 0.6)',   // Verde lima
                      'rgba(249, 115, 22, 0.6)',   // Laranja
                      'rgba(156, 163, 175, 0.6)'   // Cinza
                    ]
                    const borderColors = [
                      'rgba(59, 130, 246, 1)',
                      'rgba(34, 197, 94, 1)',
                      'rgba(251, 191, 36, 1)',
                      'rgba(239, 68, 68, 1)',
                      'rgba(168, 85, 247, 1)',
                      'rgba(236, 72, 153, 1)',
                      'rgba(14, 165, 233, 1)',
                      'rgba(132, 204, 22, 1)',
                      'rgba(249, 115, 22, 1)',
                      'rgba(156, 163, 175, 1)'
                    ]
                    
                    return {
                      key: type,
                      name: type,
                      color: colors[index % colors.length],
                      borderColor: borderColors[index % borderColors.length]
                    }
                  })}
                  chartType="line"
                  columns={['Criado', 'Resolvido', 'Lead Time', 'Tipo']}
                  showAreaFilter={true}
                  allAreas={uniqueAreas}
                  selectedAreas={leadtimeSelectedAreas}
                  onAreaChange={handleLeadtimeAreaChange}
                  allTypes={uniqueTypes}
                  selectedTypes={leadtimeSelectedTypes}
                  onTypeChange={handleLeadtimeTypeChange}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                Nenhum dado de lead time por tipo encontrado para os filtros selecionados.
              </div>
            )}
          </div>
          
       

      {/* Lista de Itens com Filtros */}
      <FilteredItemsList
        title="Lista Detalhada de Itens com Lead Time"
        items={leadTimeData}
        type="leadtime"
      />

    </div>
  )
}

export default LeadTimeTab