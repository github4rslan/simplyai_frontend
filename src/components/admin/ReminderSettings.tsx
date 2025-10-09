
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Bell } from 'lucide-react';

interface Reminder {
  id: string;
  daysBefore: number;
  frequency: 'once' | 'daily' | 'weekly';
  message: string;
}

interface ReminderSettingsProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

export const ReminderSettings = ({ reminders = [], onChange }: ReminderSettingsProps) => {
  // Genera un ID univoco per i nuovi promemoria
  const generateId = () => {
    return Date.now().toString();
  };

  // Aggiunge un nuovo promemoria
  const addReminder = () => {
    const newReminder: Reminder = {
      id: generateId(),
      daysBefore: 7,
      frequency: 'once',
      message: 'È il momento di completare il tuo questionario! Accedi per continuare il tuo percorso.',
    };
    
    onChange([...reminders, newReminder]);
  };

  // Rimuove un promemoria esistente
  const removeReminder = (id: string) => {
    onChange(reminders.filter(reminder => reminder.id !== id));
  };

  // Aggiorna un campo specifico di un promemoria
  const updateReminder = (id: string, field: keyof Reminder, value: any) => {
    onChange(
      reminders.map(reminder =>
        reminder.id === id ? { ...reminder, [field]: value } : reminder
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          <div className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Configurazione promemoria
          </div>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={addReminder}>
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi promemoria
        </Button>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-md">
            <p className="text-muted-foreground">Nessun promemoria configurato</p>
            <Button variant="outline" className="mt-4" onClick={addReminder}>
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi il primo promemoria
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {reminders.map((reminder, index) => (
              <Card key={reminder.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Promemoria {index + 1}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`daysBefore-${reminder.id}`}>
                        Giorni prima della scadenza
                      </Label>
                      <Input
                        id={`daysBefore-${reminder.id}`}
                        type="number"
                        min={1}
                        value={reminder.daysBefore}
                        onChange={(e) => 
                          updateReminder(reminder.id, 'daysBefore', parseInt(e.target.value) || 7)
                        }
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`frequency-${reminder.id}`}>Frequenza</Label>
                      <Select
                        value={reminder.frequency}
                        onValueChange={(value) => 
                          updateReminder(reminder.id, 'frequency', value)
                        }
                      >
                        <SelectTrigger id={`frequency-${reminder.id}`}>
                          <SelectValue placeholder="Seleziona frequenza" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Una sola volta</SelectItem>
                          <SelectItem value="daily">Ogni giorno</SelectItem>
                          <SelectItem value="weekly">Ogni settimana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`message-${reminder.id}`}>Messaggio</Label>
                    <Textarea
                      id={`message-${reminder.id}`}
                      value={reminder.message}
                      onChange={(e) => 
                        updateReminder(reminder.id, 'message', e.target.value)
                      }
                      placeholder="Inserisci il messaggio per il promemoria"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
