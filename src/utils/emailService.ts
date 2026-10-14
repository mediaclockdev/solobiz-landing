"use client";
import emailjs from '@emailjs/browser';
import { AccessoryInvoice } from './invoiceGenerator';

// EmailJS configuration - users need to set these up at https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_default'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_default'; // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'your_public_key'; // Replace with your EmailJS public key

interface EmailParams {
  to_email: string;
  to_name: string;
  invoice_number: string;
  order_date: string;
  total_amount: string;
  items_list: string;
  shipping_address: string;
  payment_method: string;
}

export const sendOrderConfirmationEmail = async (
  invoice: AccessoryInvoice
): Promise<boolean> => {
  try {
    // Format items list for email
    const itemsList = invoice.items
      .map(
        (item) =>
          `${item.productVariant} x${item.quantity} - $${item.subtotal.toFixed(2)}`
      )
      .join('\n');

    const emailParams: Record<string, unknown> = {
      to_email: invoice.customerInfo.email,
      to_name: invoice.customerInfo.name,
      invoice_number: invoice.invoiceNumber,
      order_date: new Date(invoice.date).toLocaleDateString(),
      total_amount: `$${invoice.totals.total.toFixed(2)}`,
      items_list: itemsList,
      shipping_address: invoice.customerInfo.address || 'Not provided',
      payment_method: invoice.paymentMethod || 'Not specified',
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      emailParams as Record<string, unknown>,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Order confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
};

export const isEmailConfigured = (): boolean => {
  return (
    EMAILJS_SERVICE_ID !== 'service_default' &&
    EMAILJS_TEMPLATE_ID !== 'template_default' &&
    EMAILJS_PUBLIC_KEY !== 'your_public_key'
  );
};
