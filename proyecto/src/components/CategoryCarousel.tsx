import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const categories = [
  { id: 'all', name: 'Todo' },
  { id: 'fantasy', name: 'Fantasía' },
  { id: 'mystery', name: 'Misterio' },
  { id: 'romance', name: 'Romance' },
  { id: 'scifi', name: 'Ciencia Ficción' },
  { id: 'history', name: 'Histórica' },
];

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
}

export function CategoryCarousel({ onSelectCategory }: CategoryCarouselProps) {
  const handleCategoryClick = (category: { id: string, name: string }) => {
    // Si es la categoría 'all', usamos un término de búsqueda que devuelva muchos resultados
    if (category.id === 'all') {
      onSelectCategory('*');
    } else {
      onSelectCategory(category.id);
    }
  };

  return (
    <div className="mb-8">
      <Swiper
        slidesPerView={'auto'}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: 3 },
          1024: { slidesPerView: 5 },
        }}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id} className="!w-fit">
            <button
              onClick={() => handleCategoryClick(category)}
              className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              {category.name}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}