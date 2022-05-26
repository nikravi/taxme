import Link from "next/link";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useMoralis, useMoralisQuery, useWeb3Contract } from "react-moralis";
import { product, products } from "../utils/products";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/solid";
import {
  cartAddToCart,
  classNames,
  formatCurrency,
  HexToDec,
  taxNumberToFloat,
} from "../utils/utils";
import {
  TaxMeContractAddress,
  TaxStoreContractAddress,
  StoreOwner,
} from "../constants/addresses";
import abiTaxStore from "../constants/abi-taxstore.json";
import abiTaxMe from "../constants/abi-taxme.json";
import abiUsdc from "../constants/abi-usdc.json";
import { useRouter } from "next/router";

const deliveryMethods = [
  {
    id: 1,
    title: "Standard",
    turnaround: "4–10 business days",
    price: 5,
  },
  {
    id: 2,
    title: "Express",
    turnaround: "2–5 business days",
    price: 16,
  },
];

interface TokenAllowance {
  // address of the token contract
  [token: string]: number;
}
const paymentMethods = [
  {
    id: "usdc",
    title: "USDC",
    decimals: 6,
    address: "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b",
  },
  {
    id: "usdt",
    title: "USDT",
    decimals: 18,
    address: "0xD92E713d051C37EbB2561803a3b5FBAbc4962431",
  },
];

