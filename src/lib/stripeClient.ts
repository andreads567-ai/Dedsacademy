import { CartItem } from '../types';

export interface StripeCheckoutOptions {
  items: CartItem[];
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  couponCode?: string;
  discountAmount?: number;
  finalTotal?: number;
}

export async function redirectToStripeCheckout(options: StripeCheckoutOptions): Promise<void> {
  const payload = {
    items: options.items.map((item) => ({
      id: item.course.id,
      title: item.course.title,
      price: item.course.currentPrice,
      quantity: item.quantity,
      image: item.course.image,
      instructor: item.course.instructor,
    })),
    studentName: options.studentName,
    studentEmail: options.studentEmail,
    studentCpf: options.studentCpf,
    discountAmount: options.discountAmount || 0,
    successUrl: `${window.location.origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/?payment_status=cancel`,
  };

  // Save pending checkout state so the student's courses are unlocked upon return
  try {
    localStorage.setItem(
      'deds_pending_checkout',
      JSON.stringify({
        studentName: options.studentName,
        studentEmail: options.studentEmail,
        studentCpf: options.studentCpf,
        courseIds: options.items.map((i) => i.course.id),
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.warn('Could not save pending checkout state:', err);
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `O servidor retornou uma resposta inesperada (${response.status}). Verifique se a variável STRIPE_SECRET_KEY está configurada no painel da Vercel.`
    );
  }

  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Não foi possível iniciar o checkout com a Stripe. Tente novamente.');
  }

  // Redirect user to Stripe Hosted Checkout
  window.location.href = data.url;
}
