import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { BarChart3, Clock, AlertTriangle } from 'lucide-react'

const DistributionCard = ({ data, title = "Distribuição em Faixas por Tipo de Item" }) => {
  if (!data || data.length === 0) {
    return null
  }

  // Definir faixas de tempo
  const timeRanges = [
    { label: 'Até 30 dias', max: 30, color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', icon: '🚀' },
    { label: 'Até 60 dias', max: 60, color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', icon: '⚡' },
    { label: 'Até 90 dias', max: 90, color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700', icon: '⚠️' },
    { label: 'Até 180 dias', max: 180, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700', icon: '🔥' },
    { label: 'Acima de 180 dias', max: Infinity, color: 'bg-red-800', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '🚨' }
  ]

  // Agrupar dados por tipo
  const groupedByType = data.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item.leadTime)
    return acc
  }, {})

  // Calcular distribuição para cada tipo
  const distributionData = Object.entries(groupedByType).map(([type, values]) => {
    const totalItems = values.length
    
    const distribution = timeRanges.map((range, index) => {
      let count
      if (index === 0) {
        // Até 30 dias
        count = values.filter(v => v <= range.max).length
      } else if (range.max === Infinity) {
        // Acima de 180 dias
        count = values.filter(v => v > timeRanges[index - 1].max).length
      } else {
        // Outras faixas
        count = values.filter(v => v > timeRanges[index - 1].max && v <= range.max).length
      }
      
      return {
        ...range,
        count,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0
      }
    })

    return {
      type,
      totalItems,
      distribution
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Distribuição dos tempos de entrega em faixas por tipo de item
        </CardDescription>
        <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
          <span className="font-medium">Análise:</span> Mostra como os itens se distribuem em diferentes faixas de tempo de entrega, 
          permitindo identificar padrões de previsibilidade por tipo
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {distributionData.map((typeData) => (
            <div 
              key={typeData.type} 
              className={`p-6 rounded-lg border-2 ${getTypeColor(typeData.type)}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{typeData.type}</h3>
                <Badge variant="outline" className="text-xs">
                  {typeData.totalItems} itens
                </Badge>
              </div>

              <div className="space-y-4">
                {typeData.distribution.map((range, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{range.icon}</span>
                        <span className="text-sm font-medium">{range.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${range.bgColor} ${range.textColor} border-0`}
                        >
                          {range.count} itens
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`${range.bgColor} ${range.textColor} border-0 font-bold`}
                        >
                          {range.percentage}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={range.percentage} 
                        className="h-3"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-3 rounded-full ${range.color}`}
                        style={{ width: `${range.percentage}%` }}
                      />
                    </div>
                    
                    {range.percentage > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {range.percentage}% dos itens ({range.count}/{typeData.totalItems}) 
                        {range.max === Infinity ? ' levaram mais de 180 dias' : ` foram entregues em até ${range.max} dias`}
                      </p>
                    )}
                  </div>
                ))}

                {/* Resumo visual */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="text-center p-2 bg-green-100 rounded">
                      <div className="font-bold text-green-700">
                        {typeData.distribution[0].percentage + typeData.distribution[1].percentage}%
                      </div>
                      <div className="text-green-600">≤ 60 dias</div>
                    </div>
                    <div className="text-center p-2 bg-red-100 rounded">
                      <div className="font-bold text-red-700">
                        {typeData.distribution[3].percentage + typeData.distribution[4].percentage}%
                      </div>
                      <div className="text-red-600">≥ 180 dias</div>
                    </div>
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

export default DistributionCard

