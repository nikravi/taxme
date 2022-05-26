import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { assert, expect } from "chai"
import { BigNumber } from "ethers"
import { deployments, network, ethers } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { CUSDToken } from "../../typechain"
import { TaxMe } from "../../typechain/TaxMe"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe.only("TaxMe Unit Tests", async function () {
      let taxMe: TaxMe
      let CUSDToken: CUSDToken
      const city = "Ottawa"
      const province = "on"
      const country = "Canada"
      const postalCode = "K1G 0Z3"
      const isoCode = "CA"

      beforeEach(async () => {
        await deployments.fixture(["mocks", "taxme"])
        taxMe = await ethers.getContract("TaxMe")
        CUSDToken = await ethers.getContract("CUSDToken")
      })

      describe("is ownable", () => {
        it("should be able to transfer ownership", async () => {
          const owner = await taxMe.owner()

          const [
            signer,
            taxCollector,
            otherTaxCollector,
            companyAccount,
            buyer,
          ] = await ethers.getSigners()

          expect(owner).to.equal(signer.address)
          const tx = await taxMe.transferOwnership(taxCollector.address)
          expect(await taxMe.owner()).to.equal(taxCollector.address)
          await tx.wait()
          expect(await taxMe.owner()).to.equal(taxCollector.address)
        })
      })

      describe("register a company", () => {
        it("registers a company", async () => {
          const [
            signer,
            taxCollector,
            otherTaxCollector,
            companyAccount,
            buyer,
          ]: SignerWithAddress[] = await ethers.getSigners()
          await expect(
            taxMe
              .connect(companyAccount)
              .registerCompany(city, province, postalCode, province, country, isoCode)
          ).to.emit(taxMe, "CompanyRegistered")
          // how to test this?
          // .withArgs(signer.address, [
          //   city, province, postalCode, province, province, country, isoCode
          // ])
        })

        it("holds company address", async () => {
          await taxMe.registerCompany(city, province, postalCode, province, country, isoCode)

          const [signer]: SignerWithAddress[] = await ethers.getSigners()
          const addr = await taxMe.companiesAddresses(signer.address)
          const [c_city, c_state, c_postalCode, c_admArea, c_country, c_iso] = addr

          assert.equal(c_city, city)
          assert.equal(c_state, province)
          assert.equal(c_postalCode, postalCode)
          assert.equal(c_admArea, province)
          assert.equal(c_country, country)
          assert.equal(c_iso, isoCode)
        })
      })

      describe("owner adds tax collector", () => {
        it("adds tax collector", async () => {
          const [
            signer,
            taxCollector,
            otherTaxCollector,
          ]: SignerWithAddress[] = await ethers.getSigners()
          // console.log(await taxMe.companiesAddresses(signer.address));
          await expect(taxMe.addTaxCollector(province, taxCollector.address))
            .to.emit(taxMe, "UpdateTaxCollector")
            .withArgs(province, "0x0000000000000000000000000000000000000000", taxCollector.address)

          await expect(taxMe.addTaxCollector(province, otherTaxCollector.address))
            .to.emit(taxMe, "UpdateTaxCollector")
            .withArgs(province, taxCollector.address, otherTaxCollector.address)

          expect(await taxMe.taxCollectors(province)).to.eq(otherTaxCollector.address)
        })

        it("does not allow setting the tax collector by non-owner", async () => {
          const [
            signer,
            taxCollector,
            otherTaxCollector,
          ]: SignerWithAddress[] = await ethers.getSigners()
          await expect(
            // call the function with another account
            taxMe.connect(otherTaxCollector).addTaxCollector(province, taxCollector.address)
          ).to.be.revertedWith("Ownable: caller is not the owner")
        })
      })

      describe("sales", () => {
        it("calculates taxes on pre-sale", async () => {
          const [
            owner,
            taxCollector,
            otherTaxCollector,
            companyAccount,
            buyer,
          ]: SignerWithAddress[] = await ethers.getSigners()
          await taxMe
            .connect(companyAccount)
            .registerCompany(city, province, postalCode, province, country, isoCode)

          expect(
            await taxMe.connect(buyer).preSale(companyAccount.address, "100", "1", "qc", "ca")
          // ).to.eq([ethers.BigNumber.from(0), ethers.BigNumber.from(0.05)])
          ).to.have.lengthOf(2)
        })

        it("sales a product", async () => {
          const [
            owner,
            taxCollector,
            otherTaxCollector,
            companyAccount,
            buyer,
          ]: SignerWithAddress[] = await ethers.getSigners()
          await taxMe
            .connect(companyAccount)
            .registerCompany(city, province, postalCode, province, country, isoCode)
          await taxMe.connect(owner).addTaxCollector(province, taxCollector.address)

          // allow erc20 transfer from seller to contract
          await CUSDToken.connect(buyer).approve(taxMe.address, ethers.constants.MaxUint256)
          // register tax collectors
          await expect(taxMe.addTaxCollector(province, taxCollector.address))
          await expect(taxMe.addTaxCollector(country, otherTaxCollector.address))

          await taxMe
            .connect(buyer)
            .sale(companyAccount.address, CUSDToken.address, "100", "1", "qc", "ca")

          // net amount
          expect((await CUSDToken.balanceOf(companyAccount.address)).toString()).to.eq("100")

          // gst
          expect(
            await taxMe.companiesTaxes(companyAccount.address, otherTaxCollector.address)
          ).to.eq("5")
          // pst
          expect(await taxMe.companiesTaxes(companyAccount.address, taxCollector.address)).to.eq(
            "0"
          )
        })
      })
    })
