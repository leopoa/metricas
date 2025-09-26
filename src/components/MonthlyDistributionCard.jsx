import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'

const MonthlyDistributionCard = ({ data, parseDate, title = "Distribuição em Faixas por Mês e Tipo" }) => {
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});

  if (!data || data.length === 0) {
    return null
  }

  // Áreas e Tipos únicos
  const allAreas = [...new Set(data.map(item => item.area).filter(Boolean))];
  const allTypes = [...new Set(data.map(item => item.type).filter(Boolean))].sort();

  // Agrupar por mês
  const groupByMonth = (items) => {
    const grouped = {}
    items.forEach(item => {
      const resolvedDate = parseDate(item.resolved)
      if (!resolvedDate) return
      const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = resolvedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      if (!grouped[monthKey]) {
        grouped[monthKey] = { key: monthKey, name: monthName, items: [] }
      }
      grouped[monthKey].items.push(item)
    })
    return Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key))
  }

  const monthlyData = groupByMonth(data)
  const allMonths = monthlyData.map(m => m.name)

  // 🔹 Filtrar por Área e Mês
  const filteredData = data.filter(item => {
    const inArea = selectedAreas.length > 0 ? selectedAreas.includes(item.area) : true
    const resolvedDate = parseDate(item.resolved)
    const monthName = resolvedDate?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const inMonth = selectedMonth ? monthName === selectedMonth : true
    return inArea && inMonth
  })

  const filteredMonthlyData = groupByMonth(filteredData)

  // Faixas
  const timeRanges = [
    { label: 'Até 30 dias', max: 30, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', icon: '🚀' },
    { label: 'Até 60 dias', max: 60, color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', icon: '⚡' },
    { label: 'Até 90 dias', max: 90, color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', icon: '⚠️' },
    { label: 'Até 180 dias', max: 180, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', icon: '🔥' },
    { label: 'Acima de 180 dias', max: Infinity, color: 'bg-red-800', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '🚨' }
  ]

  // Calcular distribuições mensais
  const monthlyDistributionData = filteredMonthlyData.map(month => {
    const groupedByType = month.items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item.leadTime)
      return acc
    }, {})

    const distributionData = allTypes.map(type => {
      const values = groupedByType[type] || []
      const totalItems = values.length
      const distribution = timeRanges.map((range, index) => {
        let count
        if (index === 0) count = values.filter(v => v <= range.max).length
        else if (range.max === Infinity) count = values.filter(v => v > timeRanges[index - 1].max).length
        else count = values.filter(v => v > timeRanges[index - 1].max && v <= range.max).length
        return { ...range, count, percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0 }
      })
      return { type, totalItems, distribution }
    })

    return { ...month, distributionData }
  })

  // 🔹 Calcular MÉDIA dos dados filtrados
  const averageDistributionData = useMemo(() => {
    const groupedByType = filteredData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item.leadTime)
      return acc
    }, {})

    const distributionData = allTypes.map(type => {
      const values = groupedByType[type] || []
      const totalItems = values.length
      const distribution = timeRanges.map((range, index) => {
        let count
        if (index === 0) count = values.filter(v => v <= range.max).length
        else if (range.max === Infinity) count = values.filter(v => v > timeRanges[index - 1].max).length
        else count = values.filter(v => v > timeRanges[index - 1].max && v <= range.max).length
        return { ...range, count, percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0 }
      })
      return { type, totalItems, distribution }
    })

    return {
      name: "Média Geral",
      key: "average",
      distributionData: distributionData.filter(item => item.totalItems > 0)
    }
  }, [filteredData, allTypes])

  // Handlers
  const handleAreaClick = (area) => setSelectedAreas(
    selectedAreas.includes(area) ? selectedAreas.filter(a => a !== area) : [...selectedAreas, area]
  )
  const handleMonthClick = (month) => setSelectedMonth(month === selectedMonth ? null : month)
  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }))
  }

  // Cores
  const getTypeColor = (type) => {
    const colors = {
      'Bug': 'border-red-200 bg-red-50',
      'Feature': 'border-blue-200 bg-blue-50',
      'Task': 'border-green-200 bg-green-50',
      'Story': 'border-purple-200 bg-purple-50',
      'historias': 'border-purple-200 bg-purple-50',
      'melhorias': 'border-blue-200 bg-blue-50',
      'incidentes': 'border-red-200 bg-red-50'
    }
    return colors[type] || 'border-gray-200 bg-gray-50'
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="to-teal-50 pb-6">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Calendar className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          Distribuição dos tempos de entrega em faixas por mês e tipo de item
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* 🔹 Filtros */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Filtros
          </h3>
          
          {/* Área */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <span className="font-medium min-w-[50px]">Área:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedAreas([])} 
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  selectedAreas.length === 0 
                    ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todas
              </button>
              {allAreas.map(area => (
                <button 
                  key={area} 
                  onClick={() => handleAreaClick(area)} 
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedAreas.includes(area) 
                      ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Mês */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium min-w-[50px]">Mês:</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedMonth(null)} 
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  !selectedMonth 
                    ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todos
              </button>
              {allMonths.map(month => (
                <button 
                  key={month} 
                  onClick={() => handleMonthClick(month)} 
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedMonth === month 
                      ? 'bg-green-600 text-white border-green-600 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🔹 MÉDIA dos dados filtrados - SEMPRE VISÍVEL */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">{averageDistributionData.name}</h3>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              {filteredData.length} itens totais
            </Badge>
          </div>
          
          {averageDistributionData.distributionData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {averageDistributionData.distributionData.map(typeData => (
                <div key={typeData.type} className={`p-5 rounded-xl border-2 ${getTypeColor(typeData.type)} transition-all duration-200 hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-800">{typeData.type}</h4>
                    <Badge variant="outline" className="text-xs bg-white/80">
                      {typeData.totalItems} itens
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {typeData.distribution.map((range, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{range.icon}</span>
                            <span className="text-xs font-medium text-gray-700">{range.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${range.bgColor} ${range.textColor} border-0 text-xs`}>
                              {range.count}
                            </Badge>
                            <Badge variant="outline" className={`${range.bgColor} ${range.textColor} border-0 font-bold text-xs`}>
                              {range.percentage}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <Progress value={range.percentage} className="h-2 bg-gray-200" />
                          <div 
                            className={`absolute top-0 left-0 h-2 rounded-full ${range.color} transition-all duration-500`}
                            style={{ width: `${range.percentage}%` }}
                          />
                        </div>
                        
                        {range.percentage > 0 && (
                          <p className="text-xs text-gray-500">
                            {range.percentage}% dos itens ({range.count}/{typeData.totalItems}) 
                            {range.max === Infinity ? ' levaram mais de 180 dias' : ` foram entregues em até ${range.max} dias`}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              Nenhum dado disponível para os filtros selecionados.
            </div>
          )}
        </div>

        {/* 🔹 Dados Mensais - MINIMIZÁVEIS */}
        {monthlyDistributionData.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Dados Mensais
            </h3>
            
            <div className="space-y-3">
              {monthlyDistributionData.map(month => {
                const isExpanded = expandedMonths[month.key];
                const totalItems = month.items.length;
                
                return (
                  <div key={month.key} className="border rounded-lg overflow-hidden transition-all duration-200">
                    {/* Header do mês - clicável para expandir/recolher */}
                    <button
                      onClick={() => toggleMonth(month.key)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-base font-semibold text-gray-800">{month.name}</span>
                        <Badge variant="outline" className="bg-white text-gray-600">
                          {totalItems} itens
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {isExpanded ? 'Recolher' : 'Expandir'}
                      </div>
                    </button>

                    {/* Conteúdo do mês - aparece apenas quando expandido */}
                    {isExpanded && (
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {month.distributionData.filter(typeData => typeData.totalItems > 0).map(typeData => (
                            <div key={typeData.type} className={`p-4 rounded-lg border ${getTypeColor(typeData.type)}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">{typeData.type}</h4>
                                <Badge variant="outline" className="text-xs bg-white/80">
                                  {typeData.totalItems} itens
                                </Badge>
                              </div>
                              
                              <div className="space-y-3">
                                {typeData.distribution.map((range, i) => (
                                  <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{range.icon}</span>
                                        <span className="text-xs font-medium">{range.label}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Badge variant="outline" className={`${range.bgColor} ${range.textColor} border-0 text-xs`}>
                                          {range.count}
                                        </Badge>
                                        <Badge variant="outline" className={`${range.bgColor} ${range.textColor} border-0 font-bold text-xs`}>
                                          {range.percentage}%
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="relative">
                                      <Progress value={range.percentage} className="h-2" />
                                      <div 
                                        className={`absolute top-0 left-0 h-2 rounded-full ${range.color}`}
                                        style={{ width: `${range.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MonthlyDistributionCard