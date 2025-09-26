import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { TrendingUp, Calendar, Target, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'

const MonthlySummary = ({ data, parseDate, calculatePercentile }) => {
  if (!data || data.length === 0) {
    return null
  }

  // Agrupar dados por mês
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

  const monthlyData = groupByMonth(data)

  // Calcular estatísticas para cada mês
  const monthlyStats = monthlyData.map(month => {
    const leadTimes = month.items.map(item => item.leadTime)
    const sortedLeadTimes = [...leadTimes].sort((a, b) => a - b)
    
    return {
      ...month,
      totalItems: leadTimes.length,
      average: Math.round(leadTimes.reduce((sum, val) => sum + val, 0) / leadTimes.length),
      median: Math.round(calculateMedian(sortedLeadTimes)),
      percentile95: Math.round(calculatePercentile(sortedLeadTimes, 0.95)),
      percentile85: Math.round(calculatePercentile(sortedLeadTimes, 0.85)),
      percentile70: Math.round(calculatePercentile(sortedLeadTimes, 0.70)),
      max: Math.max(...leadTimes),
      min: Math.min(...leadTimes)
    }
  })

  const calculateMedian = (values) => {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const getTrendColor = (current, previous) => {
    if (!previous) return 'text-gray-500'
    if (current < previous) return 'text-green-500'
    if (current > previous) return 'text-red-500'
    return 'text-gray-500'
  }

  const getTrendIcon = (current, previous) => {
    if (!previous) return null
    if (current < previous) return '↘️'
    if (current > previous) return '↗️'
    return '➡️'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Resumo Mensal de Lead Time
        </CardTitle>
        <CardDescription>
          Estatísticas mensais de lead time com comparação de tendências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {monthlyStats.map((month, index) => {
          const previousMonth = index > 0 ? monthlyStats[index - 1] : null
          
          return (
            <div key={month.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{month.name}</h3>
                <Badge variant="outline">{month.totalItems} itens</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Média */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Média</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{month.average}d</span>
                      {previousMonth && (
                        <span className={`text-xs ${getTrendColor(month.average, previousMonth.average)}`}>
                          {getTrendIcon(month.average, previousMonth.average)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(month.average / month.max) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Mediana */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mediana</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{month.median}d</span>
                      {previousMonth && (
                        <span className={`text-xs ${getTrendColor(month.median, previousMonth.median)}`}>
                          {getTrendIcon(month.median, previousMonth.median)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(month.median / month.max) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Percentil 85% */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P85%</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{month.percentile85}d</span>
                      {previousMonth && (
                        <span className={`text-xs ${getTrendColor(month.percentile85, previousMonth.percentile85)}`}>
                          {getTrendIcon(month.percentile85, previousMonth.percentile85)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(month.percentile85 / month.max) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Percentil 95% */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P95%</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{month.percentile95}d</span>
                      {previousMonth && (
                        <span className={`text-xs ${getTrendColor(month.percentile95, previousMonth.percentile95)}`}>
                          {getTrendIcon(month.percentile95, previousMonth.percentile95)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(month.percentile95 / month.max) * 100} 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Faixa de valores */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mín: {month.min}d</span>
                <span>Máx: {month.max}d</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default MonthlySummary