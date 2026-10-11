import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const products = [
  { id: 'alfajores', category: 'alfajores', name: 'Alfajores de maicena', price: 150, description: 'Suaves, tiernos y rellenos de dulce de leche.', tag: 'Clásico', emoji: '🍪' },
  { id: 'pastafloras', category: 'pastafloras', name: 'Pastafloras', price: 120, description: 'Masa delicada con un toque de manteca y dulzor.', tag: 'Tradicional', emoji: '🥐' },
  { id: 'magdalenas', category: 'magdalenas', name: 'Magdalenas', price: 90, description: 'Esponjosas para disfrutar en cualquier momento.', tag: 'Caseras', emoji: '🧁' },
  { id: 'muffins', category: 'muffins', name: 'Muffins variados', price: 130, description: 'Chocolate, vainilla y frutos rojos.', tag: 'Especial', emoji: '🍓' },
  { id: 'tortas', category: 'tortas', name: 'Torta personalizada', price: 2800, description: 'Diseño y sabores a medida para tu evento.', tag: 'A medida', emoji: '🎂' },
  { id: 'alfajores-premium', category: 'alfajores', name: 'Alfajores premium', price: 180, description: 'Versión con cobertura de coco y relleno intenso.', tag: 'Premium', emoji: '🍪' },
];

const money = (v) => Number(v).toFixed(2);

