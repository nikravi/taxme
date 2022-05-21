//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 */

/**
 * @notice DO NOT USE THIS CODE IN PRODUCTION. This is an example contract.
 */
contract TaxStore is ChainlinkClient {
  using Chainlink for Chainlink.Request;

  mapping(string => string) public taxes;

  /**
   * @notice Initialize the link token and target oracle
   * @dev The oracle address must be an Operator contract for multiword response
   *
   *
   * Kovan Testnet details:
   * Link Token: 0xa36085F69e2889c224210F603D836748e7dC0088
   * Oracle: 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8 (Chainlink DevRel)
   *
   */
  constructor() {
    setChainlinkToken(0x01BE23585060835E02B77ef475b0Cc51aA1e0709);
    setChainlinkOracle(0x220143aF6cF907FE803D6d99756841ba1D1Cda8a);
  }

  /**
   * @notice Request variable bytes from the oracle
   */
  function requestBytes() public {
    bytes32 specId = "b29d751d617b4e1c8d8e4f6d81657567";
    uint256 payment = 100000000000000000;
    Chainlink.Request memory req = buildChainlinkRequest(
      specId,
      address(this),
      this.fulfillBytes.selector
    );
    req.add("path", "serializedData");
    sendOperatorRequest(req, payment);
  }

  event RequestFulfilled(bytes32 indexed requestId, string[2][] data);

  /**
   * @notice Fulfillment function for variable bytes
   * @dev This is called by the oracle. recordChainlinkFulfillment must be used.
   */
  function fulfillBytes(bytes32 requestId, string[2][] memory taxesData)
    public
    recordChainlinkFulfillment(requestId)
  {
    emit RequestFulfilled(requestId, taxesData);

    uint256 length = taxesData.length;
    for (uint256 i = 0; i < length; i++) {
      taxes[taxesData[i][0]] = taxesData[i][1];
    }
  }
}
