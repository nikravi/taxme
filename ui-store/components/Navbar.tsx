import * as React from 'react'
import { Fragment, useEffect, useState } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon, ShoppingCartIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import { classNames, ethAddressDisplay } from '../utils/utils'
import { navigation } from '../utils/project'
import { useMoralis, useMoralisQuery, useWeb3Contract } from 'react-moralis'
import { useRouter } from 'next/router'
import { TaxMeContractAddress } from '../constants/addresses'
import abi from "../constants/abi-taxme.json";

const Navbar = () => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    isWeb3Enabled,
    enableWeb3,
  } = useMoralis();

  const router = useRouter()

  const { runContractFunction: getOwner } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!,
    functionName: "owner",
  });
  
  useEffect(() => {
    if (isWeb3Enabled) return;
    if (typeof window !== "undefined") {
      enableWeb3();
    }
  }, [isWeb3Enabled]);

  const [isOwner, setIsOwner] = React.useState(false);

  const { fetch: fetchCart } = useMoralisQuery(
    "Cart",
    (query) => query.equalTo("userId", user?.id),
    [user?.id],
    { autoFetch: false }
  );
  const [cart, setCart] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart({
        onSuccess: (cartFetched) => {
          console.log("cart fetched", cartFetched);

          setCart(cartFetched[0]);
        },
        onError: (error) => {
          console.error("error fetching cart", error);
        },
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isWeb3Enabled && isAuthenticated) {
      getOwner({
        onSuccess: (ownerAddress: string) => {
          console.log({ ownerAddress });

          setIsOwner(
            user?.get("ethAddress").toLowerCase() === ownerAddress.toLowerCase()
          );
        },
        onError: (error) => {
          debugger
          console.error("error fetching owner", error);
        },
      });
    }
  }, [isWeb3Enabled, isAuthenticated]);

  const [navbarItems, setNavbarItems] = React.useState(
    navigation.main.filter((item) => !item.hideTopView)
  );

  useEffect(() => {
    if (isAuthenticated) {
      console.log("isAuthenticated", user, account);
      setNavbarItems(navigation.main.filter((item) => !item.hideTopView));
    } else {
      setNavbarItems(
        navigation.main.filter((item) => !item.hideTopView )
      );
    }
  }, [isAuthenticated]);

  const login = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: 'Log in' })
        .then(function (user) {
          console.log('logged in user:', user)
          console.log(user!.get('ethAddress'))
        })
        .catch(function (error) {
          console.log(error)
        })
    }
  }

  const logOut = async () => {
    await logout();
    console.log("logged out");
    router.push("/");
  }
  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <div className="cursor-pointer rounded-md bg-gray-200 p-2">
                      web3fy
                    </div>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navbarItems.map((item) => (
                      <Link href={item.href} key={item.name}>
                        <a
                          className={classNames(
                            router.pathname === item.href
                              ? "inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
                              : "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            ""
                          )}
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <Link href="/cart">
                  <a
                    href="#"
                    className="relative mr-4 rounded-full bg-white p-1 pr-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <ShoppingCartIcon
                      className="mr-4 h-6 w-6"
                      aria-hidden="true"
                    />
                    {cart ? (
                      <span className="absolute top-[5px] right-1 inline-flex items-center rounded-full bg-indigo-100 py-1 px-1 text-xs font-medium text-indigo-800">
                        {cart
                          .get("products")
                          .map((p) => p.quantity)
                          .reduce(
                            (qPrev, q) => parseInt(q, 10) + parseInt(qPrev, 10),
                            0
                          )}
                      </span>
                    ) : null}
                  </a>
                </Link>

                {!user ? (
                  <button
                    type="button"
                    onClick={login}
                    className="relative ml-3 flex flex rounded-xl rounded-full bg-white p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Login with Metamask
                  </button>
                ) : null}
                {/* Profile dropdown */}
                {!!user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        {ethAddressDisplay(user.get("ethAddress"))}
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={`https://rinkeby.etherscan.io/address/${user.get(
                                "ethAddress"
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              View on Etherscan
                            </a>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="#"
                              onClick={logOut}
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700"
                              )}
                            >
                              Sign out
                            </a>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : null}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navigation.main.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    router.pathname === item.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  aria-current={
                    router.pathname === item.href ? "page" : undefined
                  }
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export default Navbar
