import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Expand, Minimize2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { Badge } from '@/components/ui/badge.jsx'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
)

const LeadTimeChart = ({ 
  data, 
  title = "Lead Time por Item",
  description,
  formula,
  columns,
  isMultiDataset = false,
  datasets = [],
  xAxisKey = 'name',
  colors = ['rgba(59, 130, 246, 0.6)'],
  chartType = 'bar',
  showAreaFilter = false,
  allAreas = [],
  selectedAreas = [],
  onAreaChange = () => {},
  allTypes = [],
  selectedTypes = [],
  onTypeChange = () => {}
}) => {
  const chartRef = useRef()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFormula, setShowFormula] = useState(false)

  // Cores padrão para múltiplos datasets
  const defaultColors = [
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

  // Preparar dados para o gráfico
  const chartData = () => {
    if (isMultiDataset && datasets.length > 0) {
      // Para gráficos com múltiplos datasets (ex: por mês e tipo)
      return {
        labels: data.map(item => item[xAxisKey] || item.name),
        datasets: datasets.map((dataset, index) => ({
          label: dataset.name || dataset.key,
          data: data.map(item => item[dataset.key] || 0),
          backgroundColor: dataset.color || defaultColors[index % defaultColors.length],
          borderColor: dataset.borderColor || borderColors[index % borderColors.length],
          borderWidth: chartType === 'line' ? 2 : 1,
          borderRadius: chartType === 'line' ? undefined : 4,
          borderSkipped: false,
          tension: chartType === 'line' ? 0.4 : undefined,
          fill: false,
          pointRadius: chartType === 'line' ? 4 : undefined,
          pointHoverRadius: chartType === 'line' ? 6 : undefined,
        }))
      }
    }

    // Para gráficos simples
    return {
      labels: data.map(item => item.key || item.name),
      datasets: [
        {
          label: 'Lead Time (dias)',
          data: data.map(item => item.leadTime || item.value || 0),
          backgroundColor: colors[0],
          borderColor: colors[0].replace('0.6', '1'),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false, // Título será exibido no Card
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (isMultiDataset) {
              return `${context.dataset.label}: ${context.parsed.y} dias`
            }
            
            const item = data[context.dataIndex]
            const tooltipLines = [
              `Lead Time: ${context.parsed.y} dias`
            ]
            
            if (item.created) tooltipLines.push(`Criado: ${item.created}`)
            if (item.resolved) tooltipLines.push(`Resolvido: ${item.resolved}`)
            if (item.type) tooltipLines.push(`Tipo: ${item.type}`)
            
            return tooltipLines
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Dias'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: isMultiDataset ? 'Período' : 'Chave do Item'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }

  return (
    <div className={`${isExpanded ? 'col-span-3' : 'col-span-1'} transition-all duration-300`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFormula(!showFormula)}
                className="h-8 w-8 p-0"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Filtro de Tipo (novo, acima do filtro de Área) */}
          <div className="text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tipo:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onTypeChange([])}
                  className={`text-xs px-3 py-1 rounded-full border ${selectedTypes.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  Todos
                </button>
                {allTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      if (selectedTypes.includes(type)) {
                        onTypeChange(selectedTypes.filter(t => t !== type));
                      } else {
                        onTypeChange([...selectedTypes, type]);
                      }
                    }}
                    className={`text-xs px-3 py-1 rounded-full border ${selectedTypes.includes(type) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showAreaFilter && (
            <div className="text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Área:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onAreaChange([])}
                    className={`text-xs px-3 py-1 rounded-full border ${selectedAreas.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >
                    Todas
                  </button>
                  {allAreas.map(area => (
                    <button
                      key={area}
                      onClick={() => {
                        if (selectedAreas.includes(area)) {
                          onAreaChange(selectedAreas.filter(a => a !== area));
                        } else {
                          onAreaChange([...selectedAreas, area]);
                        }
                      }}
                      className={`text-xs px-3 py-1 rounded-full border ${selectedAreas.includes(area) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fórmula e colunas utilizadas */}
          <Collapsible open={showFormula} onOpenChange={setShowFormula}>
            <CollapsibleContent className="space-y-2">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                {formula && (
                  <div className="mb-2">
                    <span className="font-medium">Fórmula:</span> {formula}
                  </div>
                )}
                {columns && columns.length > 0 && (
                  <div>
                    <span className="font-medium">Colunas utilizadas:</span> {columns.join(', ')}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <div className="w-full" style={{ height: '400px' }}>
              {chartType === 'line' ? (
                <Line ref={chartRef} data={chartData()} options={options} />
              ) : (
                <Bar ref={chartRef} data={chartData()} options={options} />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum dado disponível para este gráfico
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LeadTimeChart