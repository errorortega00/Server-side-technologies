import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookCard } from './BookCard';
import { Book, BookmarkPlus, BookOpen, CheckCircle, Library } from 'lucide-react';
import { cn } from '../lib/utils';

interface BookCollection {
  id: string;
  book_id: string;
  list_name: string;
  user_id: string;
  created_at: string;
  book: any; // Tipo de libro de la API de Google Books
}

interface CollectionsViewProps {
  userId: string | undefined;
  onBackToSearch: () => void;
}

export function CollectionsView({ userId, onBackToSearch }: CollectionsViewProps) {
  const [collections, setCollections] = useState<{
    'want-to-read': BookCollection[];
    'reading': BookCollection[];
    'finished': BookCollection[];
    'all': BookCollection[];
  }>({
    'want-to-read': [],
    'reading': [],
    'finished': [],
    'all': []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'want-to-read' | 'reading' | 'finished' | 'all'>('want-to-read');

  useEffect(() => {
    if (!userId) return;

    const fetchCollections = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('book_lists')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        // Organizar los libros por lista
        const booksByList: any = {
          'want-to-read': [],
          'reading': [],
          'finished': [],
          'all': []
        };

        // Obtener información detallada de cada libro usando la API de Google Books
        const bookDetailsPromises = data.map(async (item) => {
          try {
            const response = await fetch(
              `https://www.googleapis.com/books/v1/volumes/${item.book_id}`
            );
            if (!response.ok) throw new Error('Error al obtener detalles del libro');
            const bookData = await response.json();
            
            // Agregar el libro a la lista correspondiente
            booksByList[item.list_name].push({
              ...item,
              book: bookData
            });
            
            // También agregar a la lista 'all'
            booksByList['all'].push({
              ...item,
              book: bookData
            });
          } catch (error) {
            console.error('Error al obtener detalles del libro:', error);
          }
        });

        await Promise.all(bookDetailsPromises);
        setCollections(booksByList);
      } catch (error) {
        console.error('Error al cargar colecciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [userId]);

  const handleMoveBook = async (bookId: string, fromList: string, toList: string) => {
    if (!userId) return;

    try {
      // Actualizar en Supabase
      const { error } = await supabase
        .from('book_lists')
        .update({ list_name: toList })
        .eq('user_id', userId)
        .eq('book_id', bookId);

      if (error) throw error;

      // Actualizar el estado local
      setCollections(prev => {
        const updatedCollections = { ...prev };
        const bookIndex = updatedCollections[fromList as keyof typeof prev].findIndex(
          item => item.book_id === bookId
        );

        if (bookIndex !== -1) {
          const book = updatedCollections[fromList as keyof typeof prev][bookIndex];
          updatedCollections[fromList as keyof typeof prev].splice(bookIndex, 1);
          updatedCollections[toList as keyof typeof prev].push({
            ...book,
            list_name: toList
          });
        }

        return updatedCollections;
      });
    } catch (error) {
      console.error('Error al mover libro:', error);
    }
  };

  const tabClasses = (tab: string) => cn(
    "px-4 py-2 text-sm font-medium rounded-t-lg min-w-[120px] whitespace-nowrap overflow-visible",
    activeTab === tab
      ? "bg-white text-blue-600 border-b-2 border-blue-600"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  );

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'want-to-read': return <BookmarkPlus size={16} />;
      case 'reading': return <BookOpen size={16} />;
      case 'finished': return <CheckCircle size={16} />;
      case 'all': return <Library size={16} />;
      default: return null;
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Inicia sesión para ver tus colecciones</p>
        <button
            onClick={() => window.location.href = '/'}
            className="px-3 py-1 bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-500 text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Inicio
          </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Mis Colecciones</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = '/'}
            className="px-3 py-1 bg-amber-400 text-gray-900 rounded-lg hover:bg-amber-500 text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Inicio
          </button>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        {['want-to-read', 'reading', 'finished', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={tabClasses(tab)}
          >
            <div className="flex items-center gap-1 overflow-visible">
              {getTabIcon(tab)}
              <span className="overflow-visible whitespace-nowrap">
                {tab === 'want-to-read' ? 'Quiero leer' : 
                 tab === 'reading' ? 'Leyendo' : 
                 tab === 'finished' ? 'Terminados' : 'Todo'}
              </span>
              <span className="ml-1 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
                {collections[tab as keyof typeof collections].length}
              </span>
            </div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando colecciones...</p>
        </div>
      ) : collections[activeTab].length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">
            No tienes libros en esta colección.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections[activeTab].map((item) => (
            <div key={item.book_id} className="relative">
              <BookCard
                book={{
                  id: item.book_id,
                  volumeInfo: item.book.volumeInfo
                }}
                onAddToList={(listName) => {
                  if (listName !== activeTab) {
                    handleMoveBook(item.book_id, activeTab, listName);
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}