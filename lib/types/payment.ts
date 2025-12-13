/**
 * Payment Types
 * 
 * Type definitions for monetization and payment packages.
 * 
 * Stage 4 Module 11: Monetization
 */

import { z } from 'zod';

export const PackageTypeSchema = z.enum(['landing', 'multipage', 'ecommerce']);

export type PackageType = z.infer<typeof PackageTypeSchema>;

export interface PaymentPackage {
  id: string;
  type: PackageType;
  name: string;
  price: number; // USD
  features: string[];
  description: string;
}

export const PAYMENT_PACKAGES: Record<PackageType, PaymentPackage> = {
  landing: {
    id: 'landing',
    type: 'landing',
    name: 'Landing Page',
    price: 20,
    features: [
      'Single page website',
      'Unlimited components',
      'Export to ZIP',
      'AI chat assistance',
      'Component library access',
    ],
    description: 'Perfect for landing pages and single-page websites',
  },
  multipage: {
    id: 'multipage',
    type: 'multipage',
    name: 'Multi-Page',
    price: 50,
    features: [
      'Multiple pages',
      'Unlimited components',
      'Export to ZIP',
      'AI chat assistance',
      'Component library access',
      'Custom domains',
    ],
    description: 'Build multi-page websites with navigation',
  },
  ecommerce: {
    id: 'ecommerce',
    type: 'ecommerce',
    name: 'E-commerce',
    price: 100,
    features: [
      'Unlimited pages',
      'E-commerce components',
      'Export to ZIP',
      'AI chat assistance',
      'Component library access',
      'Custom domains',
      'Payment integration',
      'Product management',
    ],
    description: 'Full e-commerce website builder',
  },
};

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  packageType?: PackageType;
  error?: string;
}








