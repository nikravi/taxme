/* eslint-disable no-process-exit */
// yarn hardhat run scripts/deploy-taxme.ts --network rinkeby
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { verify } from "../helper-functions"

async function deployTaxMe(): Promise<void> {
  const TaxMe = await ethers.getContractFactory("TaxMe")
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const taxStoreContract = await ethers.getContract(`TaxStore`)

  const taxMe = await deploy("TaxMe", {
        from: deployer,
        args: [taxStoreContract.address],
        log: true,
        waitConfirmations: 6,
    })

  console.log("TaxMe deployed to:", taxMe.address) 
  const taxMeContract = await ethers.getContract(`TaxMe`)
  const qcCollectorTx = await taxMeContract.addTaxCollector('qc', '0x5c04ce3918cfb2535E249e0dFe6955FEd5D831EE')
  console.log("TaxMe adding qc collector", qcCollectorTx.hash) 
  await qcCollectorTx.wait(1)
  const onCollectorTx = await taxMeContract.addTaxCollector('on', '0xc6515783D05DfDF8fb2d4B6866929ba5493C06e0')
  console.log("TaxMe adding on collector", onCollectorTx.hash)
  await onCollectorTx.wait(1)
  const gstCollectorTx = await taxMeContract.addTaxCollector('gst', '0x8Eb858508F36553a72284Ad8e9f9F51A96bAE6Df')
  console.log("TaxMe adding gst collector", gstCollectorTx.hash)
  await gstCollectorTx.wait(1)

  // verify on etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    await verify(taxMe.address, [taxStoreContract.address])
  }
}

deployTaxMe()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
