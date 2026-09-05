import React from 'react';
import './globals.css';

export const metadata = {
  title: 'DealHunter - Rastreador Inteligente de Ofertas y Precios',
  description: 'Compara precios en tiempo real de Amazon México, Mercado Libre y Walmart con alertas y Deal Score.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
