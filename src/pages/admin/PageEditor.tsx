/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-var */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import PageEditorToolbar from "@/components/admin/PageEditorToolbar";
import { Edit, Trash2, Plus, Save, Eye, CloudFog } from "lucide-react";
import { fetchPageData, savePageData } from "@/services/pagesService";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import ReactDOMServer from "react-dom/server";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

var allPages = [
  {
    id: "home",
    title: "Home",
    menuTitle: "Home",
    content:
      "<h1>Benvenuti in SimplyAI</h1><p>La piattaforma intelligente per l'analisi dei dati aziendali</p>",
    inMainMenu: true,
    order: 1,
  },
  {
    id: "about",
    title: "Chi Siamo",
    menuTitle: "Chi Siamo",
    content:
      "<h1>Chi Siamo</h1><p>SimplyAI è una piattaforma innovativa che utilizza l'intelligenza artificiale per analizzare i dati della tua azienda e fornire report dettagliati e insights preziosi.</p>",
    inMainMenu: true,
    order: 2,
  },
  {
    id: "guide",
    title: "Guida",
    menuTitle: "Guida",
    content:
      "<h1>Guida all'uso</h1><p>Benvenuti alla guida per l'utilizzo della piattaforma SimplyAI.</p>",
    inMainMenu: true,
    order: 3,
  },
  {
    id: "contact",
    title: "Contatti",
    menuTitle: "Contatti",
    content:
      "<h1>Contattaci</h1><p>Siamo qui per aiutarti. Compila il modulo sottostante per metterti in contatto con noi.</p>",
    inMainMenu: true,
    order: 4,
  },
  {
    id: "pricing",
    title: "Prezzi",
    menuTitle: "Prezzi",
    content:
      "<h1>I nostri piani</h1><p>Scegli il piano più adatto alle tue esigenze.</p>",
    inMainMenu: true,
    order: 5,
  },
];

const PageEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(allPages);
  const [currentPage, setCurrentPage] = useState(allPages[0]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDialog, setNewPageDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [filterMainMenu, setFilterMainMenu] = useState(false);
  const [filteredPages, setFilteredPages] = useState(allPages);

  //fetch page content from backend
  useEffect(() => {
    const fetchPages = async () => {
      const updatedPages = await Promise.all(
        allPages.map(async (page) => {
          try {
            const data = await fetchPageData(page.id);
            if (data) {
              return { ...page, content: data?.content }; // overwrite with DB content
            }
            return page;
          } catch (err) {
            console.error("Error fetching page:", page.id, err);
            return page;
          }
        })
      );

      setPages(updatedPages);
      setCurrentPage(updatedPages[0]);
    };

    fetchPages();
  }, []);
  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const editor = document.getElementById(`wysiwyg-editor-${currentPage.id}`);
    if (editor && currentPage) {
      editor.innerHTML = currentPage.content;
    }
  }, [currentPage.id]);
  const handleSave = () => {
    const editorContent =
      document.getElementById(`wysiwyg-editor-${currentPage.id}`)?.innerHTML ||
      "";

    console.log("Saving content for page:", currentPage.id);

    const updatedPages = pages.map((page) =>
      page.id === currentPage.id ? { ...page, content: editorContent } : page
    );

    setPages(updatedPages);
    setCurrentPage({ ...currentPage, content: editorContent });

    savePageDataDB(currentPage.id, currentPage.title, editorContent);

    toast({
      title: "Pagina salvata",
      description: `La pagina "${currentPage.title}" è stata salvata con successo.`,
    });
  };

  // Save page content to backend
  const savePageDataDB = async (id: string, title: string, content: string) => {
    const response = await savePageData({
      id: id,
      title: title,
      content: content,
    });
    return response;
  };

  const handleAddPage = () => {
    if (!newPageTitle.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo della pagina non può essere vuoto",
        variant: "destructive",
      });
      return;
    }

    const newId = newPageTitle.toLowerCase().replace(/\s+/g, "-");
    if (pages.some((page) => page.id === newId)) {
      toast({
        title: "Errore",
        description: "Esiste già una pagina con questo titolo",
        variant: "destructive",
      });
      return;
    }

    const newPage = {
      id: newId,
      title: newPageTitle,
      menuTitle: newPageTitle,
      content: `<h1>${newPageTitle}</h1><p>Contenuto della pagina ${newPageTitle}</p>`,
      inMainMenu: true,
      order: pages.length + 1,
    };

    setPages([...pages, newPage]);
    setCurrentPage(newPage);
    setNewPageTitle("");
    setNewPageDialog(false);

    toast({
      title: "Pagina creata",
      description: `La pagina "${newPageTitle}" è stata creata con successo.`,
    });
  };

  const handleInsertImage = (imageUrl: string) => {
    const baseUrl = API_BASE.replace(/\/api$/, "");
    const url = `${baseUrl}${imageUrl}`;

    const imgHtml = `<figure class="image-container">
    <img src="${url}" alt="Immagine caricata" class="max-w-full h-auto" />
  </figure>`;

    const editor = document.getElementById(`wysiwyg-editor-${currentPage.id}`);
    if (editor) {
      editor.focus();
      document.execCommand("insertHTML", false, imgHtml);
    }
  };

  // Insert heading at cursor position
  const handleInsertHeading = (level: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Create heading element
    const el = document.createElement(`h${level}`);
    el.textContent = `Nuovo titolo ${level}`;

    // Optional Tailwind styling (different sizes for H1–H6)
    switch (level) {
      case 1:
        el.className = "text-4xl font-bold my-2 text-gray-950";
        break;
      case 2:
        el.className = "text-3xl font-semibold my-2 text-gray-950";
        break;
      case 3:
        el.className = "text-2xl font-semibold my-2 text-gray-950";
        break;
      case 4:
        el.className = "text-xl font-medium my-2 text-gray-950";
        break;
      case 5:
        el.className = "text-lg font-medium my-1 text-gray-950";
        break;
      case 6:
        el.className = "text-base font-medium my-1 text-gray-950";
        break;
      default:
        el.className = "text-base my-1 text-gray-950";
        break;
    }

    // Insert heading at cursor position
    range.deleteContents(); // remove selected text if any
    range.insertNode(el); // insert new heading

    // Move cursor inside new heading so user can type immediately
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    newRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  // Insert paragraph at cursor position
  const handleInsertParagraph = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Create paragraph element
    const el = document.createElement("p");
    el.textContent = "Nuovo paragrafo";

    // Optional Tailwind styling
    el.className = "text-base my-2";

    // Insert paragraph at cursor position
    range.deleteContents();
    range.insertNode(el);

    // Move cursor inside new paragraph so user can type immediately
    const newRange = document.createRange();
    newRange.selectNodeContents(el);
    newRange.collapse(false);

    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  const handleInsertLayout = (columns: number) => {
    const editor = document.getElementById(`wysiwyg-editor-${currentPage.id}`);
    if (editor) {
      let layout = '<div class="grid grid-cols-' + columns + ' gap-4">';
      for (let i = 0; i < columns; i++) {
        layout += '<div class="col"><p>Colonna ' + (i + 1) + "</p></div>";
      }
      layout += "</div>";
      editor.innerHTML += layout;
    }
  };
  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      toast({
        title: "Errore",
        description: "Non puoi eliminare l'unica pagina rimasta",
        variant: "destructive",
      });
      return;
    }

    setPages(pages.filter((page) => page.id !== pageId));
    if (currentPage.id === pageId) {
      setCurrentPage(pages[0]);
    }

    toast({
      title: "Pagina eliminata",
      description: "La pagina è stata eliminata con successo",
    });
  };

  const handleToggleMainMenu = (pageId: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, inMainMenu: !page.inMainMenu } : page
      )
    );

    toast({
      title: "Menu aggiornato",
      description: `La pagina è stata ${
        pages.find((p) => p.id === pageId)?.inMainMenu
          ? "rimossa dal"
          : "aggiunta al"
      } menu principale.`,
    });
  };

  const handlePageOrderChange = (pageId: string, direction: "up" | "down") => {
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex < 0) return;

    const newPages = [...pages];
    const page = newPages[pageIndex];

    if (direction === "up" && pageIndex > 0) {
      const prevPage = newPages[pageIndex - 1];
      const tempOrder = page.order;
      page.order = prevPage.order;
      prevPage.order = tempOrder;
    } else if (direction === "down" && pageIndex < newPages.length - 1) {
      const nextPage = newPages[pageIndex + 1];
      const tempOrder = page.order;
      page.order = nextPage.order;
      nextPage.order = tempOrder;
    }

    newPages.sort((a, b) => a.order - b.order);
    setPages(newPages);
  };

  // on bold button click
  const onBold = () => {
    wrapSelection("strong");
  };

  // on italic button click
  const onItalic = () => {
    wrapSelection("em");
  };

  // on underline button click
  const onUnderline = () => {
    wrapSelection("u");
  };

  // Changes to the selected text
  const wrapSelection = (tag: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Extract the selected content
    const selectedContent = range.extractContents();

    // Create the new element
    const el = document.createElement(tag);
    el.appendChild(selectedContent);

    // Insert back into DOM
    range.insertNode(el);

    // Move cursor after the inserted element
    range.setStartAfter(el);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Get the parent block element of the current selection
  const getParentBlock = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode as HTMLElement | null;
    if (!node) return null;

    const editorId = `wysiwyg-editor-${currentPage.id}`;

    while (node && node.id !== editorId) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        /^(DIV|P|H[1-6]|SECTION)$/.test(node.nodeName)
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  // New Section button click
  const onNewSection = () => {
    const parentBlock = getParentBlock();
    if (!parentBlock) {
      console.warn("Nessun blocco trovato: nuova sezione aggiunta alla fine");
      const editor = document.getElementById(
        `wysiwyg-editor-${currentPage.id}`
      );
      if (editor) {
        editor.innerHTML += `<section class="py-8"><p>Nuova sezione</p></section>`;
      }
      return;
    }

    const newSection = document.createElement("section");
    newSection.innerHTML = "<p>Nuova sezione</p>";

    if (parentBlock.parentNode) {
      parentBlock.parentNode.insertBefore(newSection, parentBlock.nextSibling);
    }
  };

  useEffect(() => {
    const filteredPages = filterMainMenu
      ? pages.filter((page) => page.inMainMenu)
      : pages;
    setFilteredPages(filteredPages);
  }, [pages, filterMainMenu]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">Caricamento editor...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Editor Pagine</h1>
          <p className="text-muted-foreground mt-2">
            Modifica i contenuti delle pagine del sito
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="filter-main-menu">Solo menu principale</Label>
            <Switch
              id="filter-main-menu"
              checked={filterMainMenu}
              onCheckedChange={setFilterMainMenu}
            />
          </div>
          <Dialog open={newPageDialog} onOpenChange={setNewPageDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuova Pagina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crea nuova pagina</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="page-title">Titolo della pagina</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Inserisci il titolo della pagina"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setNewPageDialog(false)}
                >
                  Annulla
                </Button>
                <Button onClick={handleAddPage}>Crea Pagina</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anteprima della Pagina</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                [simoly_page id="{currentPage.id}"]
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue={pages[0].id} className="space-y-4">
          <TabsList className="flex overflow-x-auto pb-px">
            {filteredPages.map((page) => (
              <TabsTrigger
                key={page.id}
                value={page.id}
                onClick={() => setCurrentPage(page)}
                className="flex items-center space-x-2"
              >
                <span>{page.title}</span>
                {page.inMainMenu && (
                  <span className="ml-1 text-xs bg-[var(--color-primary-100)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full">
                    Menu
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {filteredPages.map((page) => (
            <TabsContent key={page.id} value={page.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {editingTitle && currentPage.id === page.id ? (
                      <Input
                        value={currentPage.title}
                        onChange={(e) =>
                          setCurrentPage({
                            ...currentPage,
                            title: e.target.value,
                          })
                        }
                        className="text-xl font-semibold"
                        autoFocus
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setEditingTitle(false)
                        }
                      />
                    ) : (
                      <CardTitle className="flex items-center space-x-2">
                        <span>{page.title}</span>
                        <button
                          onClick={() => setEditingTitle(true)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </CardTitle>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleMainMenu(page.id)}
                      >
                        {page.inMainMenu
                          ? "Rimuovi dal Menu"
                          : "Aggiungi al Menu"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePage(page.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    ID: {page.id} - Modifica il contenuto della pagina
                    {page.inMainMenu && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span>Posizione nel menu:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageOrderChange(page.id, "up")}
                          disabled={page.order <= 1}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <span className="text-sm font-medium">
                          {page.order}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageOrderChange(page.id, "down")}
                          disabled={
                            page.order >=
                            pages.filter((p) => p.inMainMenu).length
                          }
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <PageEditorToolbar
                      onInsertHeading={handleInsertHeading}
                      onInsertParagraph={handleInsertParagraph}
                      onInsertLayout={handleInsertLayout}
                      onInsertImage={handleInsertImage}
                      onSave={handleSave}
                      onBold={onBold}
                      onItalic={onItalic}
                      onUnderline={onUnderline}
                      onNewSection={onNewSection}
                    />

                    <div
                      key={page.id}
                      id={`wysiwyg-editor-${page.id}`} // Make ID unique per page
                      className="prose min-h-[500px] p-4 border rounded-md bg-white overflow-auto"
                      contentEditable={true}
                      dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`/page-preview/${page.id}`, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Anteprima
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Salva Pagina
                    </Button>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <Label>Titolo nel menu:</Label>
                    <Input
                      value={page.menuTitle}
                      onChange={(e) => {
                        setPages(
                          pages.map((p) =>
                            p.id === page.id
                              ? { ...p, menuTitle: e.target.value }
                              : p
                          )
                        );
                      }}
                      className="inline-block w-48"
                    />
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shortcode della Pagina</CardTitle>
          <CardDescription>
            Usa questo shortcode per includere questa pagina in un'altra pagina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
            [simoly_page id="{currentPage.id}"]
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PageEditor;
