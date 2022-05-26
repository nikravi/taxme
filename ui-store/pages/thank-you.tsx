import Link from "next/link";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";

import {
  ShieldCheckIcon,
} from "@heroicons/react/outline";

const features = [
  
  {
    name: "Thank you for your purchase",
    description:
      "Your order is being processed and will be shipped to you shortly.",
    icon: ShieldCheckIcon,
  },
  
];

const ThankYouPage = () => {
  return (
    <Layout title="Thank you | web3fy">
      <div className="relative bg-gray-100 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-1">
              {features.map((feature) => (
                <div key={feature.name} className="pt-6">
                  <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center rounded-md bg-indigo-500 p-3 shadow-lg">
                          <feature.icon
                            className="h-6 w-6 text-white"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium tracking-tight text-gray-900">
                        {feature.name}
                      </h3>
                      <p className="mt-5 text-base text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThankYouPage;
