
import type { ChartConfig } from '@/services/prompt-templates';

export interface ChartTypeOption {
  value: string;
  label: string;
  group: string;
}

// Opzioni di grafici estese basate su ApexCharts
export const chartTypeOptions: ChartTypeOption[] = [
  // Base charts
  { value: 'bar', label: 'Barre', group: 'Base' },              // Column is also bar (vertical)
  { value: 'line', label: 'Linee', group: 'Base' },
  { value: 'area', label: 'Area', group: 'Base' },
  { value: 'pie', label: 'Torta', group: 'Base' },
  { value: 'donut', label: 'Ciambella', group: 'Base' },
  { value: 'radialBar', label: 'Barre Radiali', group: 'Base' },
  { value: 'polarArea', label: 'Area Polare', group: 'Base' },

  // Special charts
  { value: 'scatter', label: 'Dispersione', group: 'Specializzati' },
  { value: 'bubble', label: 'Bolle', group: 'Specializzati' },
  { value: 'heatmap', label: 'Mappa di Calore', group: 'Specializzati' },
  { value: 'candlestick', label: 'Candlestick', group: 'Specializzati' },
  { value: 'boxPlot', label: 'Box Plot', group: 'Specializzati' },
  { value: 'treemap', label: 'Treemap', group: 'Specializzati' },
  { value: 'radar', label: 'Radar', group: 'Specializzati' },
  {value: 'rangeBar', label: 'Barre Range', group: 'Specializzati' },
  { value: 'rangeArea', label: 'Area Intervallo', group: 'Specializzati' },

  // Variants & Features (not real types, just for UI)
  { value: 'column', label: 'Colonne (usa "bar" verticale)', group: 'Varianti' },
  { value: 'mixed', label: 'Misto (Linee + Barre)', group: 'Combinati' },
  { value: 'combo', label: 'Combo (Barre + Linee)', group: 'Combinati'},
  { value: 'timelineSeries', label: 'Timeline', group: 'Combinati' },
  { value: 'syncMultiple', label: 'Grafici Sincronizzati', group: 'Funzionalità' }
];

// Più opzioni per le tabelle
export interface TableTypeOption {
  value: string;
  label: string;
  description?: string;
}

export const tableTypeOptions: TableTypeOption[] = [
  { value: 'simple', label: 'Semplice', description: 'Tabella con righe e colonne standard' },
  { value: 'comparison', label: 'Confronto', description: 'Confronto tra diversi set di dati' },
  { value: 'progress', label: 'Progresso', description: 'Visualizza progressi verso obiettivi' },
  { value: 'stats', label: 'Statistiche', description: 'Visualizza statistiche con min/max/media' },
  { value: 'financial', label: 'Finanziaria', description: 'Formattazione per dati finanziari' },
  { value: 'timeline', label: 'Timeline', description: 'Visualizza eventi lungo una linea temporale' },
  { value: 'grid', label: 'Griglia Avanzata', description: 'Griglia con ordinamento e filtri' },
  { value: 'hierarchical', label: 'Gerarchica', description: 'Visualizza relazioni parent-child' },
  { value: 'matrix', label: 'Matrice', description: 'Vista a matrice di dati correlati' },
];

// Configurazioni di colori predefiniti
export const colorPalettes = {
  standard: ['#4f46e5', '#2dd4bf', '#fbbf24', '#f87171', '#a78bfa'],
  pastel: ['#67e8f9', '#a7f3d0', '#fde68a', '#fecaca', '#ddd6fe'],
  corporate: ['#1e40af', '#0e7490', '#4d7c0f', '#9f1239', '#6d28d9'],
  monochrome: ['#020617', '#1e293b', '#334155', '#64748b', '#94a3b8'],
  bold: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
};

// Configurazione estesa per grafici
export const getDefaultChartConfig = (type: string): ChartConfig => {
  const baseConfig: ChartConfig = {
    colors: colorPalettes.standard,
    height: 350,
    width: '100%',
    animations: {
      enabled: true,
      speed: 800
    },
    tooltip: {
      enabled: true
    },
    legend: {
      show: true,
      position: 'bottom'
    }
  };
  
  // Configurazioni specifiche per tipo di grafico
  switch (type) {
    case 'bar':
    case 'column':
      return {
        ...baseConfig,
        xaxis: {
          title: 'Categorie'
        },
        yaxis: {
          title: 'Valori'
        }
      };
      
    case 'line':
    case 'area':
      return {
        ...baseConfig,
        xaxis: {
          title: 'Periodo'
        },
        yaxis: {
          title: 'Valori'
        }
      };
      
    case 'pie':
    case 'donut':
      return {
        ...baseConfig,
        legend: {
          show: true,
          position: 'right'
        }
      };
      
    case 'radar':
      return {
        ...baseConfig,
        xaxis: {
          categories: ['Categoria 1', 'Categoria 2', 'Categoria 3', 'Categoria 4', 'Categoria 5']
        }
      };
      
    case 'heatmap':
      return {
        ...baseConfig,
        colors: ['#9BE9A8', '#40C463', '#30A14E', '#216E39'],
        xaxis: {
          title: 'Categorie X'
        },
        yaxis: {
          title: 'Categorie Y'
        }
      };
      
    case 'boxPlot':
      return {
        ...baseConfig,
        xaxis: {
          title: 'Categorie'
        },
        yaxis: {
          title: 'Valori'
        }
      };
      
    case 'polarArea':
      return {
        ...baseConfig,
        legend: {
          show: true,
          position: 'right'
        }
      };
      
    default:
      return baseConfig;
  }
};

