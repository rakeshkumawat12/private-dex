import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("WhitelistManager", function () {
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      expect(await whitelistManager.owner()).to.equal(owner.address);
    });

    it("Should start unpaused", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      expect(await whitelistManager.paused()).to.equal(false);
    });
  });

  describe("Adding to whitelist", function () {
    it("Should allow owner to add address to whitelist", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(whitelistManager.addToWhitelist(user1.address))
        .to.emit(whitelistManager, "AddressWhitelisted")
        .withArgs(user1.address);

      expect(await whitelistManager.isWhitelisted(user1.address)).to.equal(true);
    });

    it("Should not allow non-owner to add to whitelist", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(
        whitelistManager.connect(user1).addToWhitelist(user2.address)
      ).to.be.revertedWithCustomError(whitelistManager, "OwnableUnauthorizedAccount");
    });

    it("Should not allow adding zero address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(
        whitelistManager.addToWhitelist(ethers.ZeroAddress)
      ).to.be.revertedWith("WhitelistManager: zero address");
    });

    it("Should not allow adding already whitelisted address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      await expect(
        whitelistManager.addToWhitelist(user1.address)
      ).to.be.revertedWith("WhitelistManager: already whitelisted");
    });
  });

  describe("Batch adding to whitelist", function () {
    it("Should allow batch adding multiple addresses", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      const addresses = [user1.address, user2.address, user3.address];
      await whitelistManager.batchAddToWhitelist(addresses);

      for (const addr of addresses) {
        expect(await whitelistManager.isWhitelisted(addr)).to.equal(true);
      }
    });

    it("Should skip already whitelisted addresses in batch", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      const addresses = [user1.address, user2.address];

      await whitelistManager.batchAddToWhitelist(addresses);

      expect(await whitelistManager.isWhitelisted(user1.address)).to.equal(true);
      expect(await whitelistManager.isWhitelisted(user2.address)).to.equal(true);
    });

    it("Should revert if batch contains zero address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      const addresses = [user1.address, ethers.ZeroAddress, user2.address];
      await expect(
        whitelistManager.batchAddToWhitelist(addresses)
      ).to.be.revertedWith("WhitelistManager: zero address");
    });
  });

  describe("Removing from whitelist", function () {
    it("Should allow owner to remove address from whitelist", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);

      await expect(whitelistManager.removeFromWhitelist(user1.address))
        .to.emit(whitelistManager, "AddressRemovedFromWhitelist")
        .withArgs(user1.address);

      expect(await whitelistManager.isWhitelisted(user1.address)).to.equal(false);
    });

    it("Should not allow non-owner to remove from whitelist", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);

      await expect(
        whitelistManager.connect(user1).removeFromWhitelist(user1.address)
      ).to.be.revertedWithCustomError(whitelistManager, "OwnableUnauthorizedAccount");
    });

    it("Should not allow removing non-whitelisted address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(
        whitelistManager.removeFromWhitelist(user2.address)
      ).to.be.revertedWith("WhitelistManager: not whitelisted");
    });
  });

  describe("Batch removing from whitelist", function () {
    it("Should allow batch removing multiple addresses", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      const addresses = [user1.address, user2.address, user3.address];
      await whitelistManager.batchAddToWhitelist(addresses);

      const toRemove = [user1.address, user2.address];
      await whitelistManager.batchRemoveFromWhitelist(toRemove);

      expect(await whitelistManager.isWhitelisted(user1.address)).to.equal(false);
      expect(await whitelistManager.isWhitelisted(user2.address)).to.equal(false);
      expect(await whitelistManager.isWhitelisted(user3.address)).to.equal(true);
    });

    it("Should skip non-whitelisted addresses in batch", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user2.address);
      const addresses = [user1.address, user2.address];

      await whitelistManager.batchRemoveFromWhitelist(addresses);

      expect(await whitelistManager.isWhitelisted(user2.address)).to.equal(false);
    });
  });

  describe("Pause functionality", function () {
    it("Should allow owner to pause", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(whitelistManager.pause())
        .to.emit(whitelistManager, "Paused")
        .withArgs(owner.address);

      expect(await whitelistManager.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.pause();

      await expect(whitelistManager.unpause())
        .to.emit(whitelistManager, "Unpaused")
        .withArgs(owner.address);

      expect(await whitelistManager.paused()).to.equal(false);
    });

    it("Should not allow non-owner to pause", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await expect(
        whitelistManager.connect(user1).pause()
      ).to.be.revertedWithCustomError(whitelistManager, "OwnableUnauthorizedAccount");
    });

    it("Should return false for isWhitelistedAndActive when paused", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      expect(await whitelistManager.isWhitelistedAndActive(user1.address)).to.equal(true);

      await whitelistManager.pause();

      expect(await whitelistManager.isWhitelistedAndActive(user1.address)).to.equal(false);
    });

    it("Should still return true for isWhitelisted when paused", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      await whitelistManager.pause();
      expect(await whitelistManager.isWhitelisted(user1.address)).to.equal(true);
    });
  });

  describe("isWhitelistedAndActive", function () {
    it("Should return true for whitelisted address when not paused", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      expect(await whitelistManager.isWhitelistedAndActive(user1.address)).to.equal(true);
    });

    it("Should return false for non-whitelisted address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      expect(await whitelistManager.isWhitelistedAndActive(user1.address)).to.equal(false);
    });

    it("Should return false when paused even for whitelisted address", async function () {
      const whitelistManager = await ethers.deployContract("WhitelistManager");
      await whitelistManager.addToWhitelist(user1.address);
      await whitelistManager.pause();
      expect(await whitelistManager.isWhitelistedAndActive(user1.address)).to.equal(false);
    });
  });
});
