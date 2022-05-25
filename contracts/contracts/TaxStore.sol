//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

contract TaxStore is ChainlinkClient, KeeperCompatibleInterface {
  using Chainlink for Chainlink.Request;

  mapping(string => string) public taxes;

  uint256 public interval = 2592000; //30 days
  uint256 public lastTimeStamp;

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

  function checkUpkeep(bytes calldata)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory)
  {
    upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
  }

  function performUpkeep(bytes calldata) external override {
    if ((block.timestamp - lastTimeStamp) > interval) {
      lastTimeStamp = block.timestamp;
      requestBytes();
    }
  }
}
