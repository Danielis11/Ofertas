import React, { useState } from 'react';
import { Tag, Check, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';

export type BrandCategoryGroup = 'all' | 'tech' | 'fashion' | 'home';

export interface BrandInfo {
  name: string;
  normalizedKey: string;
  defaultCount: number;
  categoryHint: string;
  group: BrandCategoryGroup;
  renderLogo: (isSelected: boolean) => React.ReactNode;
}

export const TOP_BRANDS: BrandInfo[] = [
  // TECNOLOGÍA & VIDEOJUEGOS
  {
    name: 'Apple',
    normalizedKey: 'apple',
    defaultCount: 122,
    categoryHint: 'iPhone, Mac & AirPods',
    group: 'tech',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 170 170" className={`h-4 w-auto shrink-0 ${isSelected ? 'fill-white' : 'fill-slate-900'}`}>
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.78-7.93-12.28-14.56-6.08-9.04-10.9-19.53-14.47-31.47-3.57-11.94-5.36-23.01-5.36-33.22 0-14.54 3.75-26.68 11.24-36.42 7.49-9.74 16.94-14.73 28.36-14.98 4.93 0 10.4 1.34 16.42 4.02 6.02 2.68 9.94 4.07 11.77 4.17 1.45 0 5.48-1.46 12.09-4.39 6.61-2.93 12.18-4.24 16.71-3.93 12.5.8 22.42 5.67 29.76 14.61-10.93 6.63-16.27 15.65-16.02 27.05.25 9.07 3.72 16.66 10.42 22.77 6.7 6.11 14.72 9.47 24.06 10.08-2.14 6.46-4.8 13.04-7.98 19.74zM119.22 33.64c0-7.39 2.64-14.28 7.92-20.67 5.28-6.39 11.79-10.37 19.53-11.94.13 1.02.2 1.95.2 2.78 0 7.33-2.73 14.36-8.19 21.08-5.46 6.72-12.03 10.59-19.71 11.61-.13-.76-.2-1.72-.2-2.86z" />
      </svg>
    ),
  },
  {
    name: 'Samsung',
    normalizedKey: 'samsung',
    defaultCount: 303,
    categoryHint: 'Galaxy, Pantallas & Línea Blanca',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 100 36" className="h-4 w-auto shrink-0">
        <ellipse cx="50" cy="18" rx="48" ry="16" fill="#034EA2" />
        <text x="50" y="23" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11.5" textAnchor="middle" letterSpacing="1.2">SAMSUNG</text>
      </svg>
    ),
  },
  {
    name: 'Sony',
    normalizedKey: 'sony',
    defaultCount: 304,
    categoryHint: 'Audio, Cámaras & Bravia',
    group: 'tech',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 100 24" className={`h-3 w-auto shrink-0 ${isSelected ? 'fill-white' : 'fill-slate-900'}`}>
        <path d="M12.8 5.6c-.6-.7-1.5-1.1-2.6-1.1-2 0-3.3 1.2-3.3 2.7 0 3.7 9.1 2.3 9.1 8.5 0 3.4-2.8 5.4-6.8 5.4-2.7 0-4.9-.9-6.3-2.3l1.3-2.7c1.1 1.2 3 2.1 4.9 2.1 2.1 0 3.6-1 3.6-2.6 0-3.9-9.1-2.4-9.1-8.5 0-3.1 2.5-5.3 6.3-5.3 2.1 0 4.1.7 5.2 1.8l-2.3 2zM33.6 2.5c6 0 10.3 4.2 10.3 9.4s-4.3 9.4-10.3 9.4-10.3-4.2-10.3-9.4 4.3-9.4 10.3-9.4zm0 15.8c4 0 6.8-2.8 6.8-6.4s-2.8-6.4-6.8-6.4-6.8 2.8-6.8 6.4 2.8 6.4 6.8 6.4zM67.8 2.8v18H64L51.3 6.7v14.1h-3.3v-18h3.8L64.5 17V2.8h3.3zM79.2 13.5l-6.7-10.7h3.8l4.7 7.8 4.7-7.8h3.8l-6.7 10.7v7.3h-3.6v-7.3z" />
      </svg>
    ),
  },
  {
    name: 'Nintendo',
    normalizedKey: 'nintendo',
    defaultCount: 241,
    categoryHint: 'Switch & Videojuegos',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 110 36" className="h-4 w-auto shrink-0">
        <rect x="2" y="2" width="106" height="32" rx="16" fill="none" stroke="#E60012" strokeWidth="3" />
        <text x="55" y="23" fill="#E60012" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" letterSpacing="0.8">Nintendo</text>
      </svg>
    ),
  },
  {
    name: 'PlayStation',
    normalizedKey: 'playstation',
    defaultCount: 98,
    categoryHint: 'PS5, Juegos & DualSense',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 60 46" className="h-4.5 w-auto shrink-0">
        <path d="M26.5 2C24.6 2.6 23.3 4.3 23.3 6.4V30L29.3 32V11.7C30.7 12.3 31.6 13.6 31.6 15.1C31.6 16.7 30.4 18 28.8 18.2L29.6 21.2C33.2 20.6 35.7 17.8 35.7 14.5C35.7 10.7 33 7.6 29.3 7V3.5L26.5 2Z" fill="#003791" />
        <path d="M16 32C9.5 34.3 5.5 36.8 5.5 39.5C5.5 43.8 16.2 46 29.5 46C42.8 46 53.5 43.8 53.5 39.5C53.5 36.8 49.5 34.3 43 32L39.5 35.5C44.5 37.2 47.5 38.9 47.5 40.5C47.5 42.6 39.4 44.5 29.5 44.5C19.6 44.5 11.5 42.6 11.5 40.5C11.5 38.9 14.5 37.2 19.5 35.5L16 32Z" fill="#003791" opacity="0.85" />
      </svg>
    ),
  },
  {
    name: 'Xiaomi',
    normalizedKey: 'xiaomi',
    defaultCount: 190,
    categoryHint: 'Smartphones & Ecosistema',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 44 44" className="h-4 w-auto shrink-0">
        <rect width="44" height="44" rx="10" fill="#FF6900" />
        <path d="M13 15h3.6v14H13V15zm6.8 0h3.6v6.2c0 2.2 1.3 3.6 3.2 3.6 1.9 0 3.2-1.4 3.2-3.6V15h3.6v6.4c0 4.3-2.7 7-6.8 7s-6.8-2.7-6.8-7V15zm10.8 10.4h3.6V29h-3.6v-3.6z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: 'Motorola',
    normalizedKey: 'motorola',
    defaultCount: 268,
    categoryHint: 'Smartphones & Edge',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 44 44" className="h-4 w-auto shrink-0">
        <circle cx="22" cy="22" r="21" fill="#001489" />
        <path d="M10 29.5C13.2 16.8 17.5 16.5 22 22.8C26.5 16.5 30.8 16.8 34 29.5C30.2 23.2 26.5 23.8 22 28.2C17.5 23.8 13.8 23.2 10 29.5Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: 'HP',
    normalizedKey: 'hp',
    defaultCount: 128,
    categoryHint: 'Laptops, Omen & Monitores',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 44 44" className="h-4 w-auto shrink-0">
        <circle cx="22" cy="22" r="21" fill="#0096D6" />
        <path d="M15 32l6-20h3.8l-2.4 8h4.5c4.5 0 7.2 2.6 5.8 7.2-1.3 4.2-5 7-9.5 7h-8.2zm6.2-4h3.6c2.5 0 4.8-1.5 5.5-3.8.7-2.3-.6-3.8-3.1-3.8h-3.8l-2.2 7.6z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: 'Lenovo',
    normalizedKey: 'lenovo',
    defaultCount: 106,
    categoryHint: 'ThinkPad & Legion Gaming',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 80 26" className="h-3.5 w-auto shrink-0">
        <rect width="80" height="26" fill="#E2231A" />
        <text x="40" y="18" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" letterSpacing="0.5">Lenovo</text>
      </svg>
    ),
  },
  {
    name: 'ASUS',
    normalizedKey: 'asus',
    defaultCount: 109,
    categoryHint: 'ROG, TUF & ZenBook',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 80 26" className="h-3.5 w-auto shrink-0">
        <path d="M5.5 22L13 3h5.5l7.5 19h-5.2l-1.8-5h-9l-1.8 5H5.5zm11-8.5l-2.8-8-2.8 8h5.6zm13.8 3.8c1.2.8 2.8 1.4 4.5 1.4 2.2 0 3.5-.9 3.5-2.2 0-3.2-8.5-1.5-8.5-7.5 0-3.2 2.6-5.5 6.8-5.5 2.2 0 4 .6 5.2 1.5l-1.5 3.2c-1-.7-2.2-1.2-3.7-1.2-2 0-3.1.9-3.1 2 0 3.2 8.5 1.6 8.5 7.5 0 3.4-2.8 5.6-7.2 5.6-2.5 0-4.8-.8-6.2-1.9l1.7-2.9zm17.5-13.8h4.8v11.8c0 2.8 1.5 4.2 3.8 4.2 2.3 0 3.8-1.4 3.8-4.2V3.5h4.8v11.5c0 5.8-3.8 8.8-8.6 8.8s-8.6-3-8.6-8.8V3.5zm22.5 13.8c1.2.8 2.8 1.4 4.5 1.4 2.2 0 3.5-.9 3.5-2.2 0-3.2-8.5-1.5-8.5-7.5 0-3.2 2.6-5.5 6.8-5.5 2.2 0 4 .6 5.2 1.5l-1.5 3.2c-1-.7-2.2-1.2-3.7-1.2-2 0-3.1.9-3.1 2 0 3.2 8.5 1.6 8.5 7.5 0 3.4-2.8 5.6-7.2 5.6-2.5 0-4.8-.8-6.2-1.9l1.7-2.9z" fill="#00539B" />
      </svg>
    ),
  },
  {
    name: 'LG',
    normalizedKey: 'lg',
    defaultCount: 96,
    categoryHint: 'OLED, UltraGear & Línea Blanca',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 44 44" className="h-4 w-auto shrink-0">
        <circle cx="22" cy="22" r="21" fill="#A50034" />
        <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
        <path d="M22 13v10h7M34 22c0 6.6-5.4 12-12 12s-12-5.4-12-12 5.4-12 12-12c3.5 0 6.6 1.5 8.8 3.8" stroke="#FFFFFF" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Dell',
    normalizedKey: 'dell',
    defaultCount: 56,
    categoryHint: 'Alienware & XPS Laptops',
    group: 'tech',
    renderLogo: () => (
      <svg viewBox="0 0 44 44" className="h-4 w-auto shrink-0">
        <circle cx="22" cy="22" r="20" fill="none" stroke="#007DB8" strokeWidth="3" />
        <text x="22" y="27" fill="#007DB8" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" letterSpacing="-0.5">DELL</text>
      </svg>
    ),
  },

  // MODA, SNEAKERS & SPORT
  {
    name: 'Nike',
    normalizedKey: 'nike',
    defaultCount: 125,
    categoryHint: 'Sneakers, Air Max & Running',
    group: 'fashion',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 100 36" className={`h-3.5 w-auto shrink-0 ${isSelected ? 'fill-white' : 'fill-slate-900'}`}>
        <path d="M98.5 2.1c-13.6 5.8-38.3 16.9-52.6 23.4-12.8 5.8-23.7 7.2-29.8 4.2-4.8-2.3-6.5-7.4-4.8-13.7 1.4-5.2 5.1-10.7 10.2-15-5.9 3.2-10.1 7.8-11.9 13.4-2.8 8.6.1 16.6 7.6 20.3 8.3 4.1 21.8 1.4 37.6-7.3 17.5-9.6 43.7-25.3 43.7-25.3z" />
      </svg>
    ),
  },
  {
    name: 'Adidas',
    normalizedKey: 'adidas',
    defaultCount: 507,
    categoryHint: 'Originals, Samba & Ultraboost',
    group: 'fashion',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 100 65" className={`h-4 w-auto shrink-0 ${isSelected ? 'fill-white' : 'fill-slate-900'}`}>
        <polygon points="12,60 29,60 14,28 0,42" />
        <polygon points="36,60 53,60 32,15 19,25" />
        <polygon points="60,60 77,60 50,2 37,11" />
      </svg>
    ),
  },
  {
    name: 'New Era',
    normalizedKey: 'new era',
    defaultCount: 1019,
    categoryHint: 'Gorras 59FIFTY & MLB',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 54 36" className="h-4 w-auto shrink-0 shadow-2xs">
        <rect width="54" height="36" rx="4" fill="#000000" />
        <path d="M12 9h4.5l8.5 13.5V9h4v18h-4.5L16 13.5V27h-4V9zm18 0h12v3.5h-8v3.5h7v3.5h-7v4h8V27H30V9z" fill="#FFFFFF" />
        <polygon points="44,9 49,9 46,15" fill="#D4AF37" />
      </svg>
    ),
  },
  {
    name: 'Tommy Hilfiger',
    normalizedKey: 'tommy hilfiger',
    defaultCount: 579,
    categoryHint: 'Moda, Chamarras & Accesorios',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 60 36" className="h-3.5 w-auto shrink-0 shadow-2xs rounded-xs">
        <rect width="60" height="10" fill="#001740" />
        <rect y="10" width="30" height="16" fill="#FFFFFF" />
        <rect x="30" y="10" width="30" height="16" fill="#CC0C2F" />
        <rect y="26" width="60" height="10" fill="#001740" />
      </svg>
    ),
  },
  {
    name: "Levi's",
    normalizedKey: 'levis',
    defaultCount: 439,
    categoryHint: 'Jeans 501, Ropa & Chamarras',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 100 44" className="h-3.5 w-auto shrink-0">
        <path d="M0 0h100v28c-25 15-50 0-50 0s-25 15-50 0V0z" fill="#E41E26" />
        <text x="50" y="20" fill="#FFFFFF" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" letterSpacing="0.8">LEVI'S</text>
      </svg>
    ),
  },
  {
    name: 'Vans',
    normalizedKey: 'vans',
    defaultCount: 419,
    categoryHint: 'Old Skool, Sk8-Hi & Ropa',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 100 36" className="h-4 w-auto shrink-0">
        <rect width="100" height="36" rx="4" fill="#C41230" />
        <text x="50" y="25" fill="#FFFFFF" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="16" textAnchor="middle" letterSpacing="1.8">VANS</text>
      </svg>
    ),
  },
  {
    name: 'Guess',
    normalizedKey: 'guess',
    defaultCount: 513,
    categoryHint: 'Bolsas, Relojes & Denim',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 54 48" className="h-4.5 w-auto shrink-0">
        <polygon points="27,46 3,4 51,4" fill="#FFFFFF" stroke="#E60026" strokeWidth="4" strokeLinejoin="round" />
        <text x="27" y="20" fill="#E60026" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="8.5" textAnchor="middle" letterSpacing="1.2">GUESS</text>
        <text x="27" y="34" fill="#E60026" fontFamily="Arial Black, Impact, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle">?</text>
      </svg>
    ),
  },
  {
    name: 'Puma',
    normalizedKey: 'puma',
    defaultCount: 90,
    categoryHint: 'Tenis, Training & Futbol',
    group: 'fashion',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 100 48" className={`h-4 w-auto shrink-0 ${isSelected ? 'fill-white' : 'fill-slate-900'}`}>
        <path d="M85 8c-3 1.5-6.5 4-8.5 6-1.5 1.5-4 4.5-5 6.5-.5.5-1 1-1.5 1s-2-2-3.5-4c-2.5-3.5-4.5-5.5-6.5-6.5-4-2.5-8.5-3-12.5-1.5-5.5 1.5-10.5 6.5-12.5 12-1 2.5-1 3.5-1 7 .5 5 2 9 5.5 12.5 2 2 3 2.5 5.5 3.5 3 1 6.5 1 9.5 0 1.5-.5 3.5-2 5-3.5 1.5-1.5 2-1.5 2.5-.5.5 1 2 3 3.5 4 2 2 5.5 3 9 3 5 0 9.5-2.5 12.5-7 1.5-2 2.5-4.5 3-8 .5-2 .5-5 0-7-.5-2.5-2-5.5-4-8-1-1.5-2-2.5-2-3s2-2 4-3.5c3.5-2.5 6.5-4 9-4 2 0 3.5.5 5 1.5 1 1.5 1.5 3 1 5.5-.5 2-1.5 4.5-3.5 7.5-1.5 2-2 2.5-2 3.5 0 1 2 3 3.5 4 2.5 1 5.5.5 7.5-1.5 1.5-1.5 3-4 3.5-7 .5-3 .5-5.5-.5-8-1-3-4-5-7.5-6-2-.5-4.5 0-6.5 1.5z" />
      </svg>
    ),
  },
  {
    name: 'Reebok',
    normalizedKey: 'reebok',
    defaultCount: 84,
    categoryHint: 'Club C, Nano & Calzado',
    group: 'fashion',
    renderLogo: () => (
      <svg viewBox="0 0 88 32" className="h-4 w-auto shrink-0">
        <rect width="88" height="32" rx="4" fill="#002D62" />
        <text x="44" y="21" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" textAnchor="middle" letterSpacing="1.2">Reebok</text>
        <polygon points="76,8 84,8 80,14" fill="#E21B23" />
      </svg>
    ),
  },
  {
    name: 'Under Armour',
    normalizedKey: 'under armour',
    defaultCount: 30,
    categoryHint: 'Ropa Compresiva & Running',
    group: 'fashion',
    renderLogo: (isSelected) => (
      <svg viewBox="0 0 52 40" className={`h-3.5 w-auto shrink-0 ${isSelected ? 'fill-white stroke-white' : 'fill-slate-900 stroke-slate-900'}`}>
        <path d="M14 6C14 18 38 18 38 6M14 34C14 22 38 22 38 34" fill="none" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // HOGAR & ESTILO DE VIDA
  {
    name: 'Miniso',
    normalizedKey: 'miniso',
    defaultCount: 508,
    categoryHint: 'Hogar, Accesorios & Juguetes',
    group: 'home',
    renderLogo: () => (
      <svg viewBox="0 0 46 46" className="h-4 w-auto shrink-0">
        <rect x="2" y="10" width="42" height="34" rx="7" fill="#E60026" />
        <path d="M 15,10 C 15,4 31,4 31,10" stroke="#E60026" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="22" r="2.2" fill="#FFFFFF" />
        <path d="M 26,22 Q 30,25 33,22" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M 19,31 Q 23,35 27,31" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Whirlpool',
    normalizedKey: 'whirlpool',
    defaultCount: 373,
    categoryHint: 'Refrigeradores & Lavadoras',
    group: 'home',
    renderLogo: () => (
      <svg viewBox="0 0 88 32" className="h-3.5 w-auto shrink-0">
        <ellipse cx="44" cy="16" rx="42" ry="12" fill="none" stroke="#F1B82D" strokeWidth="2.5" />
        <text x="44" y="21" fill="#002D62" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" textAnchor="middle">Whirlpool</text>
      </svg>
    ),
  },
  {
    name: 'Oster',
    normalizedKey: 'oster',
    defaultCount: 178,
    categoryHint: 'Licuadoras & Electrodomésticos',
    group: 'home',
    renderLogo: () => (
      <svg viewBox="0 0 76 28" className="h-3.5 w-auto shrink-0">
        <rect width="76" height="28" rx="4" fill="#003366" />
        <text x="38" y="19" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="14" textAnchor="middle" letterSpacing="1">Oster</text>
      </svg>
    ),
  },
];

interface Props {
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
  brandFacets?: Array<{ name: string; count: number }>;
}

export const BrandShowcase: React.FC<Props> = ({
  selectedBrand,
  onSelectBrand,
  brandFacets = [],
}) => {
  const [activeGroup, setActiveGroup] = useState<BrandCategoryGroup>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Map facet counts by normalized brand name
  const facetMap = new Map<string, number>();
  brandFacets.forEach((f) => {
    facetMap.set(f.name.toLowerCase().trim(), f.count);
  });

  const getBrandCount = (brand: BrandInfo): number => {
    const direct = facetMap.get(brand.name.toLowerCase());
    if (direct !== undefined) return direct;

    const byKey = facetMap.get(brand.normalizedKey);
    if (byKey !== undefined) return byKey;

    return brand.defaultCount;
  };

  const isBrandSelected = (brand: BrandInfo) => {
    if (!selectedBrand) return false;
    const norm = selectedBrand.toLowerCase().trim();
    return norm === brand.name.toLowerCase() || norm === brand.normalizedKey;
  };

  // Filter brands according to active group tab
  const filteredBrands = TOP_BRANDS.filter((b) => {
    if (activeGroup === 'all') return true;
    return b.group === activeGroup;
  });

  // Decide how many to display (12 when collapsed, all when expanded or when a specific group tab is selected)
  const visibleBrands =
    activeGroup !== 'all' || isExpanded ? filteredBrands : filteredBrands.slice(0, 12);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
      {/* Header & Categories Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                Marcas con Mayor Catálogo de Ofertas
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Catálogo Verificado
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal">
              Acceso directo a las marcas oficiales con los inventarios de descuento más grandes de México
            </p>
          </div>
        </div>

        {/* Group / Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveGroup('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeGroup === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Todas ({TOP_BRANDS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveGroup('tech')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeGroup === 'tech'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tecnología ({TOP_BRANDS.filter((b) => b.group === 'tech').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveGroup('fashion')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeGroup === 'fashion'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Moda & Sneakers ({TOP_BRANDS.filter((b) => b.group === 'fashion').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveGroup('home')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeGroup === 'home'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Hogar & Estilo ({TOP_BRANDS.filter((b) => b.group === 'home').length})
          </button>

          {selectedBrand && (
            <button
              onClick={() => onSelectBrand('')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 ml-1"
            >
              <X className="w-3 h-3" />
              <span>Quitar ({selectedBrand})</span>
            </button>
          )}
        </div>
      </div>

      {/* Brand Cards Grid with Original High-Fidelity Logos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
        {visibleBrands.map((brand) => {
          const isSelected = isBrandSelected(brand);
          const count = getBrandCount(brand);

          return (
            <button
              key={brand.name}
              type="button"
              onClick={() => onSelectBrand(isSelected ? '' : brand.name)}
              className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-2xs'
              }`}
            >
              {/* Top Row: Original Vector Logo & Count / Check */}
              <div className="w-full flex items-center justify-between gap-1.5 h-7 mb-2">
                <div className="flex items-center max-w-[70%]">
                  {brand.renderLogo(isSelected)}
                </div>
                {isSelected ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                    {count}
                  </span>
                )}
              </div>

              {/* Brand Name */}
              <div className="w-full truncate font-bold text-xs">
                {brand.name}
              </div>

              {/* Category Hint & Count */}
              <div className="w-full flex items-center justify-between gap-1 mt-0.5">
                <span className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {brand.categoryHint}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-semibold text-emerald-400 shrink-0">
                    {count} ofertas
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expand / Collapse Button when in "Todas" tab */}
      {activeGroup === 'all' && filteredBrands.length > 12 && (
        <div className="pt-2 text-center border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Ver menos marcas</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Ver todas las {filteredBrands.length} marcas oficiales</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};
