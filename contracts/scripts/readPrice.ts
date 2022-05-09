/* eslint-disable no-process-exit */
// yarn hardhat node
// yarn hardhat run scripts/readPrice.ts --network localhost
import { ethers } from "hardhat"
import { BigNumber } from "ethers"
import { PriceConsumerV3 } from "../typechain"

async function readPrice(): Promise<void> {
  const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3")
  const priceConsumerV3Contract = await PriceConsumerV3.deploy(
    "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e"
  )

  await priceConsumerV3Contract.deployed()

  const price: BigNumber = await priceConsumerV3Contract.getLatestPrice()
  console.log(price.toString())
}

readPrice()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
