import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookReaderProps {
  bookId: string;
  onClose: () => void;
}

const MAX_CONTENT_LENGTH = 5000;

export function BookReader({ bookId, onClose }: BookReaderProps) {
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [bookTitle, setBookTitle] = useState('');

  useEffect(() => {
    const fetchBookContent = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${import.meta.env.VITE_GOOGLE_BOOKS_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error('No se pudo obtener el contenido del libro');
        }

        const data = await response.json();
        
        if (!data.volumeInfo) {
          throw new Error('Datos del libro no disponibles');
        }
        const bookData = data.volumeInfo;
        
        setBookTitle(bookData.title);
        
        let textContent = '';
        
        // Información básica
        // Encabezado principal
        if (bookData.title) {
          textContent += `# ${bookData.title}\n\n`;
          if (bookData.subtitle) textContent += `## ${bookData.subtitle}\n\n`;
        }

        // Metadatos en lista
        const metadata = [
          bookData.authors?.length && `**Autores:** ${bookData.authors.join(', ')}`,
          bookData.publishedDate && `**Publicación:** ${bookData.publishedDate}`,
          bookData.publisher && `**Editorial:** ${bookData.publisher}`,
          bookData.categories?.length && `**Categorías:** ${bookData.categories.join(', ')}`,
          bookData.pageCount && `**Páginas:** ${bookData.pageCount}`
        ].filter(Boolean).join('  \n');

        if (metadata) textContent += `${metadata}\n\n`;
        
        // Descripción y contenido
        // Descripción formateada
        if (bookData.description) {
          // Limpiar HTML y formatear saltos de línea
          const cleanDescription = bookData.description
            .replace(/<[^>]+>/g, '')
            .replace(/\n{2,}/g, '\n\n');
          
          textContent += `## Descripción\n\n${cleanDescription}\n\n`;
        }
        
        // Enlaces adicionales
        if (bookData.previewLink) textContent += `\n\nPreview: ${bookData.previewLink}`;
        if (bookData.infoLink) textContent += `\nMás información: ${bookData.infoLink}`;

        if (textContent.length > MAX_CONTENT_LENGTH) {
          // Dividir en párrafos antes de truncar
        const paragraphs = textContent.split(/\n\n+|\n(?=\S)/);
        let truncatedContent = '';
        
        for (const paragraph of paragraphs) {
          if ((truncatedContent + paragraph).length > MAX_CONTENT_LENGTH) break;
          truncatedContent += paragraph + '\n\n';
        }
        textContent = truncatedContent.trim() + '...';
        }

        const formattedContent = textContent
          .split(/\n{2,}/)
          .map(p => p.replace(/\n+/g, ' ').trim())
          .filter(p => p.length > 0);

        if (formattedContent.length === 0) {
          formattedContent.push('Contenido no disponible para este libro.');
        }

        setPages(formattedContent);
        setCurrentPage(0);
      } catch (err) {
        setError('Error al cargar el contenido del libro');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookContent();
  }, [bookId]);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, pages.length - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
        <div className="bg-gray-900 p-6 rounded-lg text-center">
          <BookOpen className="animate-pulse text-amber-400 mx-auto mb-4" size={32} />
          <p className="text-amber-300">Cargando contenido del libro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
        <div className="bg-gray-900 p-6 rounded-lg text-center max-w-md">
          <X className="text-red-500 mx-auto mb-4" size={32} />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Volver a la biblioteca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col">
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-amber-300 truncate max-w-2xl">
          {bookTitle}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 p-2 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {pages[currentPage] && (
            <div className="text-gray-100 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-amber-300 [&>h2]:text-xl [&>h2]:text-amber-200 [&>strong]:text-amber-400">
              {pages[currentPage]}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={32} />
        </button>

        <span className="text-amber-300">
          Página {currentPage + 1} de {pages.length}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === pages.length - 1}
          className="text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}