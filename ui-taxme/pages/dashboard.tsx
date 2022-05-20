import * as React from "react";
import { useEffect, useState } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import EditAddress from "../components/EditAddress";
import Layout from "../components/Layout";
import TaxCollectors from "../components/TaxCollectors";

import { TaxMeContractAddress } from "../constants/addresses";

const DashboardPage = () => {
  return (
    <Layout title="Dashboard | TaxMe">
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <EditAddress />

        <TaxCollectors />
      </div>
    </Layout>
  );
};

export default DashboardPage;
