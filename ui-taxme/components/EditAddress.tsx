import * as React from "react";
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { TaxMeContractAddress } from "../constants/addresses";
import abi from "../constants/abi.json";

const EditAddress = () => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    enableWeb3,
    isWeb3Enabled,
  } = useMoralis();

  useEffect(() => {
    if (isWeb3Enabled) {
      checkIfUserIsRegistered();
    }
  }, [isWeb3Enabled]);

  const { runContractFunction: companiesAddresses } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!,
    functionName: "companiesAddresses",
    // abi for the function params, it has empty name
    params: { "": user?.get("ethAddress") },
  });

  // company registration form
  const [companyRegistrationForm, setCompanyRegistrationForm] = useState({
    country: "Canada",
    province: "",
    city: "",
    postalCode: "",
  });

  const checkIfUserIsRegistered = async () => {
    await companiesAddresses({
      onSuccess: (address: any) => {
        console.log(address);

        if (address.country) {
          setCompanyRegistrationForm({
            country: address.country,
            province: address.state,
            city: address.city,
            postalCode: address.postalCode,
          });
        }
      },
      onError: (error) => {
        console.error("error", error);
      },
    });
  };

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
        console.error(error);
      },
      onSuccess: (results: any) => {
        console.log('signUp', results);
      },
    });
  };

  return (
    <div>
      <h1 className="my-4 mt-6 text-xl font-semibold text-gray-900">Address</h1>
      <div className="mt-4">
        <form action="#" method="POST" className="grid grid-cols-4 gap-4">
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
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAddress;