const CartPage = () => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    isWeb3Enabled,
  } = useMoralis();
  const { Moralis } = useMoralis();
  const router = useRouter();

  const floatToUIntPrepare = (value: number, decimals: number) => {
    return Moralis.Units.Token(value.toFixed(decimals), decimals);
  };
  const [clientAddressForm, setClientAddressForm] = useState({
    country: "Canada",
    province: "",
    city: "",
    postalCode: "",
    firstName: "",
    lastName: "",
    address: "",
    email: "",
  });

  const { fetch: fetchCart } = useMoralisQuery(
    "Cart",
    (query) => query.equalTo("userId", user?.id),
    [user?.id],
    { autoFetch: false }
  );
  const { runContractFunction: getGstTax } = useWeb3Contract({
    abi: abiTaxStore,
    contractAddress: TaxStoreContractAddress!,
    functionName: "taxes",
    params: { "": "gst" },
  });
  const { runContractFunction: getPstTax } = useWeb3Contract({
    abi: abiTaxStore,
    contractAddress: TaxStoreContractAddress!,
    functionName: "taxes",
    params: { "": clientAddressForm.province },
  });
  const [cart, setCart] = useState(null);
  const [cartProducts, setCartProducts] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [gstTax, setGstTax] = useState(0);
  const [pstTax, setPstTax] = useState(0);
  const [salesGstTax, setSalesGstTax] = useState(0);
  const [salesPstTax, setSalesPstTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [tokenAllowance, setTokenAllowance] = useState<TokenAllowance>({});

  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState(
    deliveryMethods[0]
  );

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethods[0]
  );

  useEffect(() => {
    if (!isWeb3Enabled || !isAuthenticated) {
      return;
    }

    allowance({
      onSuccess: (allowance: any) => {
        console.log("allowance", selectedPaymentMethod.id, HexToDec(allowance));

        setTokenAllowance({
          ...tokenAllowance,
          [selectedPaymentMethod.address]: HexToDec(allowance),
        });
      },
      onError: (error) => {
        console.error(error);
      },
    });
  }, [selectedPaymentMethod, isWeb3Enabled]);

  const fetchTaxes = () => {
    preSale({
      onSuccess: ([regionalTaxBN, nationalTaxBN]) => {
        const taxDecimalPlaces = 6;
        const regionalTax =
          HexToDec(regionalTaxBN) / Math.pow(10, taxDecimalPlaces);
        const nationalTax =
          HexToDec(nationalTaxBN) / Math.pow(10, taxDecimalPlaces);

        setSalesGstTax(nationalTax);
        setSalesPstTax(regionalTax);
        console.log(
          "preSale tx",
          HexToDec(regionalTaxBN) / Math.pow(10, taxDecimalPlaces),
          HexToDec(nationalTaxBN) / Math.pow(10, taxDecimalPlaces)
        );
      },
      onError: (error) => {
        console.error(error);
      },
    });
  };
  useEffect(() => {
    if (!isWeb3Enabled || !isAuthenticated) {
      return;
    }

    fetchCart({
      onSuccess: (cartFetched) => {
        console.log("cart fetched", cartFetched);

        setCart(cartFetched[0]);
        if (cartFetched[0]) {
          const cartProducts = cartFetched[0].get("products").map((p) => {
            return {
              ...p,
              ...products.find((product) => product.productId === p.productId),
            };
          });
          setCartProducts(cartProducts);

          fetchTaxes();
        }
      },
      onError: (error) => {
        console.error("error fetching cart", error);
      },
    });
  }, [isAuthenticated, isWeb3Enabled]);

  useEffect(() => {
    if (!isWeb3Enabled || !isAuthenticated) {
      return;
    }

    fetchTaxes();
  }, [clientAddressForm.province, selectedDeliveryMethod]);

  useEffect(() => {
    updateSubtotal(cartProducts);
  }, [salesGstTax, salesPstTax, selectedDeliveryMethod]);

  const updateSubtotal = (cartProducts) => {
    let subt = 0;
    cartProducts.forEach((p) => {
      subt += p.price * p.quantity;
    });

    setSubtotal(subt);

    let totalPrice = subt;
    totalPrice += selectedDeliveryMethod.price;

    setGrandTotal(totalPrice + salesGstTax + salesPstTax);
  };

  const handleQuantityChange = (e, productId: any) => {
    e.preventDefault();
    const newCartProducts = cartProducts.map((p) => {
      if (p.productId === productId) {
        return { ...p, quantity: e.target.value };
      }
      return p;
    });
    setCartProducts(newCartProducts);
    updateSubtotal(newCartProducts);
    fetchTaxes()
    cartAddToCart(cart, product.productId, e.target.value);
    cart.save().then(
      (c) => {
        console.log("updated cart", c);
      },
      (error) => {
        console.error(error);
      }
    );
  };

  const { runContractFunction: allowance } = useWeb3Contract({
    abi: abiUsdc,
    contractAddress: selectedPaymentMethod.address!,
    functionName: "allowance",
    params: {
      owner: user?.get("ethAddress"),
      spender: TaxMeContractAddress,
    },
  });

  const {
    runContractFunction: approve,
    isLoading: isLoadingApprove,
    isFetching: isFetchingApprove,
  } = useWeb3Contract({
    abi: abiUsdc,
    contractAddress: selectedPaymentMethod.address!,
    functionName: "approve",
    params: {
      _spender: TaxMeContractAddress,
      _value: floatToUIntPrepare(
        grandTotal * 2,
        selectedPaymentMethod.decimals
      ),
    },
  });

  const {
    runContractFunction: sale,
    isFetching,
    isLoading,
  } = useWeb3Contract({
    abi: abiTaxMe,
    contractAddress: TaxMeContractAddress!,
    functionName: "sale",
    params: {
      company: StoreOwner!,
      token: selectedPaymentMethod.address,
      amount: floatToUIntPrepare(
        subtotal + selectedDeliveryMethod.price,
        selectedPaymentMethod.decimals
      ),
      // taxable product
      productCategoryId: "1",
      clientState: clientAddressForm.province,
      clientIsoCountryCode: "ca",
    },
  });

  const { runContractFunction: preSale } = useWeb3Contract({
    abi: abiTaxMe,
    contractAddress: TaxMeContractAddress!,
    functionName: "preSale",
    params: {
      company: StoreOwner!,
      // token: selectedPaymentMethod.address,
      amount: floatToUIntPrepare(
        subtotal + selectedDeliveryMethod.price,
        selectedPaymentMethod.decimals
      ),
      // taxable product
      productCategoryId: "1",
      clientState: clientAddressForm.province,
      clientIsoCountryCode: "ca",
    },
  });

  const approveSpend = (ev) => {
    ev.preventDefault();

    approve({
      onSuccess: (approveTx: any) => {
        console.log("approve", approve);
        (async () => {
          const confirmations = 1;
          console.log(`waiting ${confirmations} confirmations`);

          await approveTx.wait(confirmations);
          console.log("confirmed");
          sale({
            onSuccess: (saleTx: any) => {
              console.log("sale tx", saleTx);
              (async () => {
                await saleTx.wait(confirmations);
                setCartProducts([]);
                updateSubtotal([]);
                cart.set("products", []);
                cart.save().then(
                  (c) => {
                    console.log("updated cart", c);
                    // redirect to thank you page
                    router.push("/thank-you");
                  },
                  (error) => {
                    console.error(error);
                  }
                );
              })();

              
            },
            onError: (error) => {
              console.error(error);
            },
          });
        })();
      },
      onError: (error) => {
        console.error(error);
      },
    });
  };

  return (
    <Layout title="Cart | web3fy">
      <div className="bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="sr-only">Checkout</h2>

          <form className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            <div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Contact information
                </h2>

                <div className="mt-4">
                  <label
                    htmlFor="email-address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email-address"
                      name="email-address"
                      autoComplete="email"
                      onChange={(e) => {
                        setClientAddressForm({
                          ...clientAddressForm,
                          email: e.target.value,
                        });
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 ">
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="first-name"
                        name="first-name"
                        autoComplete="given-name"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            firstName: e.target.value,
                          });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="last-name"
                        name="last-name"
                        autoComplete="family-name"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            lastName: e.target.value,
                          });
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="address"
                        id="address"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            address: e.target.value,
                          });
                        }}
                        autoComplete="street-address"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700"
                    >
                      City
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="city"
                        id="city"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            city: e.target.value,
                          });
                        }}
                        autoComplete="address-level2"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Country
                    </label>
                    <div className="mt-1">
                      <select
                        id="country"
                        name="country"
                        autoComplete="country-name"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {/* <option>United States</option> */}
                        <option>Canada</option>
                        {/* <option>Mexico</option> */}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State / Province
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="region"
                        id="region"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            province: e.target.value,
                          });
                        }}
                        autoComplete="address-level1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="postal-code"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Postal code
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="postal-code"
                        id="postal-code"
                        onChange={(e) => {
                          setClientAddressForm({
                            ...clientAddressForm,
                            postalCode: e.target.value,
                          });
                        }}
                        autoComplete="postal-code"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-gray-200 pt-10">
                <RadioGroup
                  value={selectedDeliveryMethod}
                  onChange={setSelectedDeliveryMethod}
                >
                  <RadioGroup.Label className="text-lg font-medium text-gray-900">
                    Delivery method
                  </RadioGroup.Label>

                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    {deliveryMethods.map((deliveryMethod) => (
                      <RadioGroup.Option
                        key={deliveryMethod.id}
                        value={deliveryMethod}
                        className={({ checked, active }) =>
                          classNames(
                            checked ? "border-transparent" : "border-gray-300",
                            active ? "ring-2 ring-indigo-500" : "",
                            "relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                          )
                        }
                      >
                        {({ checked, active }) => (
                          <>
                            <span className="flex flex-1">
                              <span className="flex flex-col">
                                <RadioGroup.Label
                                  as="span"
                                  className="block text-sm font-medium text-gray-900"
                                >
                                  {deliveryMethod.title}
                                </RadioGroup.Label>
                                <RadioGroup.Description
                                  as="span"
                                  className="mt-1 flex items-center text-sm text-gray-500"
                                >
                                  {deliveryMethod.turnaround}
                                </RadioGroup.Description>
                                <RadioGroup.Description
                                  as="span"
                                  className="mt-6 text-sm font-medium text-gray-900"
                                >
                                  {formatCurrency(deliveryMethod.price)}
                                </RadioGroup.Description>
                              </span>
                            </span>
                            {checked ? (
                              <CheckCircleIcon
                                className="h-5 w-5 text-indigo-600"
                                aria-hidden="true"
                              />
                            ) : null}
                            <span
                              className={classNames(
                                active ? "border" : "border-2",
                                checked
                                  ? "border-indigo-500"
                                  : "border-transparent",
                                "pointer-events-none absolute -inset-px rounded-lg"
                              )}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order summary */}
            <div className="mt-10 lg:mt-0">
              <h2 className="text-lg font-medium text-gray-900">
                Order summary
              </h2>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <h3 className="sr-only">Items in your cart</h3>
                <ul role="list" className="divide-y divide-gray-200">
                  {cartProducts.map((product) => (
                    <li
                      key={product.productId}
                      className="flex py-6 px-4 sm:px-6"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={product.images[0].src}
                          alt={product.images[0].alt}
                          className="w-20 rounded-md"
                        />
                      </div>

                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm">
                              <a
                                href={product.href}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {product.name}
                              </a>
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {product.color}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {product.size}
                            </p>
                          </div>

                          <div className="ml-4 flow-root flex-shrink-0">
                            <button
                              type="button"
                              className="-m-2.5 flex items-center justify-center bg-white p-2.5 text-gray-400 hover:text-gray-500"
                            >
                              <span className="sr-only">Remove</span>
                              <TrashIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-1 items-end justify-between pt-2">
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(product.price)}
                          </p>

                          <div className="ml-4">
                            <label htmlFor="quantity" className="sr-only">
                              Quantity
                            </label>
                            <select
                              id="quantity"
                              name="quantity"
                              value={product.quantity}
                              onChange={(e) => {
                                handleQuantityChange(e, product.productId);
                              }}
                              className="rounded-md border border-gray-300 text-left text-base font-medium text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                              <option value={7}>7</option>
                              <option value={8}>8</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-6 border-t border-gray-200 py-6 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Shipping</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedDeliveryMethod.price)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <dt className="text-sm">Taxes GST</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(salesGstTax)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Taxes PST</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(salesPstTax)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                    <dt className="text-base font-medium">Total</dt>
                    <dd className="text-base font-medium text-gray-900">
                      {formatCurrency(grandTotal)}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  {/* Payment */}
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Payment
                    </h2>

                    <fieldset className="mt-4">
                      <legend className="sr-only">Payment type</legend>
                      <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                        {paymentMethods.map((paymentMethod) => (
                          <div
                            key={paymentMethod.id}
                            className="flex items-center"
                          >
                            <input
                              id={paymentMethod.id}
                              name="payment-type"
                              type="radio"
                              value={paymentMethod.id}
                              checked={
                                selectedPaymentMethod.id === paymentMethod.id
                              }
                              onChange={() => {
                                setSelectedPaymentMethod(paymentMethod);
                              }}
                              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />

                            <label
                              htmlFor={paymentMethod.id}
                              className="ml-3 block text-sm font-medium text-gray-700"
                            >
                              {paymentMethod.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <button
                    type="submit"
                    onClick={approveSpend}
                    disabled={isLoadingApprove || isFetchingApprove}
                    className="w-full rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 disabled:opacity-75"
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
