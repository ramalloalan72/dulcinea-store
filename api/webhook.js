import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-08-01' });

async function buffer(req) {
  if (req.arrayBuffer) {
    const ab = await req.arrayBuffer();
    return Buffer.from(ab);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionFull = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
      const lineItems = sessionFull.line_items?.data || [];

      const order = {
        stripe_session_id: session.id,
        customer_email: session.customer_email || null,
        amount_total: session.amount_total / 100.0,
        currency: session.currency,
        status: 'paid',
        created_at: new Date().toISOString()
      };

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // create order
      const orderResp = await fetch(`${supabaseUrl}/rest/v1/orders`, {
        method: 'POST',
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(order)
      });
      const orderJson = await orderResp.json();
      const createdOrder = Array.isArray(orderJson) ? orderJson[0] : orderJson;

      for (const li of lineItems) {
        const item = {
          order_id: createdOrder.id,
          product_name: li.description || (li.price?.product || null),
          quantity: li.quantity,
          unit_amount: (li.price?.unit_amount || 0) / 100.0,
          total: ((li.price?.unit_amount || 0) * (li.quantity || 0)) / 100.0
        };

        await fetch(`${supabaseUrl}/rest/v1/order_items`, {
          method: 'POST',
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item)
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Webhook handler error');
  }
}