export interface DataSeriesType {
  name: string;
  data: number[];
}

// Dati demo estesi per vari tipi di grafici
export const generateDemoData = (chartType: string): any => {
  switch (chartType) {
    case 'bar':
    case 'column':
      return {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
        datasets: [
          {
            name: 'Serie 1',
            data: [44, 55, 57, 56, 61, 58]
          },
          {
            name: 'Serie 2',
            data: [76, 85, 101, 98, 87, 105]
          }
        ]
      };

    case 'line':
    case 'area':
      return {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
        datasets: [
          {
            name: 'Serie 1',
            data: [31, 40, 28, 51, 42, 109]
          },
          {
            name: 'Serie 2',
            data: [11, 32, 45, 32, 34, 52]
          }
        ]
      };
      
    case 'pie':
    case 'donut':
      return {
        labels: ['Categoria A', 'Categoria B', 'Categoria C', 'Categoria D'],
        datasets: [
          {
            data: [44, 55, 13, 33]
          }
        ]
      };

    case 'radar':
      return {
        labels: ['Velocità', 'Robustezza', 'Usabilità', 'Sicurezza', 'Prestazioni', 'Affidabilità'],
        datasets: [
          {
            name: 'Prodotto A',
            data: [80, 50, 30, 40, 70, 20]
          },
          {
            name: 'Prodotto B',
            data: [20, 30, 70, 80, 40, 60]
          }
        ]
      };
      
    case 'heatmap':
      return {
        labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven'],
        datasets: [
          { name: '9:00', data: [21, 43, 54, 35, 26] },
          { name: '12:00', data: [42, 33, 15, 37, 28] },
          { name: '15:00', data: [25, 36, 57, 28, 19] },
          { name: '18:00', data: [13, 24, 35, 46, 37] }
        ]
      };

    case 'boxPlot':
      return {
        labels: ['Prodotto A', 'Prodotto B', 'Prodotto C'],
        datasets: [
          {
            name: 'Box Plot',
            data: [
              { x: 'Prodotto A', y: [54, 66, 69, 75, 88] },
              { x: 'Prodotto B', y: [43, 65, 69, 76, 81] },
              { x: 'Prodotto C', y: [31, 39, 45, 51, 59] }
            ]
          }
        ]
      };
      
    case 'polarArea':
      return {
        labels: ['Categoria A', 'Categoria B', 'Categoria C', 'Categoria D', 'Categoria E'],
        datasets: [
          {
            data: [42, 39, 35, 29, 26]
          }
        ]
      };
      
    case 'treemap':
      return {
        datasets: [
          {
            data: [
              { x: 'Categoria A', y: 40 },
              { x: 'Categoria B', y: 30 },
              { x: 'Categoria C', y: 20 },
              { x: 'Categoria D', y: 10 }
            ]
          }
        ]
      };
      
    default:
      return {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
        datasets: [
          {
            name: 'Esempio',
            data: [30, 40, 35, 50, 49, 60]
          }
        ]
      };
  }
};

