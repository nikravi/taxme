export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function ethAddressDisplay(address: string) {
  if (!address) return ''
  return address.slice(0, 6) + '...' + address.slice(-4)
}

export const cartAddToCart = (cart, productId, quantity = 1, addition = false) => {
  if (!cart.get('products')) {
    cart.set('products', [])
  }
  const q = parseInt(quantity.toString(), 10);
  const currentProduct = cart
    .get('products')
    .find((p) => p.productId === productId)
  if (currentProduct) {
      if (addition) {
        currentProduct.quantity += q
      } else {
        currentProduct.quantity = q
      }
  } else {
    cart.get('products').push({
      productId,
      quantity: 1,
    })
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('ca-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value)
}


export function sanitizeTaxData(value: string | number) {
    // remove all non-numeric characters
    // 5000 → 5%
    return parseInt(value.toString().replace("\.", ""), 10) / 1000;
}