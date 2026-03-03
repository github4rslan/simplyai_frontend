
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';

interface QuestionSaveConfirmationProps {
  mode: 'draft' | 'submit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const QuestionSaveConfirmation: React.FC<QuestionSaveConfirmationProps> = ({
  mode,
  open,
  onOpenChange,
  onConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'draft' ? 'Save as Draft' : 'Submit questionnaire'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {mode === 'draft' ? (
            <p className="text-sm text-gray-700 leading-relaxed">
              Saving as a draft saves all completed answers, allowing you to pause the questionnaire and resume it later, editing some of them.
            </p>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">WARNING:</span> The Submit button permanently saves the questionnaire and allows the final report to be generated. Confirm only if you are sure all answers are correct, as this action cannot be undone. Otherwise, save as draft to pause the questionnaire and make changes later.
            </p>
          )}
        </div>
        
        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            variant={mode === 'draft' ? 'outline' : 'default'}
            className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white"
          >
            {mode === 'draft' ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Confirm save as draft
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Confirm questionnaire submission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionSaveConfirmation;
