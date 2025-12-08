import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Router and Pair Integration", function () {
  let owner, user1, user2;
  let whitelistManager, factory, router;
  let tokenA, tokenB, tokenC;
  let pairAB;

  const INITIAL_SUPPLY = ethers.parseEther("10000");
  const LIQUIDITY_A = ethers.parseEther("100");
  const LIQUIDITY_B = ethers.parseEther("200");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy core contracts
    whitelistManager = await ethers.deployContract("WhitelistManager");
    factory = await ethers.deployContract("Factory", [await whitelistManager.getAddress()]);
    router = await ethers.deployContract("Router", [
      await factory.getAddress(),
      await whitelistManager.getAddress(),
    ]);

    // Deploy test tokens
    tokenA = await ethers.deployContract("MockERC20", ["Token A", "TKNA", 18]);
    tokenB = await ethers.deployContract("MockERC20", ["Token B", "TKNB", 18]);
    tokenC = await ethers.deployContract("MockERC20", ["Token C", "TKNC", 18]);

    // Mint tokens to owner and user1
    await tokenA.mint(owner.address, INITIAL_SUPPLY);
    await tokenB.mint(owner.address, INITIAL_SUPPLY);
    await tokenC.mint(owner.address, INITIAL_SUPPLY);
    await tokenA.mint(user1.address, INITIAL_SUPPLY);
    await tokenB.mint(user1.address, INITIAL_SUPPLY);

    // Whitelist addresses
    await whitelistManager.addToWhitelist(owner.address);
    await whitelistManager.addToWhitelist(user1.address);
    await whitelistManager.addToWhitelist(await router.getAddress());

    // Create pair
    await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    pairAB = await ethers.getContractAt("Pair", pairAddress);
  });

  describe("Router Deployment", function () {
    it("Should set factory and whitelist manager", async function () {
      expect(await router.factory()).to.equal(await factory.getAddress());
      expect(await router.whitelistManager()).to.equal(await whitelistManager.getAddress());
    });

    it("Should revert if deployed with zero addresses", async function () {
      const RouterFactory = await ethers.getContractFactory("Router");
      await expect(
        RouterFactory.deploy(ethers.ZeroAddress, await whitelistManager.getAddress())
      ).to.be.revertedWith("Router: zero address");

      await expect(
        RouterFactory.deploy(await factory.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Router: zero address");
    });
  });

  describe("Adding Liquidity", function () {
    it("Should add initial liquidity", async function () {
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const tx = await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );

      const receipt = await tx.wait();

      // Check LP tokens minted
      const lpBalance = await pairAB.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0);
    });

    it("Should add liquidity proportionally", async function () {
      // First liquidity addition
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );

      // Second liquidity addition
      const liquidityA2 = ethers.parseEther("50");
      const liquidityB2 = ethers.parseEther("100");

      await tokenA.approve(await router.getAddress(), liquidityA2);
      await tokenB.approve(await router.getAddress(), liquidityB2);

      const [amountA, amountB, liquidity] = await router.addLiquidity.staticCall(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        liquidityA2,
        liquidityB2,
        0,
        0,
        owner.address,
        deadline
      );

      expect(amountA).to.equal(liquidityA2);
      expect(amountB).to.equal(liquidityB2);
    });

    it("Should revert if min amounts not met", async function () {
      // Add initial liquidity first
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );

      // Try to add with unrealistic min amounts
      await tokenA.approve(await router.getAddress(), ethers.parseEther("100"));
      await tokenB.approve(await router.getAddress(), ethers.parseEther("100"));

      await expect(
        router.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          ethers.parseEther("100"),
          ethers.parseEther("200"), // This will fail due to ratio (should be ~200)
          owner.address,
          deadline
        )
      ).to.be.revertedWith("Router: insufficient A amount");
    });

    it("Should revert if deadline passed", async function () {
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);

      const pastDeadline = Math.floor(Date.now() / 1000) - 3600;

      await expect(
        router.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          LIQUIDITY_A,
          LIQUIDITY_B,
          0,
          0,
          owner.address,
          pastDeadline
        )
      ).to.be.revertedWith("Router: expired");
    });

    it("Should not allow non-whitelisted to add liquidity", async function () {
      await tokenA.connect(user2).mint(user2.address, LIQUIDITY_A);
      await tokenB.connect(user2).mint(user2.address, LIQUIDITY_B);
      await tokenA.connect(user2).approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.connect(user2).approve(await router.getAddress(), LIQUIDITY_B);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user2).addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          LIQUIDITY_A,
          LIQUIDITY_B,
          0,
          0,
          user2.address,
          deadline
        )
      ).to.be.revertedWith("Router: not whitelisted");
    });
  });

  describe("Removing Liquidity", function () {
    beforeEach(async function () {
      // Add initial liquidity
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("Should remove liquidity", async function () {
      const lpBalance = await pairAB.balanceOf(owner.address);
      await pairAB.approve(await router.getAddress(), lpBalance);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const balanceABefore = await tokenA.balanceOf(owner.address);
      const balanceBBefore = await tokenB.balanceOf(owner.address);

      await router.removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        lpBalance,
        0,
        0,
        owner.address,
        deadline
      );

      const balanceAAfter = await tokenA.balanceOf(owner.address);
      const balanceBAfter = await tokenB.balanceOf(owner.address);

      expect(balanceAAfter).to.be.gt(balanceABefore);
      expect(balanceBAfter).to.be.gt(balanceBBefore);
      expect(await pairAB.balanceOf(owner.address)).to.equal(0);
    });

    it("Should revert if min amounts not met on removal", async function () {
      const lpBalance = await pairAB.balanceOf(owner.address);
      await pairAB.approve(await router.getAddress(), lpBalance);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.removeLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          lpBalance,
          ethers.parseEther("1000"), // Unrealistic min
          0,
          owner.address,
          deadline
        )
      ).to.be.revertedWith("Router: insufficient A amount");
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      // Add initial liquidity
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("Should swap exact tokens for tokens", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user1).approve(await router.getAddress(), swapAmount);

      const balanceBBefore = await tokenB.balanceOf(user1.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.connect(user1).swapExactTokensForTokens(
        swapAmount,
        0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        user1.address,
        deadline
      );

      const balanceBAfter = await tokenB.balanceOf(user1.address);
      expect(balanceBAfter).to.be.gt(balanceBBefore);
    });

    it("Should swap tokens for exact tokens", async function () {
      const desiredOutput = ethers.parseEther("10");
      const maxInput = ethers.parseEther("20");

      await tokenA.connect(user1).approve(await router.getAddress(), maxInput);

      const balanceABefore = await tokenA.balanceOf(user1.address);
      const balanceBBefore = await tokenB.balanceOf(user1.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.connect(user1).swapTokensForExactTokens(
        desiredOutput,
        maxInput,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        user1.address,
        deadline
      );

      const balanceAAfter = await tokenA.balanceOf(user1.address);
      const balanceBAfter = await tokenB.balanceOf(user1.address);

      expect(balanceAAfter).to.be.lt(balanceABefore);
      expect(balanceBAfter).to.equal(balanceBBefore + desiredOutput);
    });

    it("Should revert swap if output below minimum", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user1).approve(await router.getAddress(), swapAmount);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user1).swapExactTokensForTokens(
          swapAmount,
          ethers.parseEther("100"), // Unrealistic min output
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user1.address,
          deadline
        )
      ).to.be.revertedWith("Router: insufficient output amount");
    });

    it("Should revert swap if input exceeds maximum", async function () {
      const desiredOutput = ethers.parseEther("50");
      const maxInput = ethers.parseEther("10"); // Too low

      await tokenA.connect(user1).approve(await router.getAddress(), ethers.parseEther("100"));

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user1).swapTokensForExactTokens(
          desiredOutput,
          maxInput,
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user1.address,
          deadline
        )
      ).to.be.revertedWith("Router: excessive input amount");
    });

    it("Should not allow non-whitelisted to swap", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user2).mint(user2.address, swapAmount);
      await tokenA.connect(user2).approve(await router.getAddress(), swapAmount);

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.connect(user2).swapExactTokensForTokens(
          swapAmount,
          0,
          [await tokenA.getAddress(), await tokenB.getAddress()],
          user2.address,
          deadline
        )
      ).to.be.revertedWith("Router: not whitelisted");
    });
  });

  describe("Quote and Amount Calculations", function () {
    beforeEach(async function () {
      // Add initial liquidity
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );
    });

    it("Should calculate quote correctly", async function () {
      const amountA = ethers.parseEther("10");
      const quote = await router.quote(amountA, LIQUIDITY_A, LIQUIDITY_B);

      // Quote should be proportional: 10 * 200 / 100 = 20
      expect(quote).to.equal(ethers.parseEther("20"));
    });

    it("Should calculate amountOut correctly", async function () {
      const amountIn = ethers.parseEther("10");
      const amountOut = await router.getAmountOut(amountIn, LIQUIDITY_A, LIQUIDITY_B);

      // AmountOut should account for 0.3% fee
      expect(amountOut).to.be.gt(0);
      expect(amountOut).to.be.lt(ethers.parseEther("20")); // Less than quote due to fee
    });

    it("Should calculate amountIn correctly", async function () {
      const amountOut = ethers.parseEther("10");
      const amountIn = await router.getAmountIn(amountOut, LIQUIDITY_A, LIQUIDITY_B);

      expect(amountIn).to.be.gt(0);
      expect(amountIn).to.be.gt(ethers.parseEther("5")); // More than quote due to fee
    });
  });

  describe("Pair Functions", function () {
    it("Should track reserves correctly", async function () {
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );

      const [reserve0, reserve1] = await pairAB.getReserves();
      const token0 = await pairAB.token0();
      const tokenAAddr = await tokenA.getAddress();

      if (token0.toLowerCase() === tokenAAddr.toLowerCase()) {
        expect(reserve0).to.equal(LIQUIDITY_A);
        expect(reserve1).to.equal(LIQUIDITY_B);
      } else {
        expect(reserve0).to.equal(LIQUIDITY_B);
        expect(reserve1).to.equal(LIQUIDITY_A);
      }
    });

    it("Should maintain K invariant after swap", async function () {
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await router.addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        LIQUIDITY_A,
        LIQUIDITY_B,
        0,
        0,
        owner.address,
        deadline
      );

      const [reserve0Before, reserve1Before] = await pairAB.getReserves();
      const kBefore = reserve0Before * reserve1Before;

      // Perform swap
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user1).approve(await router.getAddress(), swapAmount);

      await router.connect(user1).swapExactTokensForTokens(
        swapAmount,
        0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        user1.address,
        deadline
      );

      const [reserve0After, reserve1After] = await pairAB.getReserves();
      const kAfter = reserve0After * reserve1After;

      // K should increase due to 0.3% fee
      expect(kAfter).to.be.gte(kBefore);
    });

    it("Should emit Sync event on reserve updates", async function () {
      await tokenA.approve(await router.getAddress(), LIQUIDITY_A);
      await tokenB.approve(await router.getAddress(), LIQUIDITY_B);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        router.addLiquidity(
          await tokenA.getAddress(),
          await tokenB.getAddress(),
          LIQUIDITY_A,
          LIQUIDITY_B,
          0,
          0,
          owner.address,
          deadline
        )
      ).to.emit(pairAB, "Sync");
    });
  });
});
