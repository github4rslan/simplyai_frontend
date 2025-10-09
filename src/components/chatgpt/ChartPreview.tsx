
import React, { useState, useEffect } from 'react';
// Change next/dynamic to React lazy
import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChartConfig } from '@/services/prompt-templates';
import { generateDemoData } from '@/services/chart-config';
import { PieChart, Settings } from 'lucide-react';

// Lazily load ApexCharts to avoid SSR issues
const ReactApexChart = lazy(() => import('react-apexcharts'));

interface ChartPreviewProps {
  chartType: string;
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

// Color palette options
const colorPalettes = {
  default: ['#4f46e5', '#2dd4bf', '#fbbf24', '#f87171', '#a78bfa'],
  pastel: ['#67e8f9', '#a7f3d0', '#fde68a', '#fecaca', '#ddd6fe'],
  corporate: ['#1e40af', '#0e7490', '#4d7c0f', '#9f1239', '#6d28d9'],
  monochrome: ['#020617', '#1e293b', '#334155', '#64748b', '#94a3b8'],
  bold: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
};

const ChartPreview: React.FC<ChartPreviewProps> = ({ chartType, config, onConfigChange }) => {
  const [demoData, setDemoData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [apexOptions, setApexOptions] = useState<any>({});
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    // Generate demo data based on chart type
    const data = generateDemoData(chartType);
    setDemoData(data);

    // Create series data from the demo data
    let seriesData: any[] = [];
    if (['pie', 'donut', 'polarArea'].includes(chartType)) {
      seriesData = data.datasets[0].data;
    } else {
      seriesData = data.datasets.map((dataset: any, index: number) => ({
        name: dataset.name,
        data: dataset.data
      }));
    }
    setSeries(seriesData);

    // Create ApexCharts options from config
    let options: any = {
      chart: {
        id: 'chart-preview',
        type: chartType,
        height: config.height || 350,
        width: config.width || '100%',
        toolbar: {
          show: true
        },
        animations: config.animations
      },
      colors: config.colors || colorPalettes.default,
      title: config.title,
      subtitle: config.subtitle,
      xaxis: {
        categories: data.labels,
        title: {
          text: config.xaxis?.title || ''
        },
        labels: config.xaxis?.labels
      },
      yaxis: {
        title: {
          text: config.yaxis?.title || ''
        },
        labels: config.yaxis?.labels
      },
      legend: config.legend,
      tooltip: config.tooltip,
      dataLabels: config.dataLabels,
      stroke: config.stroke,
      grid: config.grid,
      theme: config.theme
    };

    // Special handling for pie/donut charts
    if (['pie', 'donut', 'polarArea'].includes(chartType)) {
      options.labels = data.labels;
    }

    setApexOptions(options);
  }, [chartType, config]);

  // Update a specific config property
  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    
    // Split path into nested properties (e.g., 'title.text' becomes ['title', 'text'])
    const parts = path.split('.');
    let current = newConfig as any;
    
    // Navigate to the last parent object
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the value
    current[parts[parts.length - 1]] = value;
    
