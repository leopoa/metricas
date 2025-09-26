import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Upload, Clock, TrendingUp, Package, BarChart3, Rocket, Eye } from 'lucide-react';
import LeadTimeTab from './components/LeadTimeTab';
import ListagemTab from './components/ListagemTab';
import DiscoveryTab from './components/DiscoveryTab';
import DeliveryTab from './components/DeliveryTab';
import EsforcoTab from './components/EsforcoTab';
import ReviewTab from './components/ReviewTab';
import CsvUpload from './components/CsvUpload';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [processedData, setProcessedData] = useState([]);

  // Configuração das colunas do CSV
  const columnMapping = {
    key: 'Chave da item',
    type: 'Tipo de item',
    status: 'Status',
    area: 'Area',
    created: 'Criado',
    resolved: 'Resolvido',
    sprintData: 'Campo personalizado (SPRINT_DATA)',
    reviewData: 'Campo personalizado (REVIEW_DATA)',
    analiseData: 'Campo personalizado (ANALISE_DATA)',
    aguardandoPriorizacaoData: 'Campo personalizado (AGUARDANDO_PRIORIZAÇÃO_DATA)',
    discoveryStart: 'Início do Discovery',
    discoveryEnd: 'Final do Discovery',
    deliveryStart: 'Início do Delivery',
    deliveryEnd: 'Final do Delivery',
    approval: 'Aprovação',
    refinement: 'Refinamento',
    release: 'Release',
  };

  const handleDataProcessed = (rawCsvData, processedItems) => {
    setCsvData(rawCsvData);
    setProcessedData(processedItems);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Métricas de Engenharia</h1>
          <a
            href="https://github.com/vitorf/engenharia-de-software-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500"
          >
            <span className="hidden sm:inline">Código-Fonte</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-github h-4 w-4"
            >
              <path d="M15 22s-4 0-7-2c-2.3-1.6-4.5-5.5-2-9-1.3-1.4-1.2-4.5.3-6 2.5-3.5 10-2 10-2s-3.5-1.5-6-.5c-2 1-3 4-3 4 0 0 .5-3 2.5-4s5.5 1 5.5 1 0-1.5 2-2.5 4 0 4 0 1-1.5 1 0c0 1.5 0 2.5 0 4s0 4 0 4"></path>
              <path d="M9 18s-1.5-2.5-3-3"></path>
              <path d="M16 18s1.5-2.5 3-3"></path>
            </svg>
          </a>
        </div>
        {/* Componente Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          {/* Cabeçalho das abas */}
          <TabsList className="grid w-full grid-cols-7 h-12">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="leadtime"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <Clock className="h-4 w-4" />
              Lead Time
            </TabsTrigger>
            <TabsTrigger
              value="effort"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <Rocket className="h-4 w-4" />
              Esforço
            </TabsTrigger>
            {/*<TabsTrigger
              value="lista"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <Package className="h-4 w-4" />
              Lista
            </TabsTrigger> 
            <TabsTrigger
              value="discovery"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <TrendingUp className="h-4 w-4" />
              Discovery
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <BarChart3 className="h-4 w-4" />
              Delivery
            </TabsTrigger> */}
            <TabsTrigger
              value="review"
              className="flex items-center gap-2"
              disabled={processedData.length === 0}
            >
              <Eye className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          {/* Aba Upload */}
          <TabsContent value="upload" className="space-y-6">
            <CsvUpload onDataProcessed={handleDataProcessed} columnMapping={columnMapping} />
          </TabsContent>

          {/* Aba Lead Time */}
          <TabsContent value="leadtime" className="space-y-6">
            <LeadTimeTab processedData={processedData} />
          </TabsContent>

          {/* Aba Esforço */}
          <TabsContent value="effort" className="space-y-6">
            <EsforcoTab processedData={processedData} />
          </TabsContent>

          {/* Aba Backlog */}
          <TabsContent value="lista" className="space-y-6">
            <ListagemTab processedData={processedData} />
          </TabsContent>

          {/* Aba Discovery */}
          <TabsContent value="discovery" className="space-y-6">
            <DiscoveryTab processedData={processedData} />
          </TabsContent>

          {/* Aba Delivery */}
          <TabsContent value="delivery" className="space-y-6">
            <DeliveryTab processedData={processedData} />
          </TabsContent>

          {/* Aba Review */}
          <TabsContent value="review" className="space-y-6">
            <ReviewTab processedData={processedData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;