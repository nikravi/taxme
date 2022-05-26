import Moralis from "moralis/types";
import * as React from "react";
import { useEffect, useState } from "react";
import { useWeb3Contract } from "react-moralis";
import TaxCollector from "../interfaces/TaxCollector";
import abi from "../constants/abi-taxme.json";
import { TaxMeContractAddress } from "../constants/addresses";
import { ethAddressDisplay } from "../utils/utils";
import { codes } from "../constants/keccak";

//Moralis.Object<TaxCollector>
const TaxCollectorRow = ({ collector, isOwner }) => {
  const [isEdit, setIsEdit] = useState(false);

  const setEdit = (ev) => {
    ev.preventDefault();
    setIsEdit(true);
  };
  const [collectorForm, setCollectorForm] = useState({
    region: collector.get("region"),
    address: collector.get("newTaxCollector"),
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
      region: collectorForm.region,
      collector: collectorForm.address,
    },
  });

  const storeCollector = (ev) => {
    ev.preventDefault();

    addTaxCollector({
      onSuccess: (res) => {
        console.log("addTaxCollector", res);
        setIsEdit(false);
        setCollectorForm({
          region: collector.get("region"),
          address: collector.get("newTaxCollector"),
        });
      },
      onError: (error) => {
        console.error("error", error);
      },
    });
  };

  return (
    <tr key={collector.get("transaction_hash")}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-500	 sm:pl-6">
        {isEdit ? null : collector.get("createdAt")?.toLocaleString()}
      </td>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {codes[collector.get("region")] || collector.get("region")}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {isEdit ? (
          <input
            type="text"
            name="newCollectorRegion"
            id="newCollectorRegion"
            placeholder="Public ETH Address"
            required
            value={collectorForm.address}
            onChange={(e) => {
              setCollectorForm({
                ...collectorForm,
                address: e.target.value,
              });
            }}
            className="block w-full rounded-md border-gray-300 p-1 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        ) : (
          <a
            href={`https://rinkeby.etherscan.io/address/${collector.get(
              "newTaxCollector"
            )}`}
            target="_blank"
            className="underline"
            rel="noreferrer"
          >
            {collector.get("newTaxCollector")}
          </a>
        )}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        {isOwner ? (
          isEdit ? (
            <>
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
                  setIsEdit(false);
                  setCollectorForm({
                    region: collector.get("region"),
                    address: collector.get("newTaxCollector"),
                  });
                }}
                className="pl-4 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </a>
            </>
          ) : (
            <>
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-900"
                onClick={setEdit}
              >
                Edit
                <span className="sr-only">, {collector.get("region")}</span>
              </a>
              <a href="#" className="pl-4 text-red-900 hover:text-red-500">
                Delete
                <span className="sr-only">, {collector.get("region")}</span>
              </a>
            </>
          )
        ) : null}
      </td>
    </tr>
  );
};

export default TaxCollectorRow;
