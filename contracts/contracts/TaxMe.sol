// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title The TaxMe contract
 * @notice A contract that registers new companies and withholds the sales taxes for them
 */
contract TaxMe is Ownable {
  using SafeERC20 for IERC20;
  mapping(address => _Address) public companiesAddresses;

  // countryIsoCode/state/province/city → tax collector address
  mapping(string => address) public taxCollectors;

  // company → collector address → tax amount
  mapping(address => mapping(address => uint256)) public companiesTaxes;

  // address model from https://developer.apple.com/documentation/contacts/cnpostaladdress
  struct _Address {
    // string street;
    string city;
    string state;
    string postalCode;
    // county/ region
    string subAdministrativeArea;
    //  city/ town
    // string subLocality;
    string country;
    // ISO 3166-1 alpha-2 standard. eg: CA, US, GB, etc.
    string isoCountryCode;
  }

  event CompanyRegistered(address indexed account, _Address indexed postalAddress);

  event UpdateTaxCollector(
    string indexed region,
    address indexed previousTaxCollector,
    address indexed newTaxCollector
  );

  /**
   * @notice Executes once when a contract is created to initialize state variables
   */
  constructor() {}

  function addTaxCollector(string calldata region, address collector) public onlyOwner {
    address previousTaxCollector = taxCollectors[region];
    taxCollectors[region] = collector;
    emit UpdateTaxCollector(region, previousTaxCollector, collector);
  }

  function registerCompany(
    string calldata _city,
    string calldata _state,
    string calldata _postalCode,
    string calldata _subAdministrativeArea,
    string calldata _country,
    string calldata _isoCountryCode
  ) public {
    _Address memory addr = _Address(
      _city,
      _state,
      _postalCode,
      _subAdministrativeArea,
      _country,
      _isoCountryCode
    );
    companiesAddresses[msg.sender] = addr;
    // console.log("Registered company: %s", msg.sender);
    emit CompanyRegistered(msg.sender, addr);
  }

  function sale(
    address company,
    address token,
    uint256 fullAmount,
    string calldata productCategoryId,
    string calldata clientPostalCode,
    string calldata clientIsoCountryCode
  ) public payable {
    require(fullAmount > 0);

    (
      uint256 regionalAmount,
      uint256 nationalAmount,
      _Address memory companyAddress
    ) = _calculateAmounts(
        company,
        fullAmount,
        productCategoryId,
        clientPostalCode,
        clientIsoCountryCode
      );

    uint256 companyAmount = fullAmount - regionalAmount - nationalAmount;
    IERC20(token).safeTransferFrom(msg.sender, address(this), regionalAmount + nationalAmount);
    _registerCompanyTax(company, companyAddress, regionalAmount, nationalAmount);

    // transfer amount after taxes
    IERC20(token).safeTransferFrom(msg.sender, company, companyAmount);

    // todo: store exchange rate of token for ACB accounting. Chainlink logs in Filecoin?
  }

  function _registerCompanyTax(
    address company,
    _Address memory companyAddress,
    uint256 regionalAmount,
    uint256 nationalAmount
  ) private {
    address regionalTaxCollector = taxCollectors[companyAddress.state];
    _addTax(company, regionalTaxCollector, regionalAmount);
    address nationalTaxCollector = taxCollectors[companyAddress.country];
    _addTax(company, nationalTaxCollector, nationalAmount);
  }

  // internal tracking of the tax amount for a company
  function _addTax(
    address company,
    address taxCollector,
    uint256 amount
  ) private {
    if (companiesTaxes[company][taxCollector] == 0) {
      companiesTaxes[company][taxCollector] = amount;
    } else {
      companiesTaxes[company][taxCollector] += amount;
    }
  }

  function _calculateAmounts(
    address company,
    uint256 fullAmount,
    string calldata productCategoryId,
    string calldata clientPostalCode,
    string calldata clientIsoCountryCode
  )
    internal
    view
    returns (
      uint256 regionalAmount,
      uint256 nationalAmount,
      _Address memory companyAddress
    )
  {
    companyAddress = companiesAddresses[company];

    (uint256 rate, uint256 nationalRate) = getTaxRates(
      productCategoryId,
      clientPostalCode,
      companyAddress
    );

    regionalAmount = (fullAmount * rate) / 100;
    nationalAmount = (fullAmount * nationalRate) / 100;
    return (regionalAmount, nationalAmount, companyAddress);
  }

  function getTaxRates(
    string calldata productCategoryId,
    string calldata clientPostalCode,
    _Address memory companyAddress
  ) internal pure returns (uint256 localRate, uint256 nationalRate) {
    if (keccak256(abi.encodePacked(productCategoryId)) == keccak256(abi.encodePacked("1"))) {
      // todo: get tax rates from the oracle
      return (8, 5);
    }
  }
}
