import React, { useEffect, useState } from 'react';
import { Library, BookOpen } from 'lucide-react';
import { supabase } from './lib/supabase';
import { searchBooks } from './lib/utils';
import { SearchBar } from './components/SearchBar';
import { BookCard } from './components/BookCard';
import { AuthModal } from './components/AuthModal';
import { CollectionsView } from './components/CollectionsView';
import { CategoryCarousel } from './components/CategoryCarousel';
import { BookReader } from './components/BookReader';

function App() {
  const [session, setSession] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(
    Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [view, setView] = useState('search'); // 'search' o 'collections'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const booksPerPage = 20;

  const handleBookSelect = (bookId: string) => {
    setSelectedBookId(bookId);
    setView('reader');
  };

  useEffect(() => {
    if (!supabaseReady || !supabase) return;

    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
        }
      } catch (error) {
        console.error('Error al obtener la sesión:', error);
      }
    };

    initSession();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error al suscribirse a cambios de autenticación:', error);
      return () => {};
    }
  }, [supabaseReady]);

  // Cargar libros populares al iniciar la aplicación
  useEffect(() => {
    const loadPopularBooks = async () => {
      if (!hasSearched) {
        setLoading(true);
        try {
          const { items, totalItems } = await searchBooks('*');
          setBooks(items);
          setTotalItems(totalItems);
          setCurrentQuery('*');
        } catch (error) {
          console.error('Error cargando libros populares:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadPopularBooks();
  }, [hasSearched]);

  const handleSearch = async (query: string, page = 1) => {
    setLoading(true);
    setBooks([]);
    setHasSearched(true);
    setCurrentQuery(query);
    setCurrentPage(page);
    
    try {
      const startIndex = (page - 1) * booksPerPage;
      const { items, totalItems } = await searchBooks(query, booksPerPage, startIndex);
      setBooks(items);
      setTotalItems(totalItems);
    } catch (error) {
      console.error('Error searching books:', error);
      alert(error.message || 'Error al buscar libros');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalItems / booksPerPage)) return;
    handleSearch(currentQuery, newPage);
  };

  const handleAddToList = async (bookId: string, listName: string) => {
    if (!supabaseReady) {
      alert('Please connect to Supabase first by clicking the "Connect to Supabase" button');
      return;
    }

    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const { error } = await supabase.from('book_lists').insert({
        user_id: session.user.id,
        book_id: bookId,
        list_name: listName,
      });

      if (error) {
        if (error.message.includes('duplicate key value')) {
          throw new Error('Este libro ya está en tu lista');
        } else if (error.message.includes('violates check constraint')) {
          throw new Error('Nombre de lista inválido');
        } else {
          throw error;
        }
      }
      alert('¡Libro agregado a tu lista exitosamente!');
    } catch (error) {
      console.error('Error adding book to list:', error);
      alert('Failed to add book to list');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="text-amber-400" size={32} />
              <h1 className="text-xl font-bold text-amber-300">Digital Library</h1>
            </div>
            {!supabaseReady ? (
              <div className="text-red-600">Please connect to Supabase first</div>
            ) : !session ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView(view === 'search' ? 'collections' : 'search')}
                  className="flex items-center gap-1 bg-gray-800 text-gray-100 px-3 py-1 rounded-lg hover:bg-gray-700"
                >
                  <BookOpen size={16} />
                  {view === 'search' ? 'Ver colecciones' : 'Buscar libros'}
                </button>
                <span className="text-gray-300">{session.user.email}</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-gray-400 hover:text-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'search' ? (
          <>
            <div className="flex justify-center mb-8 flex-col items-center gap-4">
              <CategoryCarousel onSelectCategory={handleSearch} />
              <SearchBar onSearch={handleSearch} />
            </div>

            {loading ? (
              <div className="text-center">Buscando libros...</div>
            ) : books.length === 0 ? (
              <div className="text-center text-gray-600">
                <h2 className="text-xl font-semibold mb-2">¡Bienvenido a Digital Bookshelf!</h2>
                <p>Usa la barra de búsqueda para encontrar tus libros favoritos.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onAddToList={(listName) => handleAddToList(book.id, listName)}
                      onBookSelect={handleBookSelect}
                    />
                  ))}
                </div>
                
                {/* Paginación */}
                {totalItems > booksPerPage && (
                  <div className="flex justify-center mt-8 gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg">
                      Página {currentPage} de {Math.ceil(totalItems / booksPerPage)}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(totalItems / booksPerPage)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <CollectionsView 
            userId={session?.user?.id} 
            onBackToSearch={() => setView('search')} 
          />
        )}
        {view === 'reader' && selectedBookId && (
          <BookReader 
            bookId={selectedBookId}
            onClose={() => {
              setView('search');
              setSelectedBookId(null);
            }}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      {selectedBookId && (
        <BookReader
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null);
            setView('search');
          }}
        />
      )}
    </div>
  );
}

export default App;