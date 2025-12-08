import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Factory", function () {
  let owner, user1, user2;
  let whitelistManager, factory;
  let tokenA, tokenB, tokenC;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy WhitelistManager
    whitelistManager = await ethers.deployContract("WhitelistManager");

    // Deploy Factory
    factory = await ethers.deployContract("Factory", [await whitelistManager.getAddress()]);

    // Deploy test tokens
    tokenA = await ethers.deployContract("MockERC20", ["Token A", "TKNA", 18]);
    tokenB = await ethers.deployContract("MockERC20", ["Token B", "TKNB", 18]);
    tokenC = await ethers.deployContract("MockERC20", ["Token C", "TKNC", 18]);

    // Whitelist owner and users
    await whitelistManager.addToWhitelist(owner.address);
    await whitelistManager.addToWhitelist(user1.address);
  });

  describe("Deployment", function () {
    it("Should set the whitelist manager", async function () {
      expect(await factory.whitelistManager()).to.equal(await whitelistManager.getAddress());
    });

    it("Should start with zero pairs", async function () {
      expect(await factory.allPairsLength()).to.equal(0);
    });

    it("Should revert if deployed with zero address", async function () {
      const FactoryFactory = await ethers.getContractFactory("Factory");
      await expect(
        FactoryFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Factory: zero address");
    });
  });

  describe("Creating pairs", function () {
    it("Should create a new pair", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      const tx = await factory.createPair(tokenAAddr, tokenBAddr);
      const receipt = await tx.wait();

      // Check event
      const event = receipt.logs.find(
        (log) => log.topics[0] === factory.interface.getEvent("PairCreated").topicHash
      );
      expect(event).to.not.be.undefined;

      // Check pair exists
      const pairAddress = await factory.getPair(tokenAAddr, tokenBAddr);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      // Check pair count
      expect(await factory.allPairsLength()).to.equal(1);
    });

    it("Should create pair with tokens in correct order", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);
      const pairAddress = await factory.getPair(tokenAAddr, tokenBAddr);

      // Get pair contract
      const pair = await ethers.getContractAt("Pair", pairAddress);

      const token0 = await pair.token0();
      const token1 = await pair.token1();

      // Tokens should be sorted
      if (tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()) {
        expect(token0).to.equal(tokenAAddr);
        expect(token1).to.equal(tokenBAddr);
      } else {
        expect(token0).to.equal(tokenBAddr);
        expect(token1).to.equal(tokenAAddr);
      }
    });

    it("Should be accessible from both token orders", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);

      const pairAB = await factory.getPair(tokenAAddr, tokenBAddr);
      const pairBA = await factory.getPair(tokenBAddr, tokenAAddr);

      expect(pairAB).to.equal(pairBA);
    });

    it("Should not allow creating pair with identical addresses", async function () {
      const tokenAAddr = await tokenA.getAddress();

      await expect(
        factory.createPair(tokenAAddr, tokenAAddr)
      ).to.be.revertedWith("Factory: identical addresses");
    });

    it("Should not allow creating pair with zero address", async function () {
      const tokenAAddr = await tokenA.getAddress();

      await expect(
        factory.createPair(tokenAAddr, ethers.ZeroAddress)
      ).to.be.revertedWith("Factory: zero address");

      await expect(
        factory.createPair(ethers.ZeroAddress, tokenAAddr)
      ).to.be.revertedWith("Factory: zero address");
    });

    it("Should not allow creating duplicate pairs", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);

      await expect(
        factory.createPair(tokenAAddr, tokenBAddr)
      ).to.be.revertedWith("Factory: pair exists");

      // Also check reverse order
      await expect(
        factory.createPair(tokenBAddr, tokenAAddr)
      ).to.be.revertedWith("Factory: pair exists");
    });

    it("Should not allow non-whitelisted address to create pair", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await expect(
        factory.connect(user2).createPair(tokenAAddr, tokenBAddr)
      ).to.be.revertedWith("Factory: not whitelisted");
    });

    it("Should create multiple pairs correctly", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();
      const tokenCAddr = await tokenC.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);
      await factory.createPair(tokenAAddr, tokenCAddr);
      await factory.createPair(tokenBAddr, tokenCAddr);

      expect(await factory.allPairsLength()).to.equal(3);

      const pairAB = await factory.getPair(tokenAAddr, tokenBAddr);
      const pairAC = await factory.getPair(tokenAAddr, tokenCAddr);
      const pairBC = await factory.getPair(tokenBAddr, tokenCAddr);

      // All pairs should be unique
      expect(pairAB).to.not.equal(pairAC);
      expect(pairAB).to.not.equal(pairBC);
      expect(pairAC).to.not.equal(pairBC);
    });

    it("Should properly initialize pair with whitelist manager", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);
      const pairAddress = await factory.getPair(tokenAAddr, tokenBAddr);

      const pair = await ethers.getContractAt("Pair", pairAddress);
      expect(await pair.whitelistManager()).to.equal(await whitelistManager.getAddress());
    });

    it("Should track all pairs in allPairs array", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();
      const tokenCAddr = await tokenC.getAddress();

      await factory.createPair(tokenAAddr, tokenBAddr);
      await factory.createPair(tokenAAddr, tokenCAddr);

      const pair0 = await factory.allPairs(0);
      const pair1 = await factory.allPairs(1);

      expect(pair0).to.not.equal(ethers.ZeroAddress);
      expect(pair1).to.not.equal(ethers.ZeroAddress);
      expect(pair0).to.not.equal(pair1);
    });

    it("Should emit PairCreated event with correct parameters", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      const [token0Addr, token1Addr] =
        tokenAAddr.toLowerCase() < tokenBAddr.toLowerCase()
          ? [tokenAAddr, tokenBAddr]
          : [tokenBAddr, tokenAAddr];

      const tx = await factory.createPair(tokenAAddr, tokenBAddr);
      const receipt = await tx.wait();

      const pairAddress = await factory.getPair(tokenAAddr, tokenBAddr);

      // Find PairCreated event
      const event = receipt.logs.find(
        (log) => log.topics[0] === factory.interface.getEvent("PairCreated").topicHash
      );

      const decoded = factory.interface.decodeEventLog("PairCreated", event.data, event.topics);

      expect(decoded.token0).to.equal(token0Addr);
      expect(decoded.token1).to.equal(token1Addr);
      expect(decoded.pair).to.equal(pairAddress);
      expect(decoded.pairNumber).to.equal(1n);
    });
  });

  describe("Whitelist enforcement", function () {
    it("Should block pair creation when whitelist is paused", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await whitelistManager.pause();

      await expect(
        factory.createPair(tokenAAddr, tokenBAddr)
      ).to.be.revertedWith("Factory: not whitelisted");
    });

    it("Should allow pair creation after unpause", async function () {
      const tokenAAddr = await tokenA.getAddress();
      const tokenBAddr = await tokenB.getAddress();

      await whitelistManager.pause();
      await whitelistManager.unpause();

      await factory.createPair(tokenAAddr, tokenBAddr);
      const pairAddress = await factory.getPair(tokenAAddr, tokenBAddr);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
});
