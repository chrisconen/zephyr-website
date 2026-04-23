// ShopifyBuyButton.jsx
// Zephyr Shopify Storefront API integráció

import { useState, useEffect } from 'react';

// Shopify konfiguráció - CSERÉLNI a végleges adatokra
const SHOPIFY_DOMAIN = 'zephyr-hangover.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = 'a225ffacab411d067a8d8b474e490668';

// GraphQL query a termék lekéréséhez
const PRODUCT_QUERY = `
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

// Cart létrehozása mutation
const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

// Shopify Storefront API hívás
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

  if (json.errors) {
    console.error('Shopify API Error:', json.errors);
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

export default function ShopifyBuyButton({
  productHandle = 'teszt-zephyr-termek',
  quantity = 1,
  buttonText = 'Megrendelem',
  className = '',
}) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Termék lekérése
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await shopifyFetch(PRODUCT_QUERY, { handle: productHandle });
        setProduct(data.product);
      } catch (err) {
        setError('Nem sikerült betölteni a terméket');
        console.error(err);
      }
    }

    fetchProduct();
  }, [productHandle]);

  // Cart létrehozása és redirect
  async function handleCheckout() {
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      // Első variáns (vagy majd kiválasztott variáns)
      const variantId = product.variants.edges[0]?.node.id;
      
      if (!variantId) {
        throw new Error('Nincs elérhető variáns');
      }

      const data = await shopifyFetch(CREATE_CART_MUTATION, {
        input: {
          lines: [
            {
              merchandiseId: variantId,
              quantity: quantity,
            },
          ],
        },
      });

      if (data.cartCreate.userErrors?.length > 0) {
        throw new Error(data.cartCreate.userErrors[0].message);
      }

      // Redirect a Shopify checkout-ra
      if (data.cartCreate.cart?.checkoutUrl) {
        window.location.href = data.cartCreate.cart.checkoutUrl;
      }

    } catch (err) {
      setError('Hiba történt a rendelés során');
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !product}
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#6D2077] text-white font-semibold rounded-full hover:bg-[#4A1552] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Átirányítás...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
}
