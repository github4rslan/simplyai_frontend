import React from "react";
import { Button } from "@/components/ui/button";
import { Type, Image, Layout, Save, Eraser, Paintbrush } from "lucide-react";
import ImageUploader from "./ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onFontSize: (size: string) => void;
  onFontFamily: (family: string) => void;
  onTextColor: (color: string) => void;
  onHighlight: (color: string) => void;
  onBlockBg: (color: string) => void;
  onBlockPadding: (value: string) => void;
  onImageWidth: (value: string) => void;
  onClearFormatting: () => void;
}

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const fontFamilies = [
  { label: "Default", value: "inherit" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Georgia", value: "'Georgia', serif" },
  { label: "Playfair", value: "'Playfair Display', serif" },
  { label: "Courier", value: "'Courier New', monospace" },
];
const imageWidths = ["50%", "75%", "100%"];
const blockBgOptions = [
  { label: "Default", value: "inherit" },
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f5f5f5" },
  { label: "Soft Yellow", value: "#fef3c7" },
  { label: "Soft Blue", value: "#e0f2fe" },
  { label: "Ice", value: "#ecfeff" },
  { label: "Lavender", value: "#f3e8ff" },
];
const blockPaddings = ["0px", "8px", "12px", "16px", "24px", "32px"];

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
  onFontSize,
  onFontFamily,
  onTextColor,
  onHighlight,
  onBlockBg,
  onBlockPadding,
  onImageWidth,
  onClearFormatting,
}: PageEditorToolbarProps) => {
  return (
    <div className="border rounded-md p-2 bg-gray-50 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((h) => (
            <Button
              key={h}
              variant="outline"
              size="sm"
              onClick={() => onInsertHeading(h)}
            >
              H{h}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={onInsertParagraph}>
            <Type className="mr-2 h-4 w-4" />
            Paragraph
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" size="sm" onClick={onNewSection}>
            New Section
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Image className="mr-2 h-4 w-4" />
                Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert image</DialogTitle>
              </DialogHeader>
              <ImageUploader onImageUpload={onInsertImage} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => onInsertLayout(2)}>
            <Layout className="mr-2 h-4 w-4" />2 Columns
          </Button>
          <Button variant="outline" size="sm" onClick={() => onInsertLayout(3)}>
            <Layout className="mr-2 h-4 w-4" />3 Columns
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select onValueChange={onFontSize} defaultValue="16px">
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Font size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={onFontFamily} defaultValue="inherit">
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Font family" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Text</label>
            <Input
              type="color"
              defaultValue="#111111"
              className="w-12 h-9 p-1"
              onChange={(e) => onTextColor(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Highlight</label>
            <Input
              type="color"
              defaultValue="#fff7ae"
              className="w-12 h-9 p-1"
              onChange={(e) => onHighlight(e.target.value)}
            />
          </div>

          <Select onValueChange={onImageWidth} defaultValue="100%">
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Img width" />
            </SelectTrigger>
            <SelectContent>
              {imageWidths.map((w) => (
                <SelectItem key={w} value={w}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Select onValueChange={onBlockBg} defaultValue="inherit">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Block BG" />
            </SelectTrigger>
            <SelectContent>
              {blockBgOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={onBlockPadding} defaultValue="16px">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Block padding" />
            </SelectTrigger>
            <SelectContent>
              {blockPaddings.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onClearFormatting}>
            <Eraser className="mr-2 h-4 w-4" />
            Clear formatting
          </Button>
          <Button variant="outline" size="sm" onClick={() => onBlockBg("inherit")}>
            <Paintbrush className="mr-2 h-4 w-4" />
            Reset block
          </Button>
        </div>

        <div className="w-[80%] h-[2px] bg-gray-300"></div>
        <div className="flex gap-2 justify-center items-center flex-wrap">
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
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PageEditorToolbar;
