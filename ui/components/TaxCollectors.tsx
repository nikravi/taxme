import Web3Api from "moralis/types/generated/web3Api";
import * as React from "react";
import { useEffect, useState } from "react";
import { useMoralis, useMoralisCloudFunction, useMoralisQuery, useMoralisWeb3Api, useWeb3Contract } from "react-moralis";
import abi from "../constants/abi.json";
import { TaxMeContractAddress } from "../constants/addresses";
import TaxCollector from "../interfaces/TaxCollector";
import contentHash from "content-hash";

const TaxCollectors = () => {
  const {
    isAuthenticated,
    authenticate,
    user,
    account,
    logout,
    isWeb3Enabled,
  } = useMoralis();
  const { runContractFunction: getOwner } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!,
    functionName: "owner",
  });

  const [isOwner, setIsOwner] = React.useState(false);

  useEffect(() => {
    if (isWeb3Enabled) {
      getOwner({
        onSuccess: (ownerAddress: string) => {
          console.log({ ownerAddress });

          setIsOwner(
            user?.get("ethAddress").toUpperCase() === ownerAddress.toUpperCase()
          );
        },
        onError: (error) => {
          console.error("error fetching owner", error);
        },
      });
    }
  }, [isWeb3Enabled]);

  const {
    data: taxCollectors,
    error,
    isLoading: collectorsAreLoading,
  } = useMoralisQuery<TaxCollector>(
    "taxCollectors",
    (q) => q.descending("createdAt"),
    [],
    {
      live: true,
      // onLiveEnter: (entity, all) => [...all, entity],
      // onLiveCreate: (entity, all) => [...all, entity],
      // onLiveDelete: (entity, all) => all.filter((e) => e.id !== entity.id),
      // onLiveLeave: (entity, all) => all.filter((e) => e.id !== entity.id),
      // onLiveUpdate: (entity, all) =>
      //   all.map((e) => (e.id === entity.id ? entity : e)),
    }
  );
  console.log(taxCollectors.map((taxCollector) => taxCollector.attributes)
//   .map(c => {
//     return {
//       ...c,
//       decoded: getProvider()
//     }
//   })
  );

// const { data } = useMoralisCloudFunction("decodeString", {
//   transaction_hash:
//     "0x30007a5a56641e5447576f68be2ada3182215a7ea1930d399bc6114c0220fa16",
// });

  const [newCollector, setNewCollector] = useState(false);
  const [newCollectorForm, setNewCollectorForm] = useState({
    region: "",
    address: "",
  });

  const {
    runContractFunction: addTaxCollector,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: TaxMeContractAddress!,
    functionName: "addTaxCollector",
    params: {
      region: newCollectorForm.region,
      collector: newCollectorForm.address,
    },
  });

  const storeCollector = (ev) => {
    ev.preventDefault();

    addTaxCollector({
      onSuccess: (res) => {
        console.log("addTaxCollector", res);
        setNewCollector(false);
        setNewCollectorForm({
          region: "",
          address: "",
        });
      },
      onError: (error) => {
        console.error("error", error);
      },
    });
  };
  return (
    <div className="mt-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Tax Collectors
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all registered tax collectors' addresses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {isOwner ? (
            <>
              <span className="mr-4 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                TaxMe owner only
              </span>
              <button
                type="button"
                onClick={() => setNewCollector(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                Add tax collector
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
                    >
                      Region
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                    >
                      Address
                    </th>
                    <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {newCollector ? (
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <input
                          type="text"
                          name="newCollectorRegion"
                          id="newCollectorRegion"
                          autoComplete="province"
                          placeholder="Region"
                          required
                          value={newCollectorForm.region}
                          onChange={(e) => {
                            setNewCollectorForm({
                              ...newCollectorForm,
                              region: e.target.value,
                            });
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="text"
                          name="newCollectorRegion"
                          id="newCollectorRegion"
                          placeholder="Public ETH Address"
                          required
                          value={newCollectorForm.address}
                          onChange={(e) => {
                            setNewCollectorForm({
                              ...newCollectorForm,
                              address: e.target.value,
                            });
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <a
                          href="#"
                          onClick={storeCollector}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Save
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewCollector(false);
                            setNewCollectorForm({ region: "", address: "" });
                          }}
                          className="pl-4 text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </a>
                      </td>
                    </tr>
                  ) : null}
                  {taxCollectors.map((collector) => (
                    <tr key={collector.get("transaction_hash")}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {collector.get("region")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {collector.get("newTaxCollector")}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {isOwner ? (
                          <>
                            <a
                              href="#"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                              <span className="sr-only">
                                , {collector.get("region")}
                              </span>
                            </a>
                            <a
                              href="#"
                              className="pl-4 text-red-900 hover:text-indigo-900"
                            >
                              Delete
                              <span className="sr-only">
                                , {collector.get("region")}
                              </span>
                            </a>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCollectors;