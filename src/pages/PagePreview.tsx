
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PagePreview = () => {
  const { id } = useParams();
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In un'implementazione reale, qui recupereremmo i dati della pagina dal server
    setLoading(true);
    
    // Qui simuliamo il recupero dei dati
    setTimeout(() => {
      const pages = [
        { 
          id: 'home', 
          title: 'Home Page', 
          content: '<h1>Benvenuto</h1><p>Questa è la home page del sito.</p><img src="https://picsum.photos/800/400" alt="Immagine di esempio" /><p>SimolyAI offre strumenti avanzati per l\'analisi dei dati e la creazione di report interattivi.</p>' 
        },
        { 
          id: 'about', 
          title: 'Chi Siamo', 
          content: '<h1>Chi Siamo</h1><p>SimolyAI è un\'azienda innovativa nel campo dell\'intelligenza artificiale.</p><div class="team-section"><img src="https://picsum.photos/200/200" alt="Team member" /><h3>Mario Rossi</h3><p>CEO & Founder</p></div>' 
        },
        { 
          id: 'contact', 
          title: 'Contatti', 
          content: '<h1>Contattaci</h1><p>Siamo disponibili per qualsiasi informazione.</p><form><div><label>Nome:</label><input type="text" /></div><div><label>Email:</label><input type="email" /></div><div><label>Messaggio:</label><textarea></textarea></div><button>Invia</button></form>' 
        },
        { 
          id: 'guide', 
          title: 'Guida', 
          content: '<h1>Guida Utente</h1><p>Ecco come utilizzare i nostri servizi:</p><ol><li>Registrati sul sito</li><li>Compila il questionario iniziale</li><li>Visualizza i tuoi report personalizzati</li></ol>' 
        }
      ];
      
      const page = pages.find(p => p.id === id);
      if (page) {
        setPageContent(page);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-10">Caricamento anteprima...</div>;
  }

  if (!pageContent) {
    return <div className="flex justify-center p-10">Pagina non trovata</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-gray-100 p-4 mb-6 rounded flex justify-between items-center">
        <span>Anteprima della pagina: <strong>{pageContent.title}</strong></span>
        <button 
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Chiudi anteprima
        </button>
      </div>
      
      <div 
        className="bg-white p-8 rounded-lg shadow-md"
        dangerouslySetInnerHTML={{ __html: pageContent.content }}
      />
    </div>
  );
};

export default PagePreview;
