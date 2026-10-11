import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-08-01' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { items, customerEmail } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

    const line_items = items.map(it => ({
      price_data: {
        currency: process.env.CURRENCY || 'ars',
        product_data: { name: it.name },
        unit_amount: Math.round(it.price * 100),
      },
      quantity: it.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.FRONTEND_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/?checkout=cancel`,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
