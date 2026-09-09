import React from 'react';
import { Gamepad2, Smartphone, Laptop, Monitor, Wrench, Microwave, Shirt, Footprints, Car, Dog, Sparkles } from 'lucide-react';

interface Props {
  activeCategory: string;
  onSelectCategory: (categoryQuery: string) => void;
}

export const CATEGORIES = [
  { id: 'all', label: 'Todas las Categorías', icon: Sparkles, slug: '' },
  { id: 'fashion', label: 'Ropa, Calzado & Moda', icon: Shirt, slug: 'ropa-y-calzado' },
  { id: 'gaming', label: 'Consolas & Videojuegos', icon: Gamepad2, slug: 'consolas-y-videojuegos' },
  { id: 'electronics', label: 'Electrónica, Audio & TV', icon: Monitor, slug: 'electronica-audio-y-video' },
  { id: 'appliances', label: 'Línea Blanca & Cocina', icon: Microwave, slug: 'electrodomesticos' },
  { id: 'smartphones', label: 'Celulares & Telefonía', icon: Smartphone, slug: 'celulares-y-telefonia' },
  { id: 'laptops', label: 'Laptops & Computación', icon: Laptop, slug: 'computacion' },
  { id: 'tools', label: 'Herramientas', icon: Wrench, slug: 'herramientas' },
  { id: 'pets', label: 'Mascotas', icon: Dog, slug: 'mascotas' },
];

export const CategoryChips: React.FC<Props> = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className="bg-stone-100/60 border-b border-stone-200 py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = (activeCategory || '').toLowerCase() === cat.slug.toLowerCase();

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
