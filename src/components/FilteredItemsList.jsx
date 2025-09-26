import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Filter, X, FileText, Clock, BarChart3, Download, ChevronDown, ChevronRight } from 'lucide-react'

const FilteredItemsList = ({ title, items, type = "leadtime" }) => {
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedRanges, setSelectedRanges] = useState([])
  const [selectedStatus, setSelectedStatus] = useState([])
  const [selectedAreas, setSelectedAreas] = useState([])
  const [expandedStats, setExpandedStats] = useState(true)

  if (!items || items.length === 0) {
    return null
  }

  // Função para converter string para Title Case
  const toTitleCase = (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Função para normalizar strings
  const normalizeString = (str) => {
    if (!str) return 'desconhecido'
    return String(str)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  // Normalizar e validar os dados
  const normalizedItems = useMemo(() => {
    return items
      .map(item => ({
        ...item,
        originalType: item.type, 
        normalizedType: normalizeString(item.type),
        originalStatus: item.status, 
        normalizedStatus: normalizeString(item.status),
        originalArea: item.area,
        normalizedArea: normalizeString(item.area),
        leadTime: item.leadTime != null && !isNaN(Number(item.leadTime)) 
          ? Math.max(0, Math.floor(Number(item.leadTime))) 
          : null
      }))
      .filter(item => item.leadTime !== null)
  }, [items])

  // Definir faixas de lead time
  const leadTimeRanges = [
    { 
      value: '0-30', 
      label: 'Até 30 Dias', 
      color: 'bg-green-100 text-green-800 border-green-200',
      filter: (item) => item.leadTime >= 0 && item.leadTime <= 30 
    },
    { 
      value: '31-60', 
      label: '31 A 60 Dias', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      filter: (item) => item.leadTime >= 31 && item.leadTime <= 60 
    },
    { 
      value: '61-90', 
      label: '61 A 90 Dias', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      filter: (item) => item.leadTime >= 61 && item.leadTime <= 90 
    },
    { 
      value: '90+', 
      label: 'Acima De 90 Dias', 
      color: 'bg-red-100 text-red-800 border-red-200',
      filter: (item) => item.leadTime > 90 
    }
  ]

  // Obter tipos únicos
  const uniqueTypes = useMemo(() => {
    const typeMap = new Map()
    normalizedItems.forEach(item => {
      if (!typeMap.has(item.normalizedType)) {
        typeMap.set(item.normalizedType, {
          normalized: item.normalizedType,
          original: toTitleCase(item.originalType || item.type || 'Desconhecido')
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
  }, [normalizedItems])

  // Obter status únicos
  const uniqueStatus = useMemo(() => {
    const statusMap = new Map();
    normalizedItems.forEach(item => {
      if (!statusMap.has(item.normalizedStatus)) {
        statusMap.set(item.normalizedStatus, {
          normalized: item.normalizedStatus,
          original: toTitleCase(item.originalStatus || 'Desconhecido')
        });
      }
    });

    const status = Array.from(statusMap.values()).sort((a, b) => a.original.localeCompare(b.original));

    return status.map(s => ({
      value: s.normalized,
      label: s.original
    }));
  }, [normalizedItems]);

  // Obter áreas únicas
  const uniqueAreas = useMemo(() => {
    const areaMap = new Map();
    normalizedItems.forEach(item => {
      if (!areaMap.has(item.normalizedArea)) {
        areaMap.set(item.normalizedArea, {
          normalized: item.normalizedArea,
          original: toTitleCase(item.originalArea || 'Desconhecido')
        });
      }
    });

    const areas = Array.from(areaMap.values()).sort((a, b) => a.original.localeCompare(b.original));

    return areas.map(a => ({
      value: a.normalized,
      label: a.original
    }));
  }, [normalizedItems]);
  
  // Handlers para filtros
  const handleTypeClick = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const handleRangeClick = (range) => {
    setSelectedRanges(prev => prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range])
  }

  const handleStatusClick = (status) => {
    setSelectedStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
  }
  
  const handleAreaClick = (area) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  // Filtrar itens
  const filteredItems = useMemo(() => {
    let filtered = normalizedItems

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.normalizedType))
    }

    if (selectedRanges.length > 0) {
      filtered = filtered.filter(item => {
        return selectedRanges.some(rangeValue => {
          const rangeFilter = leadTimeRanges.find(range => range.value === rangeValue)
          return rangeFilter && rangeFilter.filter(item)
        })
      })
    }

    if (selectedStatus.length > 0) {
      filtered = filtered.filter(item => selectedStatus.includes(item.normalizedStatus));
    }

    if (selectedAreas.length > 0) {
      filtered = filtered.filter(item => selectedAreas.includes(item.normalizedArea));
    }

    return filtered
  }, [normalizedItems, selectedTypes, selectedRanges, selectedStatus, selectedAreas, leadTimeRanges])

  // Estatísticas dos itens filtrados
  const stats = useMemo(() => {
    if (filteredItems.length === 0) return null

    const leadTimes = filteredItems.map(item => item.leadTime)
    const total = filteredItems.length
    const average = Math.round(leadTimes.reduce((sum, val) => sum + val, 0) / total)
    const min = Math.min(...leadTimes)
    const max = Math.max(...leadTimes)

    // Calcular percentis
    const calculatePercentile = (values, percentile) => {
      const sorted = [...values].sort((a, b) => a - b)
      const index = percentile * (sorted.length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index % 1
      
      if (upper >= sorted.length) return sorted[sorted.length - 1]
      return sorted[lower] * (1 - weight) + sorted[upper] * weight
    }

    return { 
      total, 
      average, 
      min, 
      max,
      percentile70: Math.round(calculatePercentile(leadTimes, 0.70)),
      percentile85: Math.round(calculatePercentile(leadTimes, 0.85)),
      percentile95: Math.round(calculatePercentile(leadTimes, 0.95))
    }
  }, [filteredItems])

  // Funções de estilo
  const getTypeColor = (normalizedType) => {
    const colors = {
      'bug': 'bg-red-100 text-red-800 border-red-200',
      'feature': 'bg-blue-100 text-blue-800 border-blue-200',
      'task': 'bg-green-100 text-green-800 border-green-200',
      'story': 'bg-purple-100 text-purple-800 border-purple-200',
      'historias': 'bg-purple-100 text-purple-800 border-purple-200',
      'historia': 'bg-purple-100 text-purple-800 border-purple-200',
      'melhorias': 'bg-blue-100 text-blue-800 border-blue-200',
      'melhoria': 'bg-blue-100 text-blue-800 border-blue-200',
      'incidentes': 'bg-red-100 text-red-800 border-red-200',
      'incidente': 'bg-red-100 text-red-800 border-red-200',
      'desconhecido': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[normalizedType] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getLeadTimeColor = (leadTime) => {
    if (leadTime <= 30) return 'bg-green-100 text-green-800 border-green-200'
    if (leadTime <= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (leadTime <= 90) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusColor = (status) => {
    const colors = {
      'concluido': 'bg-green-100 text-green-800 border-green-200',
      'em andamento': 'bg-blue-100 text-blue-800 border-blue-200',
      'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'em review': 'bg-purple-100 text-purple-800 border-purple-200',
      'pronto para teste': 'bg-gray-100 text-gray-800 border-gray-200',
      'desconhecido': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[normalizeString(status)] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedRanges([])
    setSelectedStatus([])
    setSelectedAreas([])
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedRanges.length > 0 || selectedStatus.length > 0 || selectedAreas.length > 0

  const columns = [
    { key: 'key', label: 'Chave', className: 'font-mono text-sm' },
    { key: 'originalType', label: 'Tipo', className: '' },
    { key: 'originalStatus', label: 'Status', className: '' },
    { key: 'originalArea', label: 'Área', className: '' },
    { key: 'created', label: 'Criado', type: 'date', className: 'text-sm' },
    { key: 'resolved', label: 'Resolvido', type: 'date', className: 'text-sm' },
    { key: 'leadTime', label: 'Lead Time', type: 'days', className: 'font-semibold' }
  ]

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="from-indigo-50 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5 text-indigo-600" />
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Lista detalhada de itens com filtros por tipo, status, área e faixas de lead time
            </CardDescription>
          </div>          
        </div>

        {/* Filtros */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 ml-auto text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
                Limpar Tudo
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Tipo */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeClick(type.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      selectedTypes.includes(type.value) 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Lead Time */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Lead Time</label>
              <div className="flex flex-wrap gap-2">
                {leadTimeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handleRangeClick(range.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      selectedRanges.includes(range.value)
                        ? `${range.color.split(' ')[0]} text-white border-current shadow-sm`
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {uniqueStatus.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusClick(status.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      selectedStatus.includes(status.value)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Área */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Área</label>
              <div className="flex flex-wrap gap-2">
                {uniqueAreas.map((area) => (
                  <button
                    key={area.value}
                    onClick={() => handleAreaClick(area.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      selectedAreas.includes(area.value)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
  
      <CardContent className="p-6">
        
        {/* Tabela */}
        {filteredItems.length > 0 ? (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {columns.map((column) => (
                    <TableHead 
                      key={column.key} 
                      className={`${column.className} font-semibold text-gray-700 py-3 px-4 border-b`}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow 
                    key={item.key || index} 
                    className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key} 
                        className={`${column.className} py-3 px-4`}
                      >
                        {column.key === 'key' ? (
                          <span className="font-mono text-sm text-gray-600">{(item.key || '').toUpperCase()}</span>
                        ) : column.key === 'originalType' ? (
                          <Badge className={getTypeColor(item.normalizedType)}>
                            {toTitleCase(item.originalType)}
                          </Badge>
                        ) : column.key === 'originalStatus' ? (
                          <Badge className={getStatusColor(item.originalStatus)}>
                            {toTitleCase(item.originalStatus)}
                          </Badge>
                        ) : column.key === 'originalArea' ? (
                          item.normalizedArea === 'banco' ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              {toTitleCase(item.originalArea)}
                            </Badge>
                          )
                        ) : column.key === 'leadTime' ? (
                          <Badge className={getLeadTimeColor(item.leadTime)}>
                            {item.leadTime} Dias
                          </Badge>
                        ) : column.type === 'date' ? (
                          <Badge variant="outline" className="text-sm bg-white">
                            {item[column.key] || '-'}
                          </Badge>
                        ) : (
                          toTitleCase(item[column.key]) || '-'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Clock className="h-12 w-12 mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg font-medium mb-2">Nenhum Item Encontrado</p>
            <p className="text-gray-400 text-sm mb-4">Tente ajustar os filtros para ver mais resultados</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}

        {/* Contador de itens */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              Mostrando {filteredItems.length} de {normalizedItems.length} itens
            </span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FilteredItemsList