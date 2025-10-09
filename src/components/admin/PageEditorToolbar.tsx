import React from "react";
import { Button } from "@/components/ui/button";
import { Type, Image, Layout, Save } from "lucide-react";
import ImageUploader from "./ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PageEditorToolbarProps {
  onInsertHeading: (level: number) => void;
  onInsertParagraph: () => void;
  onInsertLayout: (columns: number) => void;
  onInsertImage: (imageUrl: string) => void;
  onSave: () => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onNewSection: () => void;
}

const PageEditorToolbar = ({
  onInsertHeading,
  onInsertParagraph,
  onInsertLayout,
  onInsertImage,
  onSave,
  onBold,
  onItalic,
  onUnderline,
  onNewSection,
}: PageEditorToolbarProps) => {
  return (
    <div className="border rounded-md p-2 bg-gray-50">
      <div className="flex flex-col flex-wrap gap-2 p-2 items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(1)}
          >
            H1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(2)}
          >
            H2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(3)}
          >
            H3
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(4)}
          >
            H4
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(5)}
          >
            H5
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onInsertHeading(6)}
          >
            H6
          </Button>
          <Button variant="outline" size="sm" onClick={onInsertParagraph}>
            <Type className="mr-2 h-4 w-4" />
            Paragrafo
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onNewSection}>
            New Section
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Image className="mr-2 h-4 w-4" />
                Immagine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inserisci immagine</DialogTitle>
              </DialogHeader>
              <ImageUploader onImageUpload={onInsertImage} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => onInsertLayout(2)}>
            <Layout className="mr-2 h-4 w-4" />2 Colonne
          </Button>
          <Button variant="outline" size="sm" onClick={() => onInsertLayout(3)}>
            <Layout className="mr-2 h-4 w-4" />3 Colonne
          </Button>
        </div>
        <div className="w-[80%] h-[2px] bg-gray-300"></div>
        <div className="flex gap-2 justify-center items-center">
          <Button
            variant="outline"
            className="bg-[var(--color-primary-300)] text-white hover:bg-[var(--color-primary)] hover:text-white transition-all duration-500"
            size="sm"
            onClick={onBold}
          >
            B
          </Button>
          <Button
            variant="outline"
            className="bg-[var(--color-primary-300)] text-white hover:bg-[var(--color-primary)] hover:text-white transition-all duration-500"
            size="sm"
            onClick={onItalic}
          >
            I
          </Button>
          <Button
            variant="outline"
            className="bg-[var(--color-primary-300)] text-white hover:bg-[var(--color-primary)] hover:text-white transition-all duration-500"
            size="sm"
            onClick={onUnderline}
          >
            U
          </Button>
          <Button onClick={onSave} className="ml-auto">
            <Save className="mr-2 h-4 w-4" />
            Salva Modifiche
          </Button>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default PageEditorToolbar;
