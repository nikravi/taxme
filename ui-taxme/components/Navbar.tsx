import * as React from "react";
import { Fragment, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import Link from "next/link";
import { classNames, ethAddressDisplay } from "../utils/utils";
import { navigation } from "../utils/project";
import { useMoralis } from "react-moralis";
import { useRouter } from "next/router";
import Image from "next/image";
import TMSymbol from "../images/taxme-symbol.svg";
import TMLogo from "../images/taxme-logo.svg";

const Navbar = ({ showLoginInNavbar = true }) => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    enableWeb3,
    isWeb3Enabled,
  } = useMoralis();
  const router = useRouter();

  const [navbarItems, setNavbarItems] = React.useState(
    navigation.main.filter((item) => !item.hideTopView || item.auth)
  );

  useEffect(() => {
    if (isAuthenticated) {
      console.log("isAuthenticated", user, account);
      setNavbarItems(navigation.main.filter((item) => !item.hideTopView));
    } else {
      setNavbarItems(
        navigation.main.filter((item) => !item.hideTopView && !item.auth)
      );
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isWeb3Enabled) return;
    if (typeof window !== "undefined") {
      enableWeb3();
    }
  }, [isWeb3Enabled]);

  const login = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: "Log in" })
        .then(function (user) {
          console.log("logged in user:", user);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };

  const logOut = async () => {
    await logout();
    console.log("logged out");
    router.push("/");
  };

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
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
                    <a>
                      <Image
                        className="block h-8 w-auto lg:hidden"
                        src={TMSymbol}
                        height={40}
                        alt="TaxMe logo"
                      />
                      <Image
                        className="hidden h-8 w-auto lg:block"
                        src={TMLogo}
                        height={40}
                        alt="TaxMe logo"
                      />
                    </a>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navbarItems.map((item) => (
                      <Link href={item.href} key={item.name}>
                        <a
                          className={classNames(
                            router.pathname === item.href
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                          aria-current={
                            router.pathname === item.href ? "page" : undefined
                          }
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {!user && showLoginInNavbar ? (
                  <button
                    type="button"
                    onClick={login}
                    className="relative ml-3 flex rounded-xl bg-blue-500 px-4 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    Login with Metamask
                  </button>
                ) : null}
                {/* Profile dropdown */}
                {!!user?.get("ethAddress") ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-xl px-7 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
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
                              href={`https://etherscan.io/address/${user.get(
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
              {navbarItems.map((item) => (
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
};

export default Navbar;
