import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, Target, Award } from 'lucide-react'

const PercentilesCard = ({ data, calculatePercentile, title = "Percentis por Tipo de Item" }) => {
  if (!data || data.length === 0) {
    return null
  }

  // Agrupar dados por tipo
  const groupedByType = data.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item.leadTime)
    return acc
  }, {})

  // Calcular percentis para cada tipo
  const percentilesData = Object.entries(groupedByType).map(([type, values]) => {
    const sortedValues = values.sort((a, b) => a - b)
    
    return {
      type,
      count: values.length,
      percentile95: Math.round(calculatePercentile(sortedValues, 0.95)),
      percentile85: Math.round(calculatePercentile(sortedValues, 0.85)),
      percentile70: Math.round(calculatePercentile(sortedValues, 0.70)),
      max: Math.max(...values),
      min: Math.min(...values)
    }
  })

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Percentis de lead time por tipo de item (95%, 85% e 70%)
        </CardDescription>
        <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
          <span className="font-medium">Fórmula:</span> PERCENTIL.INC(LeadTime; percentil) - 
          Indica que X% dos itens foram entregues dentro do tempo mostrado
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {percentilesData.map((typeData) => (
            <div 
              key={typeData.type} 
              className={`p-6 rounded-lg border-2 ${getTypeColor(typeData.type)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{typeData.type}</h3>
                <Badge variant="outline" className="text-xs">
                  {typeData.count} itens
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Percentil 95% */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPercentileIcon(95)}
                      <span className="text-sm font-medium">95%</span>
                    </div>
                    <Badge className={getPercentileColor(95)}>
                      {typeData.percentile95} dias
                    </Badge>
                  </div>
                  <Progress 
                    value={(typeData.percentile95 / typeData.max) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    95% dos itens entregues em até {typeData.percentile95} dias
                  </p>
                </div>

                {/* Percentil 85% */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPercentileIcon(85)}
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Badge className={getPercentileColor(85)}>
                      {typeData.percentile85} dias
                    </Badge>
                  </div>
                  <Progress 
                    value={(typeData.percentile85 / typeData.max) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    85% dos itens entregues em até {typeData.percentile85} dias
                  </p>
                </div>

                {/* Percentil 70% */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPercentileIcon(70)}
                      <span className="text-sm font-medium">70%</span>
                    </div>
                    <Badge className={getPercentileColor(70)}>
                      {typeData.percentile70} dias
                    </Badge>
                  </div>
                  <Progress 
                    value={(typeData.percentile70 / typeData.max) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    70% dos itens entregues em até {typeData.percentile70} dias
                  </p>
                </div>

                {/* Informações adicionais */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mín: {typeData.min} dias</span>
                    <span>Máx: {typeData.max} dias</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PercentilesCard

