import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const ItemsList = ({ title, items, columns, type = "leadtime" }) => {
  if (!items || items.length === 0) {
    return null
  }

  const renderCellValue = (item, column) => {
    const value = item[column.key]
    
    if (column.type === 'date') {
      return value || '-'
    }
    
    if (column.type === 'days') {
      return value !== null && value !== undefined ? `${value} dias` : '-'
    }
    
    if (column.type === 'badge') {
      return <Badge variant="outline">{value || '-'}</Badge>
    }
    
    return value || '-'
  }

  const getTypeColor = (type) => {
    const colors = {
      'Bug': 'bg-red-100 text-red-800',
      'Feature': 'bg-blue-100 text-blue-800',
      'Task': 'bg-green-100 text-green-800',
      'Story': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          Lista detalhada dos itens utilizados nos gráficos desta aba ({items.length} itens)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 50).map((item, index) => (
                <TableRow key={item.key || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.key === 'type' ? (
                        <Badge className={getTypeColor(item[column.key])}>
                          {item[column.key]}
                        </Badge>
                      ) : (
                        renderCellValue(item, column)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length > 50 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Mostrando 50 de {items.length} itens. Use filtros para refinar a visualização.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ItemsList