    // Call the parent update function
    onConfigChange(newConfig);
  };

  const handleColorPaletteChange = (palette: string) => {
    updateConfig('colors', colorPalettes[palette as keyof typeof colorPalettes] || colorPalettes.default);
  };

  if (!demoData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="preview">
            <PieChart className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configurazione
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-4">
          <div className="flex flex-col items-center">
            {typeof window !== 'undefined' && (
              <div style={{ width: '100%', height: config.height || 350 }}>
                <Suspense fallback={<div>Loading chart...</div>}>
                  <ReactApexChart 
                    options={apexOptions} 
                    series={series} 
                    type={chartType as any} 
                    height={config.height || 350} 
                    width={config.width || '100%'} 
                  />
                </Suspense>
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-4">
              Questa è un'anteprima del grafico. I dati reali verranno generati in base alle risposte del questionario.
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensioni */}
            <div>
              <Label htmlFor="chart-height">Altezza (px)</Label>
              <Input
                id="chart-height"
                type="number"
                value={config.height || 350}
                onChange={(e) => updateConfig('height', parseInt(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="chart-width">Larghezza (%)</Label>
              <Input
                id="chart-width"
                type="text"
                value={typeof config.width === 'number' ? config.width : (config.width || '100%')}
                onChange={(e) => updateConfig('width', e.target.value)}
                placeholder="100%"
              />
              <p className="text-xs text-muted-foreground mt-1">Usa percentuale (es. 100%) o pixel (es. 500)</p>
            </div>
            
            {/* Titolo */}
            <div>
              <Label htmlFor="chart-title">Titolo</Label>
              <Input
                id="chart-title"
                value={config.title?.text || ''}
                onChange={(e) => updateConfig('title.text', e.target.value)}
                placeholder="Titolo del grafico"
              />
            </div>
            
            <div>
              <Label htmlFor="title-align">Allineamento Titolo</Label>
              <Select
                value={config.title?.align || 'center'}
                onValueChange={(value) => updateConfig('title.align', value)}
              >
                <SelectTrigger id="title-align">
                  <SelectValue placeholder="Allineamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sinistra</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Assi */}
            <div>
              <Label htmlFor="x-axis-title">Titolo Asse X</Label>
              <Input
                id="x-axis-title"
                value={config.xaxis?.title || ''}
                onChange={(e) => updateConfig('xaxis.title', e.target.value)}
                placeholder="Categorie"
              />
            </div>
            
            <div>
              <Label htmlFor="y-axis-title">Titolo Asse Y</Label>
              <Input
                id="y-axis-title"
                value={config.yaxis?.title || ''}
                onChange={(e) => updateConfig('yaxis.title', e.target.value)}
                placeholder="Valori"
              />
            </div>
            
            {/* Colori */}
            <div className="md:col-span-2">
              <Label htmlFor="color-palette">Schema Colori</Label>
              <Select
                value="default"
                onValueChange={handleColorPaletteChange}
              >
                <SelectTrigger id="color-palette">
                  <SelectValue placeholder="Schema colori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="pastel">Pastello</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="monochrome">Monocromatico</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex mt-2 space-x-2">
                {(config.colors || colorPalettes.default).map((color, index) => (
                  <div 
                    key={index} 
                    style={{ backgroundColor: color }} 
                    className="w-6 h-6 rounded-full"
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Legenda */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-legend">Mostra Legenda</Label>
                <Switch
                  id="show-legend"
                  checked={config.legend?.show !== false}
                  onCheckedChange={(checked) => updateConfig('legend.show', checked)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="legend-position">Posizione Legenda</Label>
              <Select
                value={config.legend?.position || 'bottom'}
                onValueChange={(value) => updateConfig('legend.position', value)}
              >
                <SelectTrigger id="legend-position">
                  <SelectValue placeholder="Posizione legenda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Sopra</SelectItem>
                  <SelectItem value="right">Destra</SelectItem>
                  <SelectItem value="bottom">Sotto</SelectItem>
                  <SelectItem value="left">Sinistra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tooltip e animazioni */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-tooltip">Mostra Tooltip</Label>
                <Switch
                  id="show-tooltip"
                  checked={config.tooltip?.enabled !== false}
                  onCheckedChange={(checked) => updateConfig('tooltip.enabled', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-animations">Animazioni</Label>
                <Switch
                  id="show-animations"
                  checked={config.animations?.enabled !== false}
                  onCheckedChange={(checked) => updateConfig('animations.enabled', checked)}
                />
              </div>
            </div>
            
            {/* Griglia */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-grid">Mostra Griglia</Label>
                <Switch
                  id="show-grid"
                  checked={config.grid?.show !== false}
                  onCheckedChange={(checked) => updateConfig('grid.show', checked)}
                />
              </div>
            </div>
            
            {/* Data labels */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-data-labels">Etichette Dati</Label>
                <Switch
                  id="show-data-labels"
                  checked={config.dataLabels?.enabled === true}
                  onCheckedChange={(checked) => updateConfig('dataLabels.enabled', checked)}
                />
              </div>
            </div>
            
            {/* Spessore linee (per grafici lineari) */}
            {['line', 'area'].includes(chartType) && (
              <>
                <div>
                  <Label htmlFor="stroke-width">Spessore Linea</Label>
                  <Input
                    id="stroke-width"
                    type="number"
                    value={config.stroke?.width || 2}
                    onChange={(e) => updateConfig('stroke.width', parseInt(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="stroke-curve">Stile Linea</Label>
                  <Select
                    value={config.stroke?.curve || 'smooth'}
                    onValueChange={(value) => updateConfig('stroke.curve', value)}
                  >
                    <SelectTrigger id="stroke-curve">
                      <SelectValue placeholder="Stile linea" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smooth">Arrotondata</SelectItem>
                      <SelectItem value="straight">Dritta</SelectItem>
                      <SelectItem value="stepline">A gradini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {/* Tema */}
            <div>
              <Label htmlFor="theme-mode">Tema</Label>
              <Select
                value={config.theme?.mode || 'light'}
                onValueChange={(value) => updateConfig('theme.mode', value)}
              >
                <SelectTrigger id="theme-mode">
                  <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Chiaro</SelectItem>
                  <SelectItem value="dark">Scuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ChartPreview;
