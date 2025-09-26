// FilteredEsforcoList.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Filter, X, FileText, Clock, BarChart3, Download, ChevronDown, ChevronRight, Lock, Unlock, Calendar, Clock as ClockIcon, AlertCircle  } from 'lucide-react';

const FilteredEsforcoList = ({ title, items, columns, type = "effort", showBlockDetails = false }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [expandedStats, setExpandedStats] = useState(true);

  if (!items || items.length === 0) {
    return null;
  }

  const normalizeString = (str) => {
    if (!str) return 'desconhecido';
    return String(str)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const toCamelCase = (str) => {
    if (!str) return '';
    return String(str)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString) => {    
    if (!dateString) return '-';

    try {
      let day = '';
      let month = '';   
      let year = '';   

      const monthMap = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
      };

      const match = dateString.match(/^(\d{1,2})\/([a-zA-Z]{3})\/(\d{2,4})/);
      if (match) {
        day = parseInt(match[1], 10);
        month = monthMap[match[2].toLowerCase()];
        year = match[3];
        return `${day}/${month}/${year}`;
      }

      return '-';
    } catch (e) {
      console.error("Erro ao formatar a data:", e);
      return '-';
    }
  };

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
    };
    return colors[normalizedType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (normalizedStatus) => {
    const statusColors = {
      'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'to do': 'bg-gray-100 text-gray-800 border-gray-200',
      'backlog': 'bg-gray-100 text-gray-800 border-gray-200',
      'done': 'bg-green-100 text-green-800 border-green-200',
      'done - sprint': 'bg-green-100 text-green-800 border-green-200',
      'released': 'bg-green-100 text-green-800 border-green-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
      'aprovacao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'aprovacao do cliente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'aguardando': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'priorizado': 'bg-purple-100 text-purple-800 border-purple-200',
      'discovery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'refinamento': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bloqueado': 'bg-red-100 text-red-800 border-red-200',
    };
    return statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEsforcoColor = (esforco) => {
    if (!esforco) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (esforco <= 50) return 'bg-green-100 text-green-800 border-green-200';
    if (esforco <= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (esforco > 100) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getBlockStatusColor = (isBlocked) => {
    return isBlocked ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200';
  };

  const normalizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      originalType: item.type,
      normalizedType: normalizeString(item.type),
      originalArea: item.area,
      normalizedArea: normalizeString(item.area),
      originalStatus: item.status,
      normalizedStatus: normalizeString(item.status),
      // Aplicar Camel Case a todos os campos exceto CHAVE
      type: item.type && item.type !== item.key ? toCamelCase(item.type) : item.type,
      area: item.area && item.area !== item.key ? toCamelCase(item.area) : item.area,
      status: item.status && item.status !== item.key ? toCamelCase(item.status) : item.status,
    }));
  }, [items]);

  const uniqueTypes = useMemo(() => {
    const typeMap = new Map();
    normalizedItems.forEach(item => {
      if (!typeMap.has(item.normalizedType)) {
        typeMap.set(item.normalizedType, {
          normalized: item.normalizedType,
          original: item.originalType || item.type || 'Desconhecido'
        });
      }
    });
    const types = Array.from(typeMap.values()).sort((a, b) => a.original.localeCompare(b.original));
    return types.map(t => ({ value: t.normalized, label: toCamelCase(t.original) }));
  }, [normalizedItems]);

  const uniqueAreas = useMemo(() => {
    const areaMap = new Map();
    normalizedItems.forEach(item => {
      if (!areaMap.has(item.normalizedArea)) {
        areaMap.set(item.normalizedArea, {
          normalized: item.normalizedArea,
          original: item.originalArea || item.area || 'Desconhecida'
        });
      }
    });
    const areas = Array.from(areaMap.values()).sort((a, b) => a.original.localeCompare(b.original));
    return areas.map(a => ({ value: a.normalized, label: toCamelCase(a.original) }));
  }, [normalizedItems]);

  const uniqueStatuses = useMemo(() => {
    const statusMap = new Map();
    normalizedItems.forEach(item => {
      if (!statusMap.has(item.normalizedStatus)) {
        statusMap.set(item.normalizedStatus, {
          normalized: item.normalizedStatus,
          original: item.originalStatus || item.status || 'Desconhecido'
        });
      }
    });
    const statuses = Array.from(statusMap.values()).sort((a, b) => a.original.localeCompare(b.original));
    return statuses.map(s => ({ value: s.normalized, label: toCamelCase(s.original) }));
  }, [normalizedItems]);

  const handleTypeClick = (item) => {
    setSelectedTypes(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);
  };

  const handleAreaClick = (item) => {
    setSelectedAreas(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
  };

  const handleStatusClick = (item) => {
    setSelectedStatuses(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  };

  const filteredItems = useMemo(() => {
    let filtered = normalizedItems;

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.normalizedType));
    }

    if (selectedAreas.length > 0) {
      filtered = filtered.filter(item => selectedAreas.includes(item.normalizedArea));
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.normalizedStatus));
    }

    return filtered;
  }, [normalizedItems, selectedTypes, selectedAreas, selectedStatuses]);

  const stats = useMemo(() => {
    if (filteredItems.length === 0) return null;
    
    let somatorioEsforco = 0;
    let somatorioBloqueio = 0;
    let somatorioEstimativa = 0;
    
    if (type === 'calculated') {
      somatorioEsforco = filteredItems.reduce((sum, item) => sum + (item.esforcoTotal || 0), 0);
      somatorioBloqueio = filteredItems.reduce((sum, item) => sum + (item.totalBlockTime || 0), 0);
      somatorioEstimativa = filteredItems.reduce((sum, item) => sum + (item.estimate || 0), 0);
    } else if (type === 'block') {
      somatorioBloqueio = filteredItems.reduce((sum, item) => sum + (item.totalBlockTime || 0), 0);
    }
    
    return {
      total: filteredItems.length,
      somatorioEsforco,
      somatorioBloqueio,
      somatorioEstimativa
    };
  }, [filteredItems, type]);

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedAreas([]);
    setSelectedStatuses([]);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedAreas.length > 0 || selectedStatuses.length > 0;

  const dateAccessors = [
    'created', 'resolved', 'deliveryStart', 'deliveryEnd', 'discoveryStart', 
    'discoveryEnd', 'aprovacao', 'refinamento', 'release'
  ];

  // Filtrar colunas para remover a coluna de estimativa
  const filteredColumns = useMemo(() => {
    return columns.filter(col => col.accessor !== 'estimate');
  }, [columns]);

  // Encontrar a coluna que contém "sprint" e "review"
  const sprintReviewColumn = useMemo(() => {
    return columns.find(col => 
      col.header && (col.header.includes('sprint') || col.header.includes('Sprint')) && 
      (col.header.includes('review') || col.header.includes('Review'))
    );
  }, [columns]);

  // Função para renderizar o conteúdo da célula
  const renderCellContent = (item, column) => {
    const accessor = column.accessor;
    const value = item[accessor];
    
    // 1. Verificar se é uma coluna de data
    if (dateAccessors.includes(accessor)) {
      return (
        <Badge variant="outline" className="bg-white text-gray-700 text-xs">
          {formatDate(value)}
        </Badge>
      );
    }
    
    // 2. Verificar se é a coluna de tipo
    if (accessor === 'type') {
      return (
        <Badge className={`${getTypeColor(item.normalizedType)} text-xs`}>
          {value}
        </Badge>
      );
    }
    
    // 3. Verificar se é a coluna de status
    if (accessor === 'status') {
      return (
        <Badge className={`${getStatusColor(item.normalizedStatus)} text-xs`}>
          {value}
        </Badge>
      );
    }
    
    // 4. Verificar se é a coluna de esforço total
    if (accessor === 'esforcoTotal') {
      return (
        <Badge className={`${getEsforcoColor(value)} text-xs`}>
          {value}
        </Badge>
      );
    }
    
    // 5. Verificar se é a coluna de tempo de bloqueio total
    if (accessor === 'totalBlockTime') {
      return (
        <Badge className={`${getEsforcoColor(value)} text-xs`}>
          {value}
        </Badge>
      );
    }
    
    // 6. Verificar se é a coluna de status de bloqueio atual - CORREÇÃO PRINCIPAL
    if (accessor === 'isCurrentlyBlocked') {
      return (
        <Badge className={`${getBlockStatusColor(value)} text-xs`}>
          {value ? 'Bloqueado' : 'Livre'}
        </Badge>
      );
    }
    
    // 7. Verificar se é a coluna de períodos de bloqueio com detalhes
    if (accessor === 'blockPeriods' && showBlockDetails && item.blockDetails) {
      return (
        <div className="space-y-1">
          {item.blockDetails.map((block, index) => (
            <div key={index} className="text-xs border-l-2 border-orange-400 pl-1 py-0.5">
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-orange-500" />
                <span>{block.blockDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Unlock className="h-3 w-3 text-green-500" />
                <span>{block.unblockDate || 'Bloqueado'}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3 text-blue-500" />
                <span>{block.blockTimeDisplay}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-purple-500" />
                <span>{block.status || block.blockStatus || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // 8. Verificar se é a coluna de sprint review com estimativa
    if (sprintReviewColumn && accessor === sprintReviewColumn.accessor) {
      return (
        <span className="text-xs">
          {value || '-'}
          {item.estimate && (
            <span className="text-gray-500"> ({item.estimate})</span>
          )}
        </span>
      );
    }
    
    // 9. Renderização padrão para outros casos
    return <span className="text-xs">{value || '-'}</span>;
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm">
              {type === 'calculated' && "Esforço calculado por fase do desenvolvimento em dias"}
              {type === 'detailed' && "Datas detalhadas do ciclo de vida dos itens"}
              {type === 'block' && "Análise de períodos de bloqueio"}
            </CardDescription>
          </div>          
        </div>

        {/* Filtros */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-3 w-3 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">Filtros</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 ml-auto text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                <X className="h-3 w-3" />
                Limpar Tudo
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Filtro de Tipo */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo</label>
              <div className="flex flex-wrap gap-1">
                {uniqueTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeClick(t.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 ${
                      selectedTypes.includes(t.value) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Área */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Área</label>
              <div className="flex flex-wrap gap-1">
                {uniqueAreas.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => handleAreaClick(a.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 ${
                      selectedAreas.includes(a.value)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <div className="flex flex-wrap gap-1">
                {uniqueStatuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusClick(s.value)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all duration-200 ${
                      selectedStatuses.includes(s.value)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        
        {/* Tabela */}
        {filteredItems.length > 0 ? (
          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  {filteredColumns.map((column) => (
                    <TableHead 
                      key={column.accessor} 
                      className="font-semibold text-gray-700 py-2 px-2 border-b text-xs whitespace-nowrap"
                      style={{ minWidth: column.accessor.includes('→') ? '120px' : 'auto' }}
                    >
                      <span className="whitespace-nowrap">
                        {sprintReviewColumn && column.accessor === sprintReviewColumn.accessor ? 
                          `${column.header} (Estimativa)` : column.header
                        }
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow 
                    key={item.key} 
                    className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {filteredColumns.map((column) => (
                      <TableCell 
                        key={column.accessor} 
                        className="py-2 px-2 text-xs"
                      >
                        {renderCellContent(item, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>

              {stats && (type === 'calculated' || type === 'block') && (
                <TableFooter className="bg-gray-100 font-bold border-t-2 border-gray-200">
                  <TableRow>
                    <TableCell colSpan={filteredColumns.length - 3} className="p-2 text-right text-xs">
                      Total
                    </TableCell>
                    {type === 'calculated' && (
                      <>
                        <TableCell className="p-2 text-xs">
                          
                        </TableCell>
                        <TableCell className="p-2 text-xs">
                          {stats.somatorioEsforco}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="p-2 text-xs">
                      {stats.somatorioBloqueio}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Clock className="h-8 w-8 mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm font-medium mb-1">Nenhum Item Encontrado</p>
            <p className="text-gray-400 text-xs mb-3">Tente ajustar os filtros para ver mais resultados</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs"
              >
                <X className="h-3 w-3" />
                Limpar Filtros
              </Button>
            )}
          </div>
        )}

        {/* Rodapé */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              Mostrando {filteredItems.length} de {normalizedItems.length} itens
            </span>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar Filtros
                </Button>
              )
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilteredEsforcoList;