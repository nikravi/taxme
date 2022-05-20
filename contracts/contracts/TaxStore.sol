//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract TaxStore is ChainlinkClient {
  using Chainlink for Chainlink.Request;

  bytes public data;
  string public data_string;

  /**
   * @notice Initialize the link token and target oracle
   * @dev The oracle address must be an Operator contract for multiword response
   *
   *
   * Kovan Testnet details:
   * Link Token: 0xa36085F69e2889c224210F603D836748e7dC0088
   * Oracle: 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8 (Chainlink DevRel)
   *
   * Rinkeby Testnet details:
   * Link Token: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709
   * Oracle: ...
   *
   */
  constructor() {
    setChainlinkToken(0x01BE23585060835E02B77ef475b0Cc51aA1e0709);
    setChainlinkOracle(CHAINLINK_ORACLE_ADDRESS);
  }

  /**
   * @notice Request variable bytes from the oracle
   */
  function requestBytes() public {
    bytes32 specId = CHAINLINK_NODE_JOB_ID;
    uint256 payment = 100000000000000000;
    Chainlink.Request memory req = buildChainlinkRequest(
      specId,
      address(this),
      this.fulfillBytes.selector
    );
    req.add("path", "serializedGst");
    sendOperatorRequest(req, payment);
  }

  event RequestFulfilled(bytes32 indexed requestId, bytes indexed data);

  /**
   * @notice Fulfillment function for variable bytes
   * @dev This is called by the oracle.
   */
  function fulfillBytes(bytes32 requestId, bytes memory bytesData)
    public
    recordChainlinkFulfillment(requestId)
  {
    emit RequestFulfilled(requestId, bytesData);
    data = bytesData;
    data_string = string(data);
  }
}
