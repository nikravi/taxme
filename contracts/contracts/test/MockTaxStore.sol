// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

contract MockTaxStore {
  mapping(string => string) public taxes;

  function registerTax(string calldata _region, string calldata _tax) public {
    taxes[_region] = _tax;
  }
}
