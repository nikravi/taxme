// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "hardhat/console.sol";

interface TaxStoreInterface {
  function taxes(string memory name) external view returns (string memory taxValue);
}

error TaxMe_CountryNotSupported(string country);
error TaxMe_ProductCategoryNotSupported(string productCategory);
error TaxMe_AmountInsufficient(uint256 amount);

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

  event Sale (
    address indexed company,
    uint256 amount,
    uint256 regionalTaxAmount,
    uint256 nationalTaxAmount
  );

  TaxStoreInterface internal immutable taxStore;
  constructor(address _taxStore) {
    taxStore = TaxStoreInterface(_taxStore);
  }

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

function preSale(
    address company,
    uint256 amount,
    string calldata productCategoryId,
    string calldata clientState,
    string calldata clientIsoCountryCode
  ) view public returns (uint256, uint256)  {
    if (amount == 0) {
      revert TaxMe_AmountInsufficient(amount);
    }
    if (!stringsEqual(clientIsoCountryCode, "ca")) {
      revert TaxMe_CountryNotSupported(clientIsoCountryCode);
    }

    (
      uint256 regionalTaxAmount,
      uint256 nationalTaxAmount,
    ) = _calculateAmounts(
        company,
        amount,
        productCategoryId,
        clientState
      );

    return (
      regionalTaxAmount,
      nationalTaxAmount
    );
  }

  function sale(
    address company,
    address token,
    uint256 amount,
    string calldata productCategoryId,
    string calldata clientState,
    string calldata clientIsoCountryCode
  ) public payable {
    if (amount == 0) {
      revert TaxMe_AmountInsufficient(amount);
    }
    if (!stringsEqual(clientIsoCountryCode, "ca")) {
      revert TaxMe_CountryNotSupported(clientIsoCountryCode);
    }

    (
      uint256 regionalTaxAmount,
      uint256 nationalTaxAmount,
      _Address memory companyAddress
    ) = _calculateAmounts(
        company,
        amount,
        productCategoryId,
        clientState
      );

    IERC20(token).safeTransferFrom(msg.sender, address(this), regionalTaxAmount + nationalTaxAmount);
    _registerCompanyTax(company, companyAddress, regionalTaxAmount, nationalTaxAmount);

    // transfer amount after taxes
    IERC20(token).safeTransferFrom(msg.sender, company, amount);

    emit Sale(company, amount, regionalTaxAmount, nationalTaxAmount);
    // todo: store exchange rate of token for ACB accounting. Chainlink logs in Filecoin?
  }

  function _registerCompanyTax(
    address company,
    _Address memory companyAddress,
    uint256 regionalTaxAmount,
    uint256 nationalTaxAmount
  ) private {
    address regionalTaxCollector = taxCollectors[companyAddress.state];
    _addTax(company, regionalTaxCollector, regionalTaxAmount);
    address nationalTaxCollector = taxCollectors[companyAddress.country];
    _addTax(company, nationalTaxCollector, nationalTaxAmount);
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
    string calldata clientState
  )
    internal
    view
    returns (
      uint256 regionalTaxAmount,
      uint256 nationalTaxAmount,
      _Address memory companyAddress
    )
  {
    companyAddress = companiesAddresses[company];

    (uint256 regionalRate, uint256 nationalRate) = getTaxRates(
      productCategoryId,
      clientState,
      companyAddress
    );

    regionalTaxAmount = (fullAmount * regionalRate / 1000) / 100;
    nationalTaxAmount = (fullAmount * nationalRate/ 1000) / 100;
    return (regionalTaxAmount, nationalTaxAmount, companyAddress);
  }
 
  function getTaxRates(
    string calldata productCategoryId,
    string calldata clientState,
    _Address memory companyAddress
  ) public view returns (uint256 regionalRate, uint256 nationalRate) {
    if (!stringsEqual(productCategoryId, "1")) {
      revert TaxMe_ProductCategoryNotSupported(productCategoryId);
    }
      
    string memory gst = taxStore.taxes('gst');
    string memory pst = taxStore.taxes(companyAddress.state);

    nationalRate = stringToUint(gst);
    if (stringsEqual(companyAddress.state, clientState)) {
      regionalRate = stringToUint(pst);
    } else {
      regionalRate = 0;
    }
  }

  // utils
  function stringsEqual(string memory a, string memory b) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function stringToUint(string memory str) internal pure returns (uint) {
    // from provable lib
    bytes memory bresult = bytes(str);
    uint mint = 0;
    // decimals?
    uint _b = 0;
    bool decimals = false;
    for (uint i=0; i<bresult.length; i++){
      // using uint8 because the numbers are small < 10000
        if ((uint8(bresult[i]) >= 48)&&(uint8(bresult[i]) <= 57)){
            if (decimals){
                if (_b == 0) break;
                else _b--;
            }
            mint *= 10;
            mint += uint8(bresult[i]) - 48;
        } else if (uint8(bresult[i]) == 46) decimals = true;
    }
    if (_b > 0) mint *= 10**_b;
    return mint;
  }
}
