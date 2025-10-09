
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateTableDemo } from '@/services/chart-config';
import { Table as TableIcon, Settings } from 'lucide-react';

interface TableConfig {
  type: string;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  filterable?: boolean;
  width?: string;
  height?: string;
  headerStyle?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  };
  rowStyle?: {
    backgroundColor?: string;
    alternateColor?: string;
    color?: string;
  };
  borderColor?: string;
  fontSize?: string;
}

interface TablePreviewProps {
  tableType: string;
  config: TableConfig;
  onConfigChange: (config: TableConfig) => void;
}

const TablePreview: React.FC<TablePreviewProps> = ({ tableType, config, onConfigChange }) => {
  const [tableData, setTableData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    // Generate demo data based on table type
    const data = generateTableDemo(tableType);
    setTableData(data);
  }, [tableType]);

  // Update a specific config property
  const updateConfig = (property: string, value: any) => {
    onConfigChange({ ...config, [property]: value });
  };

  // Helper for nested property updates
  const updateNestedConfig = (parent: string, property: string, value: any) => {
    const updatedParent = { ...(config[parent as keyof TableConfig] as object || {}) };
    updatedParent[property as keyof typeof updatedParent] = value;
    updateConfig(parent, updatedParent);
  };

  if (!tableData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mt-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="preview">
            <TableIcon className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configurazione
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-4 overflow-auto">
          <div className="flex flex-col">
            <div 
              style={{ 
                width: config.width || '100%',
                maxHeight: config.height,
                overflowY: config.height ? 'auto' : 'visible',
                fontSize: config.fontSize
              }}
            >
              <Table>
                <TableHeader style={{ backgroundColor: config.headerStyle?.backgroundColor }}>
                  <TableRow>
                    {tableData.headers.map((header, index) => (
                      <TableHead
                        key={index}
                        style={{
                          color: config.headerStyle?.color,
                          fontWeight: config.headerStyle?.fontWeight,
                          border: config.bordered ? `1px solid ${config.borderColor || '#e2e8f0'}` : undefined
                        }}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.rows.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      style={{
                        backgroundColor: config.striped && rowIndex % 2 !== 0
                          ? config.rowStyle?.alternateColor || '#f9fafb'
                          : config.rowStyle?.backgroundColor,
                        color: config.rowStyle?.color
                      }}
                    >
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          style={{
                            border: config.bordered ? `1px solid ${config.borderColor || '#e2e8f0'}` : undefined
                          }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Questa è un'anteprima della tabella. I dati reali verranno generati in base alle risposte del questionario.
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensioni */}
            <div>
              <Label htmlFor="table-width">Larghezza</Label>
              <Input
                id="table-width"
                value={config.width || '100%'}
                onChange={(e) => updateConfig('width', e.target.value)}
                placeholder="100%"
              />
              <p className="text-xs text-muted-foreground mt-1">Usa percentuale (es. 100%) o pixel (es. 500px)</p>
            </div>
            
            <div>
              <Label htmlFor="table-height">Altezza Max</Label>
              <Input
                id="table-height"
                value={config.height || ''}
                onChange={(e) => updateConfig('height', e.target.value)}
                placeholder="auto"
              />
              <p className="text-xs text-muted-foreground mt-1">Lascia vuoto per auto o specifica in pixel (es. 400px)</p>
            </div>
            
            <div>
              <Label htmlFor="font-size">Dimensione Testo</Label>
              <Input
                id="font-size"
                value={config.fontSize || ''}
                onChange={(e) => updateConfig('fontSize', e.target.value)}
                placeholder="14px"
              />
            </div>
            
            {/* Stile */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-striped">Righe Alternate</Label>
                <Switch
                  id="table-striped"
                  checked={config.striped === true}
                  onCheckedChange={(checked) => updateConfig('striped', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-bordered">Bordi</Label>
                <Switch
                  id="table-bordered"
                  checked={config.bordered === true}
                  onCheckedChange={(checked) => updateConfig('bordered', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-hoverable">Effetto Hover</Label>
                <Switch
                  id="table-hoverable"
                  checked={config.hoverable === true}
                  onCheckedChange={(checked) => updateConfig('hoverable', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-compact">Compatta</Label>
                <Switch
                  id="table-compact"
                  checked={config.compact === true}
                  onCheckedChange={(checked) => updateConfig('compact', checked)}
                />
              </div>
            </div>
            
            {/* Funzionalità */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-sortable">Ordinabile</Label>
                <Switch
                  id="table-sortable"
                  checked={config.sortable === true}
                  onCheckedChange={(checked) => updateConfig('sortable', checked)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-filterable">Filtrabile</Label>
                <Switch
                  id="table-filterable"
                  checked={config.filterable === true}
                  onCheckedChange={(checked) => updateConfig('filterable', checked)}
                />
              </div>
            </div>
            
            {/* Paginazione */}
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="table-pagination">Paginazione</Label>
                <Switch
                  id="table-pagination"
                  checked={config.pagination === true}
                  onCheckedChange={(checked) => updateConfig('pagination', checked)}
                />
              </div>
            </div>
            
            {config.pagination && (
              <div>
                <Label htmlFor="page-size">Righe per Pagina</Label>
                <Input
                  id="page-size"
                  type="number"
                  value={config.pageSize || 10}
                  onChange={(e) => updateConfig('pageSize', parseInt(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            )}
            
            {/* Colori */}
            <div>
              <Label htmlFor="header-bg-color">Colore Sfondo Intestazione</Label>
              <Input
                id="header-bg-color"
                type="text"
                value={config.headerStyle?.backgroundColor || ''}
                onChange={(e) => updateNestedConfig('headerStyle', 'backgroundColor', e.target.value)}
                placeholder="#f1f5f9"
              />
            </div>
            
            <div>
              <Label htmlFor="header-text-color">Colore Testo Intestazione</Label>
              <Input
                id="header-text-color"
                type="text"
                value={config.headerStyle?.color || ''}
                onChange={(e) => updateNestedConfig('headerStyle', 'color', e.target.value)}
                placeholder="#1e293b"
              />
            </div>
            
            <div>
              <Label htmlFor="row-bg-color">Colore Sfondo Righe</Label>
              <Input
                id="row-bg-color"
                type="text"
                value={config.rowStyle?.backgroundColor || ''}
                onChange={(e) => updateNestedConfig('rowStyle', 'backgroundColor', e.target.value)}
                placeholder="transparent"
              />
            </div>
            
            <div>
              <Label htmlFor="row-alt-color">Colore Righe Alternate</Label>
              <Input
                id="row-alt-color"
                type="text"
                value={config.rowStyle?.alternateColor || ''}
                onChange={(e) => updateNestedConfig('rowStyle', 'alternateColor', e.target.value)}
                placeholder="#f9fafb"
              />
            </div>
            
            <div>
              <Label htmlFor="row-text-color">Colore Testo Righe</Label>
              <Input
                id="row-text-color"
                type="text"
                value={config.rowStyle?.color || ''}
                onChange={(e) => updateNestedConfig('rowStyle', 'color', e.target.value)}
                placeholder="#1e293b"
              />
            </div>
            
            <div>
              <Label htmlFor="border-color">Colore Bordi</Label>
              <Input
                id="border-color"
                type="text"
                value={config.borderColor || ''}
                onChange={(e) => updateConfig('borderColor', e.target.value)}
                placeholder="#e2e8f0"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TablePreview;
