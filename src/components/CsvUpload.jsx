import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Upload, Info, Eye, EyeOff, XCircle, ArrowRightCircle } from 'lucide-react';

const CsvUpload = ({ onDataProcessed, columnMapping }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStats, setUploadStats] = useState(null);
  const [invalidRows, setInvalidRows] = useState([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [fileToProcess, setFileToProcess] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);

  // Estados para a nova funcionalidade de mapeamento
  const [showMapping, setShowMapping] = useState(false);

  const defaultColumnMapping = {
    key: 'Chave da item',
    type: 'Tipo de item',
    status: 'Status',
    area: 'Area',
    created: 'Criado',
    resolved: 'Resolvido',
    deliveryStart: 'Início do Delivery',
    deliveryEnd: 'Final do Delivery',
    discoveryStart: 'Início do Discovery',
    discoveryEnd: 'Final do Discovery',
    aprovacao: 'Aprovação',
    refinamento: 'Refinamento',
    release: 'Release',
    block: 'Bloqueio',
    estimate: 'Estimativa', // Novo campo para estimativa
  };

  // Carregar o estado salvo do localStorage na inicialização
  const [userColumnMapping, setUserColumnMapping] = useState(() => {
    try {
      const savedMapping = localStorage.getItem('userColumnMapping');
      return savedMapping ? JSON.parse(savedMapping) : {};
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      return {};
    }
  });

 const parseEstimate = (estimateString) => {
    if (!estimateString || typeof estimateString !== 'string') {
      return 0;
    }

    const SEGUNDOS_POR_DIA = 8 * 60 * 60;
    const dias = estimateString / SEGUNDOS_POR_DIA;
    const valorArredondado = Math.round(dias);

    return valorArredondado;
  };

  // Salvar o estado no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem('userColumnMapping', JSON.stringify(userColumnMapping));
  }, [userColumnMapping]);

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

  const calculateTimeDifference = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) {
      return null;
    }
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const validateRow = (row, index, currentMapping) => {
    const errors = [];
    if (!row[currentMapping.key] || row[currentMapping.key].trim() === '') {
      errors.push(`'${currentMapping.key}' é obrigatória`);
    }
    if (!row[currentMapping.type] || row[currentMapping.type].trim() === '') {
      errors.push(`'${currentMapping.type}' é obrigatório`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      rowData: row,
      lineNumber: index + 2
    };
  };

  const validateCSVStructure = (headers, mapping) => {
    const requiredColumns = [mapping.key, mapping.type, mapping.status, mapping.area, mapping.created, mapping.resolved];
    const missingColumns = requiredColumns.filter(col => col && !headers.includes(col));
    return {
      isValid: missingColumns.length === 0,
      missingColumns
    };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setUploadStats(null);
    setInvalidRows([]);
    setShowErrorDetails(false);
    setFileToProcess(null);

    Papa.parse(file, {
      header: true,
      preview: 50,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setFileToProcess(file);

        // MODIFICAÇÃO: Resetar o mapeamento do usuário para um estado vazio
        const initialMapping = {};
        Object.keys(defaultColumnMapping).forEach(key => {
          initialMapping[key] = ''; // Define o valor inicial de cada campo como vazio
        });
        setUserColumnMapping(initialMapping);

        setIsLoading(false);
        setShowMapping(true);
      },
      error: (error) => {
        setError('Erro ao leer o arquivo: ' + error.message);
        setIsLoading(false);
      }
    });
  };

  const handleProcessFile = () => {
    if (!fileToProcess) return;

    // A validação agora ocorre somente após a leitura do arquivo, usando o mapeamento do usuário
    setIsLoading(true);
    setError('');
    setShowMapping(false);

    Papa.parse(fileToProcess, {
      header: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];
          const validation = validateCSVStructure(headers, userColumnMapping);
          if (!validation.isValid) {
            setError(`Colunas obrigatórias ausentes: ${validation.missingColumns.join(', ')}`);
            setIsLoading(false);
            return;
          }

          const totalRows = results.data.length;
          const validationResults = results.data.map((row, index) => validateRow(row, index, userColumnMapping));
          const validRowsData = validationResults.filter(result => result.isValid);
          const invalidRowsData = validationResults.filter(result => !result.isValid);

          const validationStats = {
            totalRows,
            validRows: validRowsData.length,
            invalidRows: invalidRowsData.length,
            validationDate: new Date().toLocaleString('pt-BR'),
            fileName: fileToProcess.name,
            fileSize: (fileToProcess.size / 1024).toFixed(2) + ' KB',
            headers: results.meta.fields || []
          };

          setUploadStats(validationStats);
          setInvalidRows(invalidRowsData);

          if (validRowsData.length === 0) {
            setError('Nenhum dado válido encontrado. Verifique se o CSV possui dados nas colunas obrigatórias.');
            setIsLoading(false);
            return;
          }

          const processed = validRowsData.map(({ rowData }) => {
            const leadTime = calculateTimeDifference(rowData[userColumnMapping.created], rowData[userColumnMapping.resolved]);
            const deliveryTime = calculateTimeDifference(rowData[userColumnMapping.deliveryStart], rowData[userColumnMapping.deliveryEnd]);
            const discoveryTime = calculateTimeDifference(rowData[userColumnMapping.discoveryStart], rowData[userColumnMapping.discoveryEnd]);

            return {
              key: rowData[userColumnMapping.key],
              type: rowData[userColumnMapping.type],
              area: rowData[userColumnMapping.area], 
              status: rowData[userColumnMapping.status] || null,
              created: rowData[userColumnMapping.created],
              resolved: rowData[userColumnMapping.resolved],
              deliveryStart: rowData[userColumnMapping.deliveryStart],
              deliveryEnd: rowData[userColumnMapping.deliveryEnd],
              discoveryStart: rowData[userColumnMapping.discoveryStart],
              discoveryEnd: rowData[userColumnMapping.discoveryEnd],
              aprovacao: rowData[userColumnMapping.aprovacao],
              refinamento: rowData[userColumnMapping.refinamento],
              release: rowData[userColumnMapping.release],
              block: rowData[userColumnMapping.block] || null,
              estimate: parseEstimate(rowData[userColumnMapping.estimate]),
              leadTime: leadTime,
              deliveryTime: deliveryTime,
              discoveryTime: discoveryTime
            };
          });
   
          console.log(processed);
   
          onDataProcessed(validRowsData.map(({ rowData }) => rowData), processed);
          setIsLoading(false);
        } catch (error) {
          setError('Erro ao processar o arquivo CSV: ' + error.message);
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError('Erro ao ler o arquivo: ' + error.message);
        setIsLoading(false);
      }
    });
  };

  const handleMappingChange = (key, value) => {
    setUserColumnMapping(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderTag = (text, bgColor, textColor) => (
    <span className={`ml-2 inline-flex items-center rounded-md ${bgColor} px-2 py-0.5 text-xs font-medium ${textColor}`}>
      {text}
    </span>
  );

  const renderField = (key, label, tagType) => (
    <div className="space-y-2">
      <Label htmlFor={`mapping-${key}`}>
        {label}
        {tagType === 'required' && renderTag('Obrigatório', 'bg-red-50', 'text-red-700')}
        {tagType === 'lead-time' && renderTag('Lead Time', 'bg-blue-50', 'text-blue-700')}
        {tagType === 'delivery' && renderTag('Delivery', 'bg-purple-50', 'text-purple-700')}
        {tagType === 'discovery' && renderTag('Discovery', 'bg-green-50', 'text-green-700')}
        {tagType === 'release' && renderTag('Release', 'bg-yellow-50', 'text-yellow-700')}
        {tagType === 'block' && renderTag('Bloqueio', 'bg-orange-50', 'text-orange-700')}
        {tagType === 'estimate' && renderTag('Estimativa', 'bg-indigo-50', 'text-indigo-700')}
      </Label>
      <select
        id={`mapping-${key}`}
        value={userColumnMapping[key] || ''}
        onChange={(e) => handleMappingChange(key, e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled>Selecione uma coluna</option>
        {csvHeaders.map(header => (
          <option key={header} value={header}>{header}</option>
        ))}
      </select>
    </div>
  );

  const renderEmptyDiv = () => <div className="hidden lg:block"></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload do Arquivo CSV
        </CardTitle>
        <CardDescription>
          Faça upload do arquivo CSV contendo os dados dos itens para análise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seção de Upload do Arquivo */}
        {!showMapping && (
          <div className="space-y-2">
            <Label htmlFor="csv-file">Selecione o arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Processando arquivo...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <p className="text-destructive font-medium">Erro:</p>
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Nova Seção de Mapeamento de Colunas */}
        {showMapping && !isLoading && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Mapear Colunas do CSV
              </CardTitle>
              <CardDescription>
                Selecione das colunas do seu arquivo que correspondem aos campos necessários para a análise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Linha de campos obrigatórios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('key', 'Chave da item', 'required')}
                  {renderField('type', 'Tipo de item', 'required')}
                  {renderField('status', 'Status', 'required')}
                  {renderEmptyDiv()}
                  {renderEmptyDiv()}
                </div>
                {/* Linha de campos de Lead Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('created', 'Criado', 'lead-time')}
                  {renderField('resolved', 'Resolvido', 'lead-time')}
                  {renderEmptyDiv()}
                  {renderEmptyDiv()}
                </div>
                {/* Linha de campos de Discovery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('discoveryStart', 'Análise', 'discovery')}
                  {renderField('discoveryEnd', 'Priorização', 'discovery')}
                  {renderField('aprovacao', 'Aprovação', 'discovery')}
                  {renderField('refinamento', 'Refinamento', 'discovery')}
                </div>
                {/* Linha de campos de Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('deliveryStart', 'Sprint', 'delivery')}
                  {renderField('deliveryEnd', 'Review', 'delivery')}
                  {renderEmptyDiv()}
                  {renderEmptyDiv()}
                </div>
                {/* Linha de campos de Release */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('release', 'Release', 'release')}
                  {renderEmptyDiv()}
                  {renderEmptyDiv()}
                  {renderEmptyDiv()}
                </div>
                {/* Nova linha para campo de bloqueio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderField('block', 'Bloqueios', '')}
                  {renderField('estimate', 'Estimativa', '')}                  
                  {renderField('area', 'Área', '')}
                  {renderEmptyDiv()}
                </div>
                
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMapping(false)}>Cancelar</Button>
                <Button onClick={handleProcessFile} className="flex items-center gap-2">
                  Processar Dados <ArrowRightCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Estatísticas e Erros (inalterada) */}
        {uploadStats && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Estatísticas do Upload</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <p className="text-sm text-blue-600">Total de Linhas</p>
                <p className="text-2xl font-bold text-blue-800">{uploadStats.totalRows}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border">
                <p className="text-sm text-green-600">Linhas Válidas</p>
                <p className="text-2xl font-bold text-green-800">{uploadStats.validRows}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border">
                <p className="text-sm text-orange-600">Linhas com Erro</p>
                <p className="text-2xl font-bold text-orange-800">{uploadStats.invalidRows}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-800">
                  {((uploadStats.validRows / uploadStats.totalRows) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Arquivo:</strong> {uploadStats.fileName}</p>
              <p><strong>Tamanho:</strong> {uploadStats.fileSize}</p>
              <p><strong>Processado em:</strong> {uploadStats.validationDate}</p>
            </div>

            {invalidRows.length > 0 && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="flex items-center gap-2"
                >
                  {showErrorDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showErrorDetails ? 'Ocultar' : 'Mostrar'} Detalhes dos Erros
                  ({invalidRows.length})
                </Button>
              </div>
            )}
          </div>
        )}

        {showErrorDetails && invalidRows.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Linhas com Erros de Validação
              </CardTitle>
              <CardDescription>
                {invalidRows.length} linha(s) contêm erros que impedem o processamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Chave do Item</TableHead>
                      <TableHead>Tipo do Item</TableHead>
                      <TableHead>Motivo do Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invalidRows.map((invalidRow, index) => (
                      <TableRow key={index} className="bg-destructive/10 hover:bg-destructive/20">
                        <TableCell className="font-mono">{invalidRow.lineNumber}</TableCell>
                        <TableCell className="font-mono">
                          {invalidRow.rowData[userColumnMapping.key] || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {invalidRow.rowData[userColumnMapping.type] || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside space-y-1">
                            {invalidRow.errors.map((err, i) => (
                              <li key={i} className="text-sm text-destructive">{err}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default CsvUpload;