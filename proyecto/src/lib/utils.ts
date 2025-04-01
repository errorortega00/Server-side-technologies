import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function searchBooks(query: string, maxResults: number = 20, startIndex: number = 0) {
  if (!query.trim()) {
    throw new Error('Por favor ingresa un término de búsqueda');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}`
    );

    if (!response.ok) {
      throw new Error(`Error en la búsqueda: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Respuesta inválida del servidor');
    }

    if (!Array.isArray(data.items)) {
      console.error('No se encontraron resultados:', data);
      return { items: [], totalItems: data.totalItems || 0 };
    }

    return { 
      items: data.items, 
      totalItems: data.totalItems || data.items.length 
    };
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    throw error;
  }
}