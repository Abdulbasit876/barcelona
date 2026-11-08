import React from 'react';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WhatsAppButton from '../../components/WhatsAppButton';
import '../globals.css';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' });

  const titles: Record<string, string> = {
    en: 'Barcelona Taxi Transfer | Private Airport, Cruise & VIP Chauffeur',
    es: 'Barcelona Taxi Transfer | Traslados Privados Aeropuerto y Chófer VIP',
    fr: 'Barcelona Taxi Transfer | Chauffeur Privé & Transferts Aéroport Barcelone',
    it: 'Barcelona Taxi Transfer | Autista Privato e Trasferimenti Aeroporto Barcellona',
  };

  const descriptions: Record<string, string> = {
    en: 'Reliable private transfers, Barcelona Airport pickups (BCN), cruise port journeys, and luxury tours across Barcelona with transparent fixed pricing and luxury fleet.',
    es: 'Traslados privados de confianza, recogidas en el Aeropuerto de Barcelona (BCN), puerto de cruceros y tours de lujo con tarifas fijas y chóferes profesionales.',
    fr: 'Transferts privés fiables, accueils à l’aéroport de Barcelone (BCN), port de croisière et visites privées avec tarification fixe garantie et véhicules de prestige.',
    it: 'Trasferimenti privati affidabili, arrivi all’aeroporto di Barcellona (BCN), porto crociere e tour panoramici con tariffe fisse e vetture di lusso.',
  };

  const currentTitle = titles[locale] || titles.en;
  const currentDesc = descriptions[locale] || descriptions.en;

  return {
    title: {
      default: currentTitle,
      template: `%s | Barcelona Taxi Transfer`,
    },
    description: currentDesc,
    metadataBase: new URL('https://barcelonataxitransfer.com'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        es: '/es',
        fr: '/fr',
        it: '/it',
      },
    },
    openGraph: {
      title: currentTitle,
      description: currentDesc,
      url: `https://barcelonataxitransfer.com/${locale}`,
      siteName: 'Barcelona Taxi Transfer',
      locale: locale,
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 800,
          height: 800,
          alt: 'Barcelona Taxi Transfer Logo',
        },
      ],
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070F1C] text-ice-50 flex flex-col antialiased selection:bg-gold-500 selection:text-navy-950">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Header locale={locale} />
          <main className="flex-grow">{children}</main>
          <Footer locale={locale} />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
