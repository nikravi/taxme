import * as React from 'react'
import { useMoralis } from 'react-moralis'
import { Fragment, useEffect } from 'react'

const QuickSignUp = ({ showLoginInNavbar = true }) => {
  const { isAuthenticated, authenticate, user, account, logout } = useMoralis()
  useEffect(() => {
    if (isAuthenticated) {
      console.log('isAuthenticated', user, account)
    } else {
    }
  }, [isAuthenticated])

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

  return (
    <div className="bg-white sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
      <div className="px-4 py-8 sm:px-10">
        <div>
          <div className="mt-1">
            {!user && showLoginInNavbar ? (
              <button
                type="button"
                onClick={login}
                className="relative flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white px-4 py-1 rounded-xl bg-blue-500 text-white"
              >
                Login with Metamask
              </button>
            ) : (
              <>
                <div className="block text-sm font-medium text-gray-700">
                  Company public address
                </div>
                <div>
                  <a
                    href={`https://etherscan.io/address/${user.get(
                      'ethAddress',
                    )}`}
                    target="_blank"
                    className='text-gray-900 hover:underline'
                    rel="noreferrer"
                  >
                    {user.get('ethAddress')}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {!!user ? (
          <div className="mt-6">
            <form action="#" method="POST" className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  City
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="city"
                  placeholder="City"
                  required
                  className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="mobile-or-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  State
                </label>
                <input
                  type="text"
                  name="mobile-or-email"
                  id="mobile-or-email"
                  autoComplete="state"
                  placeholder="State"
                  required
                  className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label
                  htmlFor="zip-or-postal-code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Zip code
                </label>
                <input
                  id="zip-or-postal-code"
                  name="zip-or-postal-code"
                  type="text"
                  placeholder="Zip code"
                  autoComplete="zip-code"
                  required
                  className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create your account
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
      {!!user ? (
        <div className="px-4 py-6 bg-gray-50 border-t-2 border-gray-200 sm:px-10">
          <p className="text-xs leading-5 text-gray-500">
            Check our
            <a href="#" className="font-medium text-gray-900 hover:underline pl-1">
              Disclaimer
            </a>
            .
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default QuickSignUp
