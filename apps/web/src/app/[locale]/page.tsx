import React from 'react';
import Hero from '../../components/Hero';
import AboutSection from '../../components/AboutSection';
import ServicesSection from '../../components/ServicesSection';
import WhyChooseUs from '../../components/WhyChooseUs';
import FamousPlacesPreview from '../../components/FamousPlacesPreview';
import FleetPreview from '../../components/FleetPreview';
import CustomerReviews from '../../components/CustomerReviews';
import CallToAction from '../../components/CallToAction';

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <>
      <Hero locale={locale} />
      <AboutSection />
      <ServicesSection locale={locale} />
      <WhyChooseUs locale={locale} />
      <FamousPlacesPreview locale={locale} />
      <FleetPreview locale={locale} />
      <CustomerReviews />
      <CallToAction locale={locale} />
    </>
  );
}
