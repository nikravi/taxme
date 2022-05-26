import * as React from 'react'
import { useRouter } from "next/router";
import { useMoralis, useWeb3Contract } from 'react-moralis'
import { Fragment, useEffect } from 'react'
import Link from 'next/link'
import { TaxMeContractAddress } from '../constants/addresses'
import abi from "../constants/abi-taxme.json";

const QuickSignUp = ({ showLoginInNavbar = true }) => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    enableWeb3,
    isWeb3Enabled,
  } = useMoralis();

  const [isRegistered, setIsRegistered] = React.useState(false);

  useEffect(() => {
    if (isWeb3Enabled && isAuthenticated) {
      checkIfUserIsRegistered();
    }
  }, [isWeb3Enabled, isAuthenticated]);

  const { runContractFunction: companiesAddresses } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!,
    functionName: "companiesAddresses",
    // abi for the function params, it has empty name
    params: { "": user?.get("ethAddress") },
  });

  const checkIfUserIsRegistered = async () => {
    await companiesAddresses({
      onSuccess: (address: any) => {
        if (address.country) {
          setIsRegistered(true);
        }
      },
      onError: (error) => {
        console.error("error", error);
      },
    });
  };

  const router = useRouter();


  const login = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: 'Log in' })
        .then(function (user) {
          console.log(user!.get("ethAddress"), isRegistered);
          if (isRegistered) {
            router.push('/dashboard');
          }
        })
        .catch(function (error) {
          console.log(error)
        })
    }
  }

  // company registration form
  const [companyRegistrationForm, setCompanyRegistrationForm] = React.useState({
    country: 'Canada',
    province: '',
    city: '',
    postalCode: '',
  })

  const {
    runContractFunction: registerCompany,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!, 
    functionName: "registerCompany",
    params: {
      _city: companyRegistrationForm.city,
      _state: companyRegistrationForm.province,
      _postalCode: companyRegistrationForm.postalCode,
      _subAdministrativeArea: companyRegistrationForm.province,
      _country: companyRegistrationForm.country,
      _isoCountryCode: companyRegistrationForm.country,
    },

  });
  
  const signUp = async (ev) => {
    ev.preventDefault();

    await registerCompany({
      onError: (error) => {
        console.error(error)
      },
      onSuccess: (results: any) => {
        console.log('onSuccess', results);
      },
      onComplete: () => {
        console.log('onComplete');
      }
    });
  }

  return (
    <div className="bg-white sm:mx-auto sm:w-full sm:max-w-md sm:overflow-hidden sm:rounded-lg">
      <div className="px-4 py-8 sm:px-10">
        <div>
          <div className="mt-1">
            {!user && showLoginInNavbar ? (
              <button
                type="button"
                onClick={login}
                className="relative flex rounded-xl bg-blue-500 px-4 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
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
                    href={`https://rinkeby.etherscan.io/address/${user.get(
                      "ethAddress"
                    )}`}
                    target="_blank"
                    className="text-gray-900 hover:underline"
                    rel="noreferrer"
                  >
                    {user.get("ethAddress")}
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
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={companyRegistrationForm.country}
                  onChange={(e) => {
                    setCompanyRegistrationForm({
                      ...companyRegistrationForm,
                      country: e.target.value,
                    });
                  }}
                >
                  <option>United States</option>
                  <option>Canada</option>
                </select>
              </div>
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
                  value={companyRegistrationForm.city}
                  onChange={(e) => {
                    setCompanyRegistrationForm({
                      ...companyRegistrationForm,
                      city: e.target.value,
                    });
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="company_state"
                  className="block text-sm font-medium text-gray-700"
                >
                  Province
                </label>
                <input
                  type="text"
                  name="company_state"
                  id="company_state"
                  autoComplete="province"
                  placeholder="Province"
                  value={companyRegistrationForm.province}
                  onChange={(e) => {
                    setCompanyRegistrationForm({
                      ...companyRegistrationForm,
                      province: e.target.value,
                    });
                  }}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="zip-or-postal-code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Postal code
                </label>
                <input
                  id="zip-or-postal-code"
                  name="zip-or-postal-code"
                  type="text"
                  placeholder="Postal code"
                  autoComplete="postal-code"
                  required
                  value={companyRegistrationForm.postalCode}
                  onChange={(e) => {
                    setCompanyRegistrationForm({
                      ...companyRegistrationForm,
                      postalCode: e.target.value,
                    });
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <button
                  type="submit"
                  onClick={signUp}
                  disabled={isFetching || isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
      {!!user ? (
        <div className="border-t-2 border-gray-200 bg-gray-50 px-4 py-6 sm:px-10">
          <p className="text-xs leading-5 text-gray-500">
            Check our
            <Link href="/disclaimer">
              <a className="pl-1 font-medium text-gray-900 hover:underline">
                Disclaimer
              </a>
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default QuickSignUp
