/* eslint-disable no-process-exit */
// yarn hardhat run scripts/deploy-taxme.ts --network rinkeby
import { ethers } from "hardhat"
import { verify } from "../helper-functions"

async function deployTaxMe(): Promise<void> {
  const TaxMe = await ethers.getContractFactory("TaxMe")
  // todo: wait confirmations + verify
  // const taxMe = await deploy("TaxMe", {
  //       from: deployer,
  //       args: [],
  //       log: true,
  //       waitConfirmations: 6,
  //   })
  const taxMe = await TaxMe.deploy()

  await taxMe.deployed()

  console.log("TaxMe deployed to:", taxMe.address) 

  // verify on etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    await verify(taxMe.address, [])
  }
}

deployTaxMe()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
