// ReviewTab.jsx
import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Eye, Filter, X } from 'lucide-react'

// Função para normalizar strings (remover acentos e converter para minúsculas)
const normalizeString = (str) => {
  if (!str) return 'desconhecido'
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
}

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

const formatDateValue = (dateString) => {
  if (!dateString) return '-';

  try {
    let day = '';
    let month = '';   
    let year = '';   
    let dataFormated = '';

    const monthMap = {'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'};

    let match = dateString.match(/^(\d{1,2})\/([a-zA-Z]{3})\/(\d{2,4})/);
    if (match) {
      day = parseInt(match[1], 10);
      month = monthMap[match[2].toLowerCase()];
      year = match[3];
      return dataFormated.concat(day).concat('/').concat(month).concat('/').concat(year);        
    }

    console.log(dateString);
    return '-';

  } catch (e) {
    console.error("Erro ao formatar a data:", e);
    return '-';
  }
}

const getDaysInReview = (item) => {
  if (!item.deliveryEnd) return null

  const reviewDate = parseDate(item.deliveryEnd)
  if (!reviewDate || isNaN(reviewDate.getTime())) return null
  
  const today = new Date()
  const diffTime = Math.abs(today - reviewDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getReviewPeriod = (days) => {
  if (days <= 30) return 'até 30 dias'
  if (days <= 60) return '31-60 dias'
  if (days <= 90) return '61-90 dias'
  return 'acima de 91 dias'
}

const getReviewPeriodColor = (period) => {
  const colors = {
    'até 30 dias': 'bg-green-100 text-green-800 border-green-200',
    '31-60 dias': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '61-90 dias': 'bg-orange-100 text-orange-800 border-orange-200',
    'acima de 91 dias': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[period] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getTypeColor = (normalizedType) => {
  const colors = {
    'bug': 'bg-red-100 text-red-800',
    'feature': 'bg-blue-100 text-blue-800',
    'task': 'bg-green-100 text-green-800',
    'story': 'bg-purple-100 text-purple-800',
    'historias': 'bg-purple-100 text-purple-800',
    'historia': 'bg-purple-100 text-purple-800',
    'melhorias': 'bg-blue-100 text-blue-800',
    'melhoria': 'bg-blue-100 text-blue-800',
    'incidentes': 'bg-red-100 text-red-800',
    'incidente': 'bg-red-100 text-red-800',
    'desconhecido': 'bg-gray-100 text-gray-800'
  }
  return colors[normalizedType] || 'bg-gray-100 text-gray-800'
}

const ReviewTab = ({ processedData }) => {
  const [selectedAreas, setSelectedAreas] = useState([])
  const [selectedPeriods, setSelectedPeriods] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])

  // Filtrar apenas itens em review e normalizar dados
  const reviewItems = useMemo(() => {
    return processedData
      .filter(item => item.status && item.status.toLowerCase().includes('review'))
      .map(item => ({
        ...item,
        // Normalizar tipo removendo acentos e convertendo para minúsculas
        originalType: item.type, // Manter o tipo original para exibição
        normalizedType: normalizeString(item.type),
        // Calcular dias em review
        daysInReview: getDaysInReview(item),
        // Determinar período
        period: getReviewPeriod(getDaysInReview(item) || 0)
      }))
      .filter(item => item.daysInReview !== null) // Remover itens sem dias em review válido
  }, [processedData])

  // Obter áreas únicas para o filtro
  const uniqueAreas = useMemo(() => {
    const areas = [...new Set(reviewItems.map(item => item.area).filter(Boolean))]
    return areas.sort()
  }, [reviewItems])

  // Obter tipos únicos normalizados (para filtro) mas manter label original
  const uniqueTypes = useMemo(() => {
    const typeMap = new Map()
    
    reviewItems.forEach(item => {
      if (!typeMap.has(item.normalizedType)) {
        typeMap.set(item.normalizedType, {
          normalized: item.normalizedType,
          original: item.originalType || item.type || 'Desconhecido'
        })
      }
    })

    const types = Array.from(typeMap.values()).sort((a, b) => 
      a.original.localeCompare(b.original)
    )

    return types.map(type => ({ 
      value: type.normalized, 
      label: type.original
    }))
  }, [reviewItems])

  // Definir faixas de tempo em review
  const reviewPeriods = [
    { 
      value: 'até 30 dias', 
      label: 'Até 30 dias', 
      filter: (item) => item.daysInReview >= 0 && item.daysInReview <= 30 
    },
    { 
      value: '31-60 dias', 
      label: '31 a 60 dias', 
      filter: (item) => item.daysInReview >= 31 && item.daysInReview <= 60 
    },
    { 
      value: '61-90 dias', 
      label: '61 a 90 dias', 
      filter: (item) => item.daysInReview >= 61 && item.daysInReview <= 90 
    },
    { 
      value: 'acima de 91 dias', 
      label: 'Acima de 91 dias', 
      filter: (item) => item.daysInReview > 90 
    }
  ]

  // Lógica para alternar a seleção de áreas
  const handleAreaClick = (area) => {
    setSelectedAreas(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area)
      } else {
        return [...prev, area]
      }
    })
  }

  // Lógica para alternar a seleção de períodos
  const handlePeriodClick = (period) => {
    setSelectedPeriods(prev => {
      if (prev.includes(period)) {
        return prev.filter(p => p !== period)
      } else {
        return [...prev, period]
      }
    })
  }

  // Lógica para alternar a seleção de tipos
  const handleTypeClick = (type) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Aplicar filtros
  const filteredItems = useMemo(() => {
    let filtered = reviewItems

    // Aplicar filtro de área (se houver áreas selecionadas)
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(item => selectedAreas.includes(item.area))
    }

    // Aplicar filtro de período (se houver períodos selecionados)
    if (selectedPeriods.length > 0) {
      filtered = filtered.filter(item => {
        // Verifica se o item se encaixa em pelo menos um dos períodos selecionados
        return selectedPeriods.some(periodValue => {
          const periodFilter = reviewPeriods.find(period => period.value === periodValue)
          return periodFilter && periodFilter.filter(item)
        })
      })
    }

    // Aplicar filtro de tipo (se houver tipos selecionados)
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.normalizedType))
    }

    return filtered
  }, [reviewItems, selectedAreas, selectedPeriods, selectedTypes, reviewPeriods])

  // Estatísticas dos itens filtrados
  const stats = useMemo(() => {
    if (filteredItems.length === 0) return null

    const daysInReview = filteredItems.map(item => item.daysInReview)
    const total = filteredItems.length
    const average = Math.round(daysInReview.reduce((sum, val) => sum + val, 0) / total)
    const min = Math.min(...daysInReview)
    const max = Math.max(...daysInReview)

    return { total, average, min, max }
  }, [filteredItems])

  const clearFilters = () => {
    setSelectedAreas([])
    setSelectedPeriods([])
    setSelectedTypes([])
  }

  const hasActiveFilters = selectedAreas.length > 0 || selectedPeriods.length > 0 || selectedTypes.length > 0

  const columns = [
    { key: 'key', label: 'Chave', className: 'w-[100px] font-medium' },
    { key: 'originalType', label: 'Tipo', className: 'w-[120px]' },
    { key: 'area', label: 'Área', className: 'w-[120px]' },    
    { key: 'deliveryEnd', label: 'Em Review Desde', className: 'w-[150px]' },
    { key: 'daysInReview', label: 'Dias em Review', className: 'w-[140px] text-right' },
    { key: 'period', label: 'Período', className: 'w-[120px]' }
  ]

  return (
    <div className="space-y-6">
      {/* Card de Estatísticas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Itens em Review</CardTitle>
          <CardDescription>
            {reviewItems.length} itens encontrados com status de review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {reviewItems.filter(item => item.daysInReview <= 30).length}
              </div>
              <div className="text-sm text-green-600">Até 30 dias</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">
                {reviewItems.filter(item => item.daysInReview > 30 && item.daysInReview <= 60).length}
              </div>
              <div className="text-sm text-yellow-600">31-60 dias</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">
                {reviewItems.filter(item => item.daysInReview > 60 && item.daysInReview <= 90).length}
              </div>
              <div className="text-sm text-orange-600">61-90 dias</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {reviewItems.filter(item => item.daysInReview > 90).length}
              </div>
              <div className="text-sm text-red-600">Acima de 91 dias</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Itens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens em Review</CardTitle>
          <CardDescription>
            {filteredItems.length} itens encontrados com os filtros aplicados
          </CardDescription>

            <div className="flex flex-wrap gap-4 mt-4 p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200 mb-2">
            
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Tipo:</span>
                {uniqueTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTypeClick(type.value)}
                    className={`${selectedTypes.includes(type.value) ? getTypeColor(type.value) : ''} hover:bg-gray-800 hover:text-white`}
                  >
                    {type.label}
                  </Button>
                ))}

              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Área:</span>
                {uniqueAreas.map((area) => (
                    <Button
                      key={area}
                      variant={selectedAreas.includes(area) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAreaClick(area)}
                      className="hover:bg-gray-800 hover:text-white"
                    >
                      {area}
                    </Button>
                ))}

              </div>
    
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Período:</span>
                {reviewPeriods.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriods.includes(period.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePeriodClick(period.value)}
                    className={selectedPeriods.includes(period.value) ? getReviewPeriodColor(period.value) : 'hover:bg-gray-800 hover:text-white'}
                  >
                    {period.label}
                  </Button>
                ))}

              </div>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>



        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {columns.map((column) => (
                    <TableHead key={column.key} className={`${column.className} font-semibold text-gray-700`}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={`${item.key}-${index}`} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="w-[100px] font-medium">
                      {item.key || '-'}
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <Badge className={getTypeColor(item.normalizedType)}>
                        {item.originalType}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      {item.area || '-'}
                    </TableCell>                    
                    <TableCell className="w-[150px]">
                      {formatDateValue(item.deliveryEnd)}
                    </TableCell>
                    <TableCell className="w-[140px] text-right">
                      {item.daysInReview !== null ? `${item.daysInReview} dias` : '-'}
                    </TableCell>
                    <TableCell className="w-[120px]">
                      {item.period !== '-' ? (
                        <Badge variant="outline" className={getReviewPeriodColor(item.period)}>
                          {item.period}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item encontrado com os filtros aplicados</p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
            {filteredItems.length > 50 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Mostrando {filteredItems.length} itens. Use filtros para refinar a visualização.
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Estatísticas dos itens filtrados */}
      {stats && (
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            {stats.total} itens filtrados
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            Média: {stats.average} dias em review
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Mín: {stats.min} dias
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
            Máx: {stats.max} dias
          </Badge>
        </div>
      )}

    </div>
  )
}

export default ReviewTab