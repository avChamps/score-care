import { registerPlugin } from "@capacitor/core";

type NativeRazorpayPlugin = {
  open: (options: {
    amount?: number;
    config?: Record<string, unknown>;
    currency?: string;
    customerId?: string;
    description?: string;
    key: string;
    name?: string;
    orderId: string;
    prefill?: {
      name: string;
      email: string;
      contact: string;
    };
    recurring?: string;
    retry?: {
      enabled: boolean;
      max_count?: number;
    };
    timeout?: number;
  }) => Promise<{
    razorpay_order_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    razorpay_subscription_id?: string;
  }>;
};

export const nativeRazorpay = registerPlugin<NativeRazorpayPlugin>("NativeRazorpay");