// Dati demo estesi per vari tipi di tabelle
export const generateTableDemo = (tableType: string): any => {
  switch (tableType) {
    case 'comparison':
      return {
        headers: ['Metrica', 'Gruppo A', 'Gruppo B', 'Differenza', 'Var. %'],
        rows: [
          ['Fatturato', '€10,500', '€8,300', '+€2,200', '+26.5%'],
          ['Clienti', '145', '120', '+25', '+20.8%'],
          ['Valore Medio', '€72.4', '€69.2', '+€3.2', '+4.6%'],
          ['Soddisfazione', '4.5/5', '4.2/5', '+0.3', '+7.1%']
        ]
      };
      
    case 'progress':
      return {
        headers: ['Obiettivo', 'Attuale', 'Target', 'Progresso', 'Stato'],
        rows: [
          ['Nuovi Clienti', '87', '100', '87%', 'In corso'],
          ['Fatturato', '€48,500', '€50,000', '97%', 'In corso'],
          ['Riduzione Costi', '€12,300', '€10,000', '123%', 'Completato'],
          ['Progetti Completati', '18', '20', '90%', 'In corso']
        ]
      };
      
    case 'stats':
      return {
        headers: ['Metrica', 'Valore', 'Media', 'Min', 'Max'],
        rows: [
          ['Punteggio', '78', '65', '42', '95'],
          ['Tempo (min)', '45', '50', '30', '75'],
          ['Errori', '3', '5', '0', '12'],
          ['Efficienza', '87%', '75%', '60%', '95%']
        ]
      };
      
    case 'financial':
      return {
        headers: ['Voce', 'Q1', 'Q2', 'Q3', 'Q4', 'Totale'],
        rows: [
          ['Ricavi', '€25,400', '€28,700', '€31,900', '€35,200', '€121,200'],
          ['Costi', '€18,300', '€19,500', '€20,800', '€22,100', '€80,700'],
          ['Margine', '€7,100', '€9,200', '€11,100', '€13,100', '€40,500'],
          ['Margine %', '28%', '32%', '35%', '37%', '33%']
        ]
      };
      
    case 'timeline':
      return {
        headers: ['Fase', 'Data Inizio', 'Data Fine', 'Responsabile', 'Status'],
        rows: [
          ['Analisi', '01/01/2025', '15/01/2025', 'Mario Rossi', 'Completato'],
          ['Progettazione', '16/01/2025', '15/02/2025', 'Laura Bianchi', 'Completato'],
          ['Sviluppo', '16/02/2025', '15/04/2025', 'Paolo Verdi', 'In corso'],
          ['Test', '16/04/2025', '30/04/2025', 'Giulia Neri', 'Pianificato']
        ]
      };
      
    case 'grid':
      return {
        headers: ['ID', 'Nome', 'Dipartimento', 'Ruolo', 'Assunzione', 'Stipendio'],
        rows: [
          ['001', 'Mario Rossi', 'Marketing', 'Manager', '10/01/2020', '€65,000'],
          ['002', 'Laura Bianchi', 'Vendite', 'Responsabile', '15/03/2019', '€58,000'],
          ['003', 'Paolo Verdi', 'IT', 'Sviluppatore', '22/05/2021', '€52,000'],
          ['004', 'Giulia Neri', 'Risorse Umane', 'Direttore', '03/11/2018', '€72,000'],
          ['005', 'Andrea Blu', 'Finanza', 'Analista', '17/07/2020', '€48,000'],
        ],
        sortable: true,
        filterable: true
      };
      
    case 'hierarchical':
      return {
        headers: ['Dipartimento', 'Responsabile', 'Dipendenti', 'Budget', 'Status'],
        rows: [
          ['Marketing', 'Mario Rossi', '12', '€350,000', 'Attivo'],
          ['└─ Digitale', 'Laura Verdi', '5', '€150,000', 'Attivo'],
          ['└─ Tradizionale', 'Giorgio Blu', '7', '€200,000', 'In revisione'],
          ['Vendite', 'Andrea Bianchi', '15', '€420,000', 'Attivo'],
          ['└─ Nazionale', 'Lucia Gialli', '8', '€220,000', 'Attivo'],
          ['└─ Internazionale', 'Marco Neri', '7', '€200,000', 'In espansione'],
        ]
      };
      
    case 'matrix':
      return {
        headers: ['', 'Q1', 'Q2', 'Q3', 'Q4', 'Totale'],
        rows: [
          ['Nord', '€125K', '€152K', '€130K', '€175K', '€582K'],
          ['Centro', '€95K', '€110K', '€105K', '€128K', '€438K'],
          ['Sud', '€70K', '€85K', '€92K', '€105K', '€352K'],
          ['Isole', '€45K', '€52K', '€58K', '€62K', '€217K'],
          ['Totale', '€335K', '€399K', '€385K', '€470K', '€1,589K'],
        ]
      };
      
    default: // simple
      return {
        headers: ['Nome', 'Email', 'Ruolo', 'Dipartimento'],
        rows: [
          ['Mario Rossi', 'mario.rossi@example.com', 'Sviluppatore', 'IT'],
          ['Laura Bianchi', 'laura.bianchi@example.com', 'Designer', 'Marketing'],
          ['Paolo Verdi', 'paolo.verdi@example.com', 'Manager', 'Vendite'],
          ['Giulia Neri', 'giulia.neri@example.com', 'Analista', 'Finanza']
        ]
      };
  }
};

// Funzione per generare configurazioni di grafici avanzate
export const generateAdvancedChartConfig = (type: string, options: any = {}): ChartConfig => {
  const baseConfig = getDefaultChartConfig(type);
  
  // Applica opzioni personalizzate
  return {
    ...baseConfig,
    ...options,
    // Mantieni le opzioni nidificate
    legend: {
      ...baseConfig.legend,
      ...options.legend
    },
    tooltip: {
      ...baseConfig.tooltip,
      ...options.tooltip
    },
    animations: {
      ...baseConfig.animations,
      ...options.animations
    },
    xaxis: {
      ...baseConfig.xaxis,
      ...options.xaxis
    },
    yaxis: {
      ...baseConfig.yaxis,
      ...options.yaxis
    }
  };
};
