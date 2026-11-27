import { useMemo, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { getProductSuggestion, type ProductSuggestion } from './ai';
import { products } from './data';
import type { Category, Product } from './types';

const filters: Array<'All' | Category> = ['All', 'Food', 'Home', 'Gifts', 'DIY'];

type SuggestionStatus = 'idle' | 'loading' | 'ready';

interface SuggestionState {
  status: SuggestionStatus;
  result?: ProductSuggestion;
}

function App() {
  const [category, setCategory] = useState<'All' | Category>('All');
  const [index, setIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [view, setView] = useState<'discover' | 'saved'>('discover');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState('');
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Record<number, SuggestionState>>({});
  const visibleProducts = useMemo(
    () => products.filter((product) => category === 'All' || product.category === category),
    [category],
  );
  const currentProduct = visibleProducts.length ? visibleProducts[index % visibleProducts.length] : null;
  const savedProducts = products.filter((product) => savedIds.includes(product.id));

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 1600);
  }

  function advance() {
    setIndex((current) => (current + 1) % Math.max(visibleProducts.length, 1));
  }

  function save(product = currentProduct) {
    if (!product) return;
    setSavedIds((current) => current.includes(product.id) ? current : [...current, product.id]);
    if (view === 'discover') advance();
    notify('Added to your saved finds');
  }

  function requestPickup(product: Product) {
    setModalProduct(product);
  }

  async function showProduct(product: Product, refresh = false) {
    const isOpen = expandedProductId === product.id;
    if (!refresh && isOpen) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(product.id);
    if (!refresh && suggestions[product.id]?.status === 'ready') return;

    setSuggestions((current) => ({ ...current, [product.id]: { status: 'loading' } }));
    const result = await getProductSuggestion(product);
    setSuggestions((current) => ({ ...current, [product.id]: { status: 'ready', result } }));
  }

  function confirmPickup() {
    if (!modalProduct) return;
    setModalProduct(null);
    notify(`Pickup request sent to ${modalProduct.shop}`);
  }

  return (
    <div className="app">
      <header className="top">
        <div className="logo">ShopAt<span>FirstSight</span></div>
        <div className="location">⌖ <span>Shopping near <b>Dublin 2</b></span>⌄</div>
        <div className="user" aria-label="Profile">S</div>
      </header>

      <section className="head">
        <div>
          <div className="kicker">Your local discovery feed</div>
          <h1>Find your next little love.</h1>
          <p className="sub">Curious things from shops around your corner.</p>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          <button className={`tab ${view === 'discover' ? 'active' : ''}`} onClick={() => setView('discover')}>Discover</button>
          <button className={`tab ${view === 'saved' ? 'active' : ''}`} onClick={() => setView('saved')}>Saved finds {savedIds.length > 0 && `(${savedIds.length})`}</button>
        </nav>
      </section>

      <main className="layout">
        <section className="discover">
          {view === 'discover' && <div className="filters" aria-label="Filter products">
            {filters.map((item) => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => { setCategory(item); setIndex(0); }}>
              {item === 'All' ? 'For you' : <>{item === 'Food' ? '🥕' : item === 'Home' ? '🏡' : item === 'Gifts' ? '🎁' : '🧵'} {item}</>}
            </button>)}
          </div>}

          {view === 'discover' ? (currentProduct
            ? <ProductCard product={currentProduct} onSave={() => save()} onSkip={advance} onDetails={() => notify(currentProduct.fresh)} expanded={expandedProductId === currentProduct.id} suggestion={suggestions[currentProduct.id]} onExpand={() => showProduct(currentProduct)} onRefreshSuggestion={() => showProduct(currentProduct, true)} />
            : <div className="emptylist">No finds in this category yet.</div>)
            : savedProducts.length
              ? <div className="saved-cards">{savedProducts.map((product) => <ProductCard key={product.id} product={product} saved onSave={() => requestPickup(product)} onSkip={() => setSavedIds((ids) => ids.filter((id) => id !== product.id))} onDetails={() => notify(product.fresh)} expanded={expandedProductId === product.id} suggestion={suggestions[product.id]} onExpand={() => showProduct(product)} onRefreshSuggestion={() => showProduct(product, true)} />)}</div>
              : <div className="emptylist">Your saved finds will appear here. Head to Discover and save something that catches your eye.</div>}

          {view === 'discover' && <>
            <div className="actions">
              <button className="act" onClick={advance} aria-label="Skip product">×</button>
              <button className="act like" onClick={() => save()} aria-label="Save product">♡</button>
              <button className="act" onClick={() => currentProduct && notify(currentProduct.fresh)} aria-label="Check stock update">i</button>
            </div>
            <div className="hint">← Skip <span>·</span> Save for later →</div>
          </>}
        </section>

        <aside className="side">
          <section className="sidebox">
            <div className="sidehead"><h3>Your saved finds</h3><button className="viewall" onClick={() => setView('saved')}>View all</button></div>
            {savedProducts.length ? savedProducts.slice(0, 3).map((product) => <div className="saveditem" key={product.id}>
              <div className="thumb">{product.emoji}</div><div><div className="savedname">{product.name}</div><div className="savedmeta">{product.shop}</div></div><div className="savedprice">{product.price}</div>
            </div>) : <div className="emptylist">Nothing saved yet. Save a find to keep it for later.</div>}
          </section>
          <section className="sidebox pickup">
            <div className="kicker">Local pickup</div><h3>A good find, just around the corner.</h3>
            <p>Save something you like, then check it’s still available and request pickup directly with the shop.</p>
            <button onClick={() => savedProducts[0] ? requestPickup(savedProducts[0]) : notify('Save a find first to explore pickup')}>See pickup options</button>
          </section>
          <section className="sidebox community"><div>Made for curious locals</div><p>Discover independent shops and products you might have walked past.</p></section>
        </aside>
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}
      {modalProduct && <div className="overlay" onClick={(event) => { if (event.target === event.currentTarget) setModalProduct(null); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pickup-title">
          <h2 id="pickup-title">Request pickup?</h2>
          <p>This demo uses sample inventory. In the real app, the shop will confirm availability before your visit.</p>
          <div className="modalrow"><div className="thumb">{modalProduct.emoji}</div><div><b>{modalProduct.name}</b><small>{modalProduct.shop} · {modalProduct.distance}</small></div><strong>{modalProduct.price}</strong></div>
          <button className="confirm" onClick={confirmPickup}>Request pickup</button>
          <button className="cancel" onClick={() => setModalProduct(null)}>Keep browsing</button>
        </div>
      </div>}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  saved?: boolean;
  expanded: boolean;
  suggestion?: SuggestionState;
  onSave: () => void;
  onSkip: () => void;
  onDetails: () => void;
  onExpand: () => void;
  onRefreshSuggestion: () => void;
}

function ProductCard({ product, saved = false, expanded, suggestion, onSave, onSkip, onDetails, onExpand, onRefreshSuggestion }: ProductCardProps) {
  let touchStartX = 0;
  function openFromKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExpand();
    }
  }

  function preventCardClick(event: SyntheticEvent) {
    event.stopPropagation();
  }

  return <article className={`card ${saved ? 'saved-card' : ''} ${expanded ? 'expanded' : ''}`} onClick={onExpand} onKeyDown={openFromKeyboard} role="button" tabIndex={0} aria-expanded={expanded} onTouchStart={(event) => { touchStartX = event.changedTouches[0].screenX; }} onTouchEnd={(event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 80) {
      event.stopPropagation();
      distance < 0 ? onSave() : onSkip();
    }
  }}>
    <div className="photo">
      <span className="deal">{product.badge}</span>
      {!saved && <button className="heart" onClick={(event) => { preventCardClick(event); onSave(); }} aria-label="Save product">♡</button>}
      <span className="art" aria-hidden="true">{product.emoji}</span>
    </div>
    <div className="details">
      <div className="row"><h2>{product.name}</h2><span className="price">{product.price}</span></div>
      <p className="why">{product.why}</p>
      <div className="shop"><span><strong>{product.shop}</strong> · {product.distance}</span><button className="fresh" onClick={(event) => { preventCardClick(event); onDetails(); }}>● {product.fresh}</button></div>
      {!expanded && <div className="expand-hint">Tap for AI ideas and product details <span>⌄</span></div>}
      {expanded && <section className="ai-panel" aria-live="polite" onClick={preventCardClick}>
        <div className="ai-panel-head"><div><span className="ai-sparkle">✦</span> AI use idea</div><button className="refresh-idea" onClick={onRefreshSuggestion} disabled={suggestion?.status === 'loading'}>{suggestion?.status === 'loading' ? 'Thinking…' : 'New idea'}</button></div>
        {suggestion?.status === 'loading' && <p className="ai-loading">Finding a useful way to make this yours…</p>}
        {suggestion?.status === 'ready' && <><p className="ai-copy">{suggestion.result?.text}</p><span className="ai-source">{suggestion.result?.source === 'ai' ? 'Generated for this product' : 'Sample idea — add OPENAI_API_KEY to enable live AI'}</span></>}
      </section>}
      {saved && <button className="confirm card-reserve" onClick={(event) => { preventCardClick(event); onSave(); }}>Check & request pickup</button>}
    </div>
  </article>;
}

export default App;