export default function App() {
  const [filter, setFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('dulcinea_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    localStorage.setItem('dulcinea_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      if (data) setReviews(data);
    } catch (err) {
      // si no hay tabla aún, usamos las reviews locales
      console.warn('No se pudieron cargar reseñas desde Supabase:', err.message || err);
    }
  }

  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

  const total = useMemo(() => Object.entries(cart).reduce((s, [id, qty]) => {
    const p = products.find(x => x.id === id);
    return s + (p ? p.price * qty : 0);
  }, 0), [cart]);

  const itemsCount = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);

  const addToCart = (id) => { setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 })); setCartOpen(true); };
  const changeQty = (id, delta) => { setCart(prev => { const cur = prev[id] || 0; const next = cur + delta; const copy = { ...prev }; if (next <= 0) delete copy[id]; else copy[id] = next; return copy; }); };

  async function handleCheckout(customerEmail) {
    const items = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(x => x.id === id);
      return { id, name: p.name, price: p.price, quantity: qty };
    });

    const resp = await fetch('/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, customerEmail }) });
    const data = await resp.json();
    if (data?.url) window.location.href = data.url;
    else { alert('Error al iniciar pago'); console.error(data); }
  }

  async function submitReview(product_id, author, text, stars = 5) {
    try {
      const { data, error } = await supabase.from('reviews').insert([{ product_id, author, text, stars }]);
      if (error) throw error;
      fetchReviews();
      return data;
    } catch (err) {
      console.error('Error guardando reseña:', err);
      throw err;
    }
  }

  function handleOrderSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const customerEmail = fd.get('email');
    // enviar a checkout
    handleCheckout(customerEmail);
  }

  return (
    <>
      <div className="sprinkles" />

      <header className="topbar">
        <div className="container nav">
          <div className="brand"><span className="brand-mark">D</span><div><h1>Dulcinea</h1></div></div>
          <nav className="menu"><a href="#inicio">Inicio</a><a href="#catalogo">Catálogo</a><a href="#reseñas">Reseñas</a><a href="#pedido">Pedidos</a></nav>
          <button className="cart-button" onClick={() => setCartOpen(prev => !prev)} aria-label="Abrir carrito">🛒 <span id="cartCount">{itemsCount}</span></button>
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">Pastelería artesanal</span>
              <h2>Sabores dulces para cada momento especial</h2>
              <p>Alfajores de maicena, pastafloras, magdalenas, muffins y tortas personalizadas.</p>
              <div className="hero-actions"><a href="#catalogo" className="btn btn-primary">Ver catálogo</a><a href="#pedido" className="btn btn-secondary">Hacer pedido</a></div>
              <ul className="highlights"><li>Hechos con amor</li><li>Pedidos a medida</li><li>Entrega con cuidado</li></ul>
            </div>
            <div className="hero-visual"><div className="cake-card"><div className="cake-plate" /><div className="cake-illustration"><span>🍰</span></div></div></div>
          </div>
        </section>

        <section className="categories container">
          <div className="category"><span>🍪</span><h3>Alfajores</h3></div>
          <div className="category"><span>🥐</span><h3>Pastafloras</h3></div>
          <div className="category"><span>🧁</span><h3>Magdalenas</h3></div>
          <div className="category"><span>🍓</span><h3>Muffins</h3></div>
          <div className="category"><span>🎂</span><h3>Tortas</h3></div>
        </section>

        <section id="catalogo" className="catalog container">
          <div className="section-heading"><span className="eyebrow">Nuestro catálogo</span><h3>Productos favoritos</h3></div>
          <div className="filters">
            <button className={`filter-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>Todos</button>
            <button className={`filter-btn ${filter==='alfajores'?'active':''}`} onClick={()=>setFilter('alfajores')}>Alfajores</button>
            <button className={`filter-btn ${filter==='pastafloras'?'active':''}`} onClick={()=>setFilter('pastafloras')}>Pastafloras</button>
            <button className={`filter-btn ${filter==='magdalenas'?'active':''}`} onClick={()=>setFilter('magdalenas')}>Magdalenas</button>
            <button className={`filter-btn ${filter==='muffins'?'active':''}`} onClick={()=>setFilter('muffins')}>Muffins</button>
            <button className={`filter-btn ${filter==='tortas'?'active':''}`} onClick={()=>setFilter('tortas')}>Tortas</button>
          </div>

          <div className="product-grid">
            {filtered.map(p=> (
              <article className="product-card" key={p.id}>
                <div className="product-visual"><span className="emoji">{p.emoji}</span></div>
                <div className="product-info">
                  <div className="product-head"><h4>{p.name}</h4><span className="product-tag">{p.tag}</span></div>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-bottom"><strong className="product-price">${money(p.price)}</strong>
                    <div className="btn-row"><button className="btn btn-primary small" onClick={()=>addToCart(p.id)}>Agregar</button>
                    <button className="btn btn-secondary small" onClick={()=>window.location.href=`mailto:ventas@dulcinea.com?subject=${encodeURIComponent('Reseña '+p.name)}`}>Reseñar</button></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="features container">
          <div className="feature"><span>✨</span><h4>Calidad artesanal</h4><p>Preparados con recetas tradicionales y un toque moderno.</p></div>
          <div className="feature"><span>📦</span><h4>Pedidos a medida</h4><p>Arreglos para cumpleaños, eventos y regalos empresariales.</p></div>
          <div className="feature"><span>🚚</span><h4>Envíos y retiros</h4><p>Atención ágil y cuidado en cada detalle de entrega.</p></div>
        </section>

        <section id="reseñas" className="reviews container">
          <div className="section-heading"><span className="eyebrow">Opiniones</span><h3>Lo que dicen nuestros clientes</h3></div>
          <div className="reviews-grid">
            {reviews && reviews.length>0 ? reviews.map((r,i)=>(
              <article className="review-card" key={r.id||i}><div className="review-head"><strong>{r.author||r.name}</strong><span className="review-stars">{'★'.repeat(r.stars||5)}</span></div><p className="review-text">{r.text}</p></article>
            )): (
              <p>No hay reseñas aún — sé el primero en dejar una.</p>
            )}
          </div>
        </section>

        <section id="pedido" className="contact container">
          <div className="section-heading"><span className="eyebrow">Consulta</span><h3>Hacé tu pedido o consulta</h3></div>
          <div className="contact-layout">
            <form className="order-form" onSubmit={handleOrderSubmit}>
              <label>Nombre<input type="text" name="name" required /></label>
              <label>Email<input type="email" name="email" required /></label>
              <label>Tipo de pedido<select name="type"><option value="consulta">Consulta</option><option value="pedido">Pedido</option><option value="evento">Pedido para evento</option></select></label>
              <label>Mensaje<textarea name="message" rows={5} required /></label>
              <button className="btn btn-primary full" type="submit">Enviar pedido</button>
            </form>
            <div className="info-card"><h4>Dulcinea</h4><p>Pastelería artesanal con atención personalizada.</p><ul><li>📍 Calle San Martín 1420</li><li>📞 +54 9 11 2345-6789</li><li>✉️ ventas@dulcinea.com</li><li>⏰ Lunes a sábado de 9 a 19 hs</li></ul></div>
          </div>
        </section>
      </main>

      <aside className={`cart-sidebar ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen}>
        <div className="cart-header"><h3>Tu carrito</h3><button className="close-btn" onClick={()=>setCartOpen(false)}>✕</button></div>
        <div className="cart-items">
          {Object.keys(cart).length===0 ? <div className="empty-cart">Tu carrito está vacío.</div> : Object.entries(cart).map(([id,qty])=>{
            const p = products.find(x=>x.id===id); if(!p) return null;
            return (<div className="cart-item" key={id}><div><h5>{p.name}</h5><small>${money(p.price)} cada uno</small></div><div className="item-actions"><button className="qty-btn" onClick={()=>changeQty(id,-1)}>−</button><strong>{qty}</strong><button className="qty-btn" onClick={()=>changeQty(id,1)}>+</button></div></div>);
          })}
        </div>
        <div className="cart-footer"><div className="cart-total"><span>Total</span><strong>${money(total)}</strong></div><button className="btn btn-primary full" onClick={()=>handleCheckout()}>Finalizar pedido</button></div>
      </aside>
    </>
  );
}
