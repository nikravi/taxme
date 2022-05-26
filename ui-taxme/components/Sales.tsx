import * as React from "react";
import { useEffect, useState } from "react";
import {
  useMoralis,
  useMoralisCloudFunction,
  useMoralisQuery,
  useMoralisWeb3Api,
  useWeb3Contract,
} from "react-moralis";
import abi from "../constants/abi-taxme.json";
import { TaxMeContractAddress } from "../constants/addresses";
import { USDCDecimals } from "../constants/stable-coins";
import Sale from "../interfaces/Sales";
import { classNames, ethAddressDisplay, formatCurrency } from "../utils/utils";

const Sales = () => {
  const {
    data: sales,
    error,
    isLoading,
  } = useMoralisQuery<Sale>("sales", (q) => q.descending("createdAt"), [], {
    // FIXME: live not working?
    live: true,
  });

  const { Moralis } = useMoralis();

  return (
    <div className="mt-6 pt-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            Sales
          </h1>

        </div>
      </div>
      <div className="mt-4 flex flex-col">
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
                      Created on
                    </th>

                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500"
                    >
                      Regional tax
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500"
                    >
                      National tax
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sales.map((sale) => (
                    <tr key={sale.get("transaction_hash")}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-500	 sm:pl-6">
                        {" "}
                        <a
                          href={`https://rinkeby.etherscan.io/tx/${sale.get(
                            "transaction_hash"
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block px-4 py-2 text-sm text-gray-700"
                        >
                          {sale.get("createdAt")?.toLocaleString()}{" "}
                          <span className="underline">
                            {ethAddressDisplay(sale.get("transaction_hash"))}
                          </span>
                        </a>
                      </td>

                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatCurrency(
                          Moralis.Units.FromWei(
                            sale.get("amount"),
                            USDCDecimals
                          )
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {formatCurrency(
                          Moralis.Units.FromWei(
                            sale.get("regionalTaxAmount"),
                            USDCDecimals
                          )
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {formatCurrency(
                          Moralis.Units.FromWei(
                            sale.get("nationalTaxAmount"),
                            USDCDecimals
                          )
                        )}
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

export default Sales;
