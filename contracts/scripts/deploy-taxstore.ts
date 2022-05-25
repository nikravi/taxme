/* eslint-disable no-process-exit */
// yarn hardhat run scripts/deploy-taxstore.ts --network rinkeby
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { verify } from "../helper-functions"

async function deployTaxStore(): Promise<void> {
  const TaxStore = await ethers.getContractFactory("TaxStore")
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const taxStore = await deploy("TaxStore", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 6,
  })

  console.log("TaxStore deployed to:", taxStore.address)

  // verify on etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    await verify(taxStore.address, [])
  }
}

deployTaxStore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
