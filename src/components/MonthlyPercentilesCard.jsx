import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, Target, Award, Calendar, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'

const MonthlyPercentilesCard = ({ data, calculatePercentile, parseDate, title = "Percentis por Mês e Tipo" }) => {
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});

  if (!data || data.length === 0) {
    return null
  }
  
  // Áreas e Tipos únicos
  const allAreas = [...new Set(data.map(item => item.area).filter(Boolean))];
  const allTypes = [...new Set(data.map(item => item.type).filter(Boolean))].sort();

  // Agrupar dados por mês
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

  // Calcular percentis para cada mês e tipo
  const monthlyPercentilesData = filteredMonthlyData.map(month => {
    const groupedByType = month.items.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item.leadTime)
      return acc
    }, {})

    const percentilesData = allTypes.map(type => {
      const values = groupedByType[type] || []
      const totalItems = values.length
      
      if (totalItems === 0) {
        return {
          type,
          count: 0,
          percentile95: 0,
          percentile85: 0,
          percentile70: 0,
          max: 0,
          min: 0
        }
      }
      
      const sortedValues = values.sort((a, b) => a - b)
      
      return {
        type,
        count: totalItems,
        percentile95: Math.round(calculatePercentile(sortedValues, 0.95)),
        percentile85: Math.round(calculatePercentile(sortedValues, 0.85)),
        percentile70: Math.round(calculatePercentile(sortedValues, 0.70)),
        max: Math.max(...values),
        min: Math.min(...values)
      }
    })

    return { ...month, percentilesData }
  })

  // 🔹 Calcular MÉDIA dos dados filtrados
  const averagePercentilesData = useMemo(() => {
    const groupedByType = filteredData.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item.leadTime)
      return acc
    }, {})

    const percentilesData = allTypes.map(type => {
      const values = groupedByType[type] || []
      const totalItems = values.length
      
      if (totalItems === 0) {
        return {
          type,
          count: 0,
          percentile95: 0,
          percentile85: 0,
          percentile70: 0,
          max: 0,
          min: 0
        }
      }
      
      const sortedValues = values.sort((a, b) => a - b)
      
      return {
        type,
        count: totalItems,
        percentile95: Math.round(calculatePercentile(sortedValues, 0.95)),
        percentile85: Math.round(calculatePercentile(sortedValues, 0.85)),
        percentile70: Math.round(calculatePercentile(sortedValues, 0.70)),
        max: Math.max(...values),
        min: Math.min(...values)
      }
    })

    return {
      name: "Média Geral",
      key: "average",
      percentilesData: percentilesData.filter(item => item.count > 0)
    }
  }, [filteredData, allTypes, calculatePercentile])

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

  const getPercentileColor = (percentile) => {
    if (percentile === 95) return 'text-red-600 bg-red-100'
    if (percentile === 85) return 'text-orange-600 bg-orange-100'
    if (percentile === 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getPercentileIcon = (percentile) => {
    if (percentile === 95) return <Award className="h-4 w-4" />
    if (percentile === 85) return <Target className="h-4 w-4" />
    if (percentile === 70) return <TrendingUp className="h-4 w-4" />
    return null
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="to-indigo-50 pb-6">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Calendar className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600">
          Percentis de lead time organizados por mês e tipo de item (95%, 85% e 70%)
        </CardDescription>
        <div className="text-sm text-muted-foreground mt-2 p-3 bg-white/80 rounded-lg border border-gray-200">
          <span className="font-medium text-blue-700">Análise:</span> O percentil indica que uma determinada porcentagem dos itens foi entregue dentro do tempo mostrado. 
          Ex: se o percentil 85% é de 10 dias, significa que 85% de todos os itens foram entregues em 10 dias ou menos.
        </div>
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
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
            <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">{averagePercentilesData.name}</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
              {filteredData.length} itens totais
            </Badge>
          </div>
          
          {averagePercentilesData.percentilesData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {averagePercentilesData.percentilesData.map(typeData => (
                <div key={typeData.type} className={`p-5 rounded-xl border-2 ${getTypeColor(typeData.type)} transition-all duration-200 hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold text-gray-800">{typeData.type}</h4>
                    <Badge variant="outline" className="text-xs bg-white/80">
                      {typeData.count} itens
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* Percentil 95% */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPercentileIcon(95)}
                          <span className="text-sm font-medium text-gray-700">95%</span>
                        </div>
                        <Badge className={`${getPercentileColor(95)} text-xs px-2 py-1`}>
                          {typeData.percentile95}d
                        </Badge>
                      </div>
                      <Progress 
                        value={typeData.max > 0 ? (typeData.percentile95 / typeData.max) * 100 : 0} 
                        className="h-2 bg-gray-200"
                      />
                    </div>

                    {/* Percentil 85% */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPercentileIcon(85)}
                          <span className="text-sm font-medium text-gray-700">85%</span>
                        </div>
                        <Badge className={`${getPercentileColor(85)} text-xs px-2 py-1`}>
                          {typeData.percentile85}d
                        </Badge>
                      </div>
                      <Progress 
                        value={typeData.max > 0 ? (typeData.percentile85 / typeData.max) * 100 : 0} 
                        className="h-2 bg-gray-200"
                      />
                    </div>

                    {/* Percentil 70% */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPercentileIcon(70)}
                          <span className="text-sm font-medium text-gray-700">70%</span>
                        </div>
                        <Badge className={`${getPercentileColor(70)} text-xs px-2 py-1`}>
                          {typeData.percentile70}d
                        </Badge>
                      </div>
                      <Progress 
                        value={typeData.max > 0 ? (typeData.percentile70 / typeData.max) * 100 : 0} 
                        className="h-2 bg-gray-200"
                      />
                    </div>

                    {/* Infos adicionais */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Mín: {typeData.min}d</span>
                        <span>Máx: {typeData.max}d</span>
                      </div>
                    </div>
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
        {monthlyPercentilesData.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Dados Mensais
            </h3>
            
            <div className="space-y-3">
              {monthlyPercentilesData.map(month => {
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
                          {month.percentilesData.filter(typeData => typeData.count > 0).map(typeData => (
                            <div key={typeData.type} className={`p-4 rounded-lg border ${getTypeColor(typeData.type)}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">{typeData.type}</h4>
                                <Badge variant="outline" className="text-xs bg-white/80">
                                  {typeData.count} itens
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                {/* Percentil 95% */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {getPercentileIcon(95)}
                                      <span className="text-xs font-medium">95%</span>
                                    </div>
                                    <Badge className={`${getPercentileColor(95)} text-xs`}>
                                      {typeData.percentile95}d
                                    </Badge>
                                  </div>
                                  <Progress value={typeData.max > 0 ? (typeData.percentile95 / typeData.max) * 100 : 0} className="h-1.5" />
                                </div>

                                {/* Percentil 85% */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {getPercentileIcon(85)}
                                      <span className="text-xs font-medium">85%</span>
                                    </div>
                                    <Badge className={`${getPercentileColor(85)} text-xs`}>
                                      {typeData.percentile85}d
                                    </Badge>
                                  </div>
                                  <Progress value={typeData.max > 0 ? (typeData.percentile85 / typeData.max) * 100 : 0} className="h-1.5" />
                                </div>

                                {/* Percentil 70% */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      {getPercentileIcon(70)}
                                      <span className="text-xs font-medium">70%</span>
                                    </div>
                                    <Badge className={`${getPercentileColor(70)} text-xs`}>
                                      {typeData.percentile70}d
                                    </Badge>
                                  </div>
                                  <Progress value={typeData.max > 0 ? (typeData.percentile70 / typeData.max) * 100 : 0} className="h-1.5" />
                                </div>

                                {/* Infos adicionais */}
                                <div className="pt-2 border-t border-gray-200">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Mín: {typeData.min}d</span>
                                    <span>Máx: {typeData.max}d</span>
                                  </div>
                                </div>
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

export default MonthlyPercentilesCard