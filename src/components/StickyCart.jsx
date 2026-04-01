// StickyCart.jsx
// Sticky Add-to-Cart sáv - megjelenik amikor a user elgörgeti a hero-t
// Mentsd ide: src/components/StickyCart.jsx

import { useState, useEffect } from 'react';

// Shopify konfiguráció
const SHOPIFY_DOMAIN = 'zephyr-hangover.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = 'a225ffacab411d067a8d8b474e490668';
const PRODUCT_HANDLE = 'teszt-zephyr-termek';

// GraphQL query
const PRODUCT_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
            }
            compareAtPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

// Cart létrehozása
const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        message
      }
    }
  }
`;

async function shopifyFetch(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export default function StickyCart() {
  const [isVisible, setIsVisible] = useState(false);
  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(1); // 2 csomag default
  const [loading, setLoading] = useState(false);

  // Scroll figyelés
  useEffect(() => {
    const handleScroll = () => {
      // Megjelenik 600px görgetés után
      setIsVisible(window.scrollY > 600);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Termék betöltés
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await shopifyFetch(PRODUCT_QUERY, { handle: PRODUCT_HANDLE });
        setProduct(data.product);
      } catch (err) {
        console.error('StickyCart error:', err);
      }
    }
    fetchProduct();
  }, []);

  // Checkout
  async function handleCheckout() {
    if (!product) return;
    setLoading(true);
    
    try {
      const variant = product.variants.edges[selectedVariantIndex].node;
      const data = await shopifyFetch(CREATE_CART_MUTATION, {
        input: {
          lines: [{ merchandiseId: variant.id, quantity: 1 }],
        },
      });
      
      if (data.cartCreate.cart?.checkoutUrl) {
        window.location.href = data.cartCreate.cart.checkoutUrl;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (!product) return null;

  const variants = product.variants.edges.map(e => e.node);
  const selectedVariant = variants[selectedVariantIndex];
  const price = parseFloat(selectedVariant?.price?.amount || 0);
  const comparePrice = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : null;

  const bundleLabels = ['1 csomag', '2 csomag', '3 csomag'];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Gradient felső él */}
      <div className="h-1 bg-gradient-to-r from-[#6D2077] via-[#8B3D99] to-[#003B5C]"></div>
      
      {/* Fő sáv */}
      <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Bal: Termék info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6D2077] to-[#003B5C] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🌙</span>
              </div>
              <div>
                <p className="font-semibold text-[#003B5C] text-sm">Toplexa alvássegítő</p>
                <p className="text-xs text-gray-500">Természetes formula</p>
              </div>
            </div>
            
            {/* Közép: Variáns választó */}
            <div className="flex items-center gap-2">
              <select
                value={selectedVariantIndex}
                onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
                className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm font-medium text-[#003B5C] focus:ring-2 focus:ring-[#6D2077]"
              >
                {variants.map((variant, index) => (
                  <option key={variant.id} value={index}>
                    {bundleLabels[index] || variant.title}
                  </option>
                ))}
              </select>
              
              {/* Ár */}
              <div className="text-right">
                <span className="font-bold text-[#003B5C]">
                  {price.toLocaleString('hu-HU')} Ft
                </span>
                {comparePrice && (
                  <span className="text-gray-400 text-sm line-through ml-2 hidden md:inline">
                    {comparePrice.toLocaleString('hu-HU')} Ft
                  </span>
                )}
              </div>
            </div>
            
            {/* Jobb: CTA gomb */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-gradient-to-r from-[#6D2077] to-[#8B3D99] text-white font-bold px-6 py-3 rounded-full hover:opacity-90 transition-all disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </span>
              ) : (
                <>Megrendelem <span className="hidden sm:inline">→</span></>
              )}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
