'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UeGEBKmo5c88ykEYcHFg5SKTzd9iLOQ6Q6HsANTq2NSbHJUlQ3joRNFsEHRHVdYiq7ncEHtIhwoi5IcONduNhXo00Hv0Zmg57';

const stripePromise = loadStripe(stripePublishableKey);

interface StripeElementsWrapperProps {
  clientSecret: string;
  bookingReference: string;
  accessToken: string;
  totalFare: number;
  depositPercentage: number;
  customerName: string;
  customerEmail: string;
  locale: string;
  onBack: () => void;
  onSuccess: (ref: string, token: string) => void;
}

export function StripeElementsWrapper({
  clientSecret,
  bookingReference,
  accessToken,
  totalFare,
  depositPercentage,
  customerName,
  customerEmail,
  locale,
  onBack,
  onSuccess,
}: StripeElementsWrapperProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#d59e4b', // Barcelona Gold
        colorBackground: '#ffffff',
        colorText: '#0F2346', // Deep Navy
        colorDanger: '#e11d48',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid #CFE7F5',
          boxShadow: 'none',
          padding: '12px 14px',
          fontSize: '14px',
          color: '#0F2346',
        },
        '.Input:focus': {
          borderColor: '#d59e4b',
          boxShadow: '0 0 0 1px #d59e4b',
        },
        '.Label': {
          fontWeight: '600',
          fontSize: '12px',
          color: '#0F2346',
          marginBottom: '6px',
        },
        '.Tab': {
          border: '1px solid #CFE7F5',
          backgroundColor: '#F8FCFF',
        },
        '.Tab--selected': {
          borderColor: '#d59e4b',
          backgroundColor: '#FFFFFF',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm
        bookingReference={bookingReference}
        accessToken={accessToken}
        totalFare={totalFare}
        depositPercentage={depositPercentage}
        customerName={customerName}
        customerEmail={customerEmail}
        locale={locale}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}

