# Dulcinea Store

Tienda creada con React + Vite, integración con Supabase (reseñas y pedidos) y Stripe Checkout para pagos.

Estoy dejando el proyecto listo en el repo. Para ver la app localmente:

1) Clonar el repo
   git clone https://github.com/ramalloalan72/dulcinea-store.git
   cd dulcinea-store

2) Instalar dependencias
   npm install

3) Variables de entorno locales (crear un archivo .env.local en la raíz con las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)

   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

4) Levantar dev server
   npm run dev

5) Endpoints serverless (/api) requieren deploy en Vercel/Netlify o ejecución con adaptador local. Antes de usar Stripe Checkout configurá en el entorno:

   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_URL=https://your-project.supabase.co
   FRONTEND_URL=http://localhost:3000
   CURRENCY=ars

6) Crear tablas en Supabase: ejecutar `schema.sql` en Supabase SQL editor.

7) Para probar webhooks localmente usa Stripe CLI:
   stripe login
   stripe listen --forward-to http://localhost:3000/api/webhook

Deploy recomendado: Vercel (sirve /api/*.js como serverless functions). Agrega las variables de entorno en la plataforma.


Si querés, pruebo el deploy en Vercel por vos y te doy el link de preview — necesitás darme OK para vincular al proyecto o agregar tus keys en Vercel.
