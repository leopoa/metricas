// EsforcoTab.jsx
import { useState, useMemo } from 'react';
import FilteredEsforcoList from './FilteredEsforcoList';

const EsforcoTab = ({ processedData }) => {
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

  // Função auxiliar para calcular a diferença de dias entre duas datas
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {       
      return 0;
    }
    
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Função para parsear as mensagens de bloqueio
  const parseBlockMessages = (blockText) => {
    if (!blockText) return [];
    
    const messages = blockText.split('DATA[').filter(msg => msg.trim() !== '');
    
    return messages.map(msg => {
      const fullMessage = 'DATA[' + msg;
      
      const dateMatch = fullMessage.match(/DATA\[(\d{4}-\d{2}-\d{2})\]/);
      const date = dateMatch ? dateMatch[1] : null;
      
      const statusMatch = fullMessage.match(/STATUS\[([^\]]+)\]/);
      const status = statusMatch ? statusMatch[1] : null;
      
      const authorMatch = fullMessage.match(/AUTOR\[([^\]]+)\]/);
      const author = authorMatch ? authorMatch[1] : null;
      
      const description = fullMessage.replace(/DATA\[\d{4}-\d{2}-\d{2}\]|AUTOR\[[^\]]+\]|STATUS\[[^\]]+\]/g, '').trim();
      
      return {
        fullMessage,
        date,
        status,
        author,
        description,
        timestamp: date ? new Date(date) : null
      };
    });
  };

  // Função para calcular os tempos de bloqueio
  const calculateBlockTimes = (blockMessages) => {
    if (!blockMessages) {
      return {
        blockPeriods: [],
        totalBlockTime: 0,
        isCurrentlyBlocked: false
      };
    }
    
    const parsedMessages = parseBlockMessages(blockMessages);
    const blockPeriods = [];
    let totalBlockTime = 0;
    
    const sortedMessages = parsedMessages
      .filter(msg => msg.timestamp)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedMessages.length; i += 2) {
      if (i + 1 < sortedMessages.length) {
        const blockMessage = sortedMessages[i];
        const unblockMessage = sortedMessages[i + 1];
        
        const blockDate = blockMessage.timestamp;
        const unblockDate = unblockMessage.timestamp;
        
        const blockTimeDays = Math.ceil((unblockDate - blockDate) / (1000 * 60 * 60 * 24));
        
        blockPeriods.push({
          blockDate: blockMessage.date,
          unblockDate: unblockMessage.date,
          blockStatus: blockMessage.status,
          unblockStatus: unblockMessage.status,
          blockTimeDays,
          blockAuthor: blockMessage.author,
          unblockAuthor: unblockMessage.author,
          blockDescription: blockMessage.description,
          unblockDescription: unblockMessage.description
        });
        
        totalBlockTime += blockTimeDays;
      } else {
        const blockMessage = sortedMessages[i];
        
        blockPeriods.push({
          blockDate: blockMessage.date,
          unblockDate: null,
          blockStatus: blockMessage.status,
          unblockStatus: null,
          blockTimeDays: null,
          blockAuthor: blockMessage.author,
          unblockAuthor: null,
          blockDescription: blockMessage.description,
          unblockDescription: null,
          stillBlocked: true
        });
      }
    }
    
    return {
      blockPeriods,
      totalBlockTime,
      isCurrentlyBlocked: sortedMessages.length % 2 !== 0
    };
  };

  // Processar os dados para incluir os campos calculados
  const calculatedItems = useMemo(() => {
    return processedData.map(item => {
      const analiseAprovacao = calculateDays(item.discoveryStart, item.aprovacao);
      const refinamentoPriorizacao = calculateDays(item.discoveryEnd, item.refinamento);
      const sprintReview = calculateDays(item.deliveryStart, item.deliveryEnd);
      const releaseDone = calculateDays(item.release, item.resolved);
      const esforcoTotal = analiseAprovacao + refinamentoPriorizacao + sprintReview + releaseDone;

      const blockTimes = calculateBlockTimes(item.block);
      const blockDetails = blockTimes.blockPeriods.map(period => ({
        ...period,
        blockTimeDisplay: period.stillBlocked ? 'Em bloqueio' : `${period.blockTimeDays} dias`,
        status: period.blockStatus
      }));

      return {
        ...item,
        analiseAprovacao: analiseAprovacao || 0,
        refinamentoPriorizacao: refinamentoPriorizacao || 0,
        sprintReview: sprintReview || 0,
        releaseDone: releaseDone || 0,
        esforcoTotal: esforcoTotal || 0,
        blockDetails,
        totalBlockTime: blockTimes.totalBlockTime,
        isCurrentlyBlocked: blockTimes.isCurrentlyBlocked,
        blockPeriods: blockTimes.blockPeriods.length,
        estimate: item.estimate || 0
      };
    });
  }, [processedData]);

  // Configuração das colunas
  const calculatedColumns = [
    { header: 'Chave', accessor: 'key' },
    { header: 'Área', accessor: 'area' },
    { header: 'Tipo', accessor: 'type' },
    { header: 'Status', accessor: 'status' }, 
    { header: 'Análise → Aprovação', accessor: 'analiseAprovacao' },
    { header: 'Refinamento → Priorização', accessor: 'refinamentoPriorizacao' },
    { header: 'Sprint → Review', accessor: 'sprintReview' },
    { header: 'Release → Entrega', accessor: 'releaseDone' },
    { header: 'Esforço Total', accessor: 'esforcoTotal' },
    { header: 'Estimativa', accessor: 'estimate' },
    { header: 'Bloqueios', accessor: 'blockPeriods' },
  ];

  return (
    <FilteredEsforcoList
      title="Esforço Total Calculado"
      items={calculatedItems}
      columns={calculatedColumns}
      type="calculated"
      showBlockDetails={true}
    />
  );
};

export default EsforcoTab;