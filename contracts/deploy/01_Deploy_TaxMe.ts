import { DeployFunction } from "hardhat-deploy/types"
import { ethers, network } from "hardhat"
import {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
import { verify } from "../helper-functions"

const deployFunction: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments

  const { deployer, buyer } = await getNamedAccounts()

  const chainId: number | undefined = network.config.chainId
  if (!chainId) return

  let linkTokenAddress: string | undefined
  let oracle: string | undefined
  let additionalMessage: string = ``
  // set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

  if (chainId === 31337) {
    let linkToken = await get(`LinkToken`)
    let MockOracle = await get(`MockOracle`)
    // sample ERC20 stable token
    await deploy(`CUSDToken`, {
      from: buyer,
      args: [1000],
    })
    linkTokenAddress = linkToken.address
    oracle = MockOracle.address
    additionalMessage = ` --linkaddress ${linkTokenAddress}`
  } else {
    linkTokenAddress = networkConfig[chainId].linkToken
    oracle = networkConfig[chainId].oracle
  }

  const waitBlockConfirmations: number = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS
  log(`----------------------------------------------------`)
  const taxMe = await deploy("TaxMe", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")
    await verify(taxMe.address, [])
  }

  // log("Run Price Feed contract with command:")
  // const networkName = network.name == "hardhat" ? "localhost" : network.name
  // log(`yarn hardhat read-price-feed --contract ${taxMe.address} --network ${networkName}`)
  log("----------------------------------------------------")
}

export default deployFunction
deployFunction.tags = [`all`, `taxme`]
