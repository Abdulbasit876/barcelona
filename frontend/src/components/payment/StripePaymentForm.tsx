'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
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

export function StripePaymentForm({
  bookingReference,
  accessToken,
  totalFare,
  depositPercentage,
  customerName,
  customerEmail,
  locale,
  onBack,
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState(customerName || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const depositAmount = ((totalFare * depositPercentage) / 100).toFixed(2);
  const remainingBalance = ((totalFare * (100 - depositPercentage)) / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe payment system is still initializing. Please wait a moment.');
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Trigger Stripe's built-in element validation first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Please check your card details.');
        setLoading(false);
        return;
      }

      // Return URL for 3D Secure / redirect scenarios
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const returnUrl = `${origin}/${locale}/booking-confirmation/${bookingReference}?token=${accessToken}&payment_success=true`;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              name: cardholderName.trim(),
              email: customerEmail || undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (result.error) {
        // Payment failed or declined
        if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
          setErrorMessage(result.error.message || 'Your card payment was declined.');
        } else {
          setErrorMessage(result.error.message || 'An error occurred during payment processing.');
        }
        setLoading(false);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded without requiring redirect
        onSuccess(bookingReference, accessToken);
      } else if (result.paymentIntent && result.paymentIntent.status === 'processing') {
        onSuccess(bookingReference, accessToken);
      } else {
        // In other statuses (e.g. requires_action redirect was triggered)
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected payment processing error.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2.5 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Payment Summary Box */}
      <div className="p-4 rounded-xl bg-white border border-[#CFE7F5] space-y-2">
        <div className="flex items-center justify-between text-xs text-[#0F2346]/70">
          <span>Total Transfer Fare:</span>
          <span className="font-bold text-[#0F2346]">€{Number(totalFare).toFixed(2)} EUR</span>
        </div>
        <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
          <span>{depositPercentage}% Advance Deposit Due Today (Online):</span>
          <span className="text-xl font-bold text-emerald-600">€{depositAmount} EUR</span>
        </div>
        <div className="flex items-center justify-between text-xs text-amber-800 border-t border-[#CFE7F5] pt-2">
          <span>Remaining Balance Payable to Driver ({100 - depositPercentage}%):</span>
          <span className="font-bold">€{remainingBalance} EUR</span>
        </div>
      </div>

      {/* Cardholder Name Input */}
      <div>
        <label className="block text-xs font-semibold text-[#0F2346] mb-1.5">
          Cardholder Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="e.g. John Doe"
          className="w-full bg-white border border-[#CFE7F5] rounded-xl px-4 py-3 text-sm text-[#0F2346] placeholder:text-[#0F2346]/40 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {/* Stripe Payment Element (PCI DSS compliant secure card input iframe) */}
      <div className="bg-white border border-[#CFE7F5] rounded-xl p-4">
        <div className="text-xs font-semibold text-[#0F2346] mb-2 flex items-center justify-between">
          <span>Card Details <span className="text-red-500">*</span></span>
          <span className="text-[11px] text-slate-400 font-normal">Encrypted by Stripe</span>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Submit & Back buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#CFE7F5]">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-xs font-semibold text-[#0F2346]/70 hover:text-[#0F2346] flex items-center justify-center space-x-1 py-2 sm:py-0 disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Review</span>
        </button>

        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className="w-full sm:w-auto bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-950 font-bold py-3.5 px-8 rounded-full flex items-center justify-center space-x-2 shadow-gold transition-all text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authorizing with Bank...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Pay {depositPercentage}% Advance Deposit (€{depositAmount} EUR) & Confirm</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

