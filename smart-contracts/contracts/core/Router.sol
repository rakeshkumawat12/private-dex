// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/Math.sol";
import "../interfaces/IFactory.sol";
import "../interfaces/IPair.sol";

/**
 * @title Router
 * @notice Main user-facing contract for interacting with the DEX
 * @dev Handles adding/removing liquidity and token swaps with safety checks
 */
contract Router is ReentrancyGuard {
    address public immutable factory;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "Router: expired");
        _;
    }

    /**
     * @notice Constructor sets factory address
     * @param _factory Address of the Factory contract
     */
    constructor(address _factory) {
        require(_factory != address(0), "Router: zero address");
        factory = _factory;
    }

    /**
     * @notice Sorts two tokens in ascending order
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return token0 Lower address
     * @return token1 Higher address
     */
    function sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        require(tokenA != tokenB, "Router: identical addresses");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Router: zero address");
    }

    /**
     * @notice Calculates the CREATE2 address for a pair without making any external calls
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair The pair address
     */
    function pairFor(address tokenA, address tokenB) internal view returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = IFactory(factory).getPair(token0, token1);
    }

    /**
     * @notice Given some asset amount and pair reserves, returns equivalent amount of the other asset
     * @param amountA Amount of token A
     * @param reserveA Reserve of token A
     * @param reserveB Reserve of token B
     * @return amountB Equivalent amount of token B
     */
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        require(amountA > 0, "Router: insufficient amount");
        require(reserveA > 0 && reserveB > 0, "Router: insufficient liquidity");
        amountB = (amountA * reserveB) / reserveA;
    }

    /**
     * @notice Given an input amount and pair reserves, returns the maximum output amount (accounting for fees)
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Maximum output amount
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Router: insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Router: insufficient liquidity");

        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Given an output amount and pair reserves, returns required input amount (accounting for fees)
     * @param amountOut Desired output amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Required input amount
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "Router: insufficient output amount");
        require(reserveIn > 0 && reserveOut > 0, "Router: insufficient liquidity");

        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    /**
     * @notice Adds liquidity to a token pair
     * @dev Tokens must be transferred to Router before calling this function
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A (slippage protection)
     * @param amountBMin Minimum amount of token B (slippage protection)
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline
     * @return amountA Actual amount of token A added
     * @return amountB Actual amount of token B added
     * @return liquidity Amount of LP tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        nonReentrant
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        address pair = pairFor(tokenA, tokenB);
        require(pair != address(0), "Router: pair does not exist");

        // Check router has enough tokens
        require(IERC20(tokenA).balanceOf(address(this)) >= amountADesired, "Router: insufficient tokenA balance");
        require(IERC20(tokenB).balanceOf(address(this)) >= amountBDesired, "Router: insufficient tokenB balance");

        (uint256 reserveA, uint256 reserveB) = _getReserves(tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Router: insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "Router: insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }

        // Transfer tokens from router to pair
        require(IERC20(tokenA).transfer(pair, amountA), "Router: tokenA transfer failed");
        require(IERC20(tokenB).transfer(pair, amountB), "Router: tokenB transfer failed");

        // Refund excess tokens back to sender if any
        if (amountADesired > amountA) {
            require(IERC20(tokenA).transfer(msg.sender, amountADesired - amountA), "Router: tokenA refund failed");
        }
        if (amountBDesired > amountB) {
            require(IERC20(tokenB).transfer(msg.sender, amountBDesired - amountB), "Router: tokenB refund failed");
        }

        liquidity = IPair(pair).mint(to);
    }

    /**
     * @notice Removes liquidity from a token pair
     * @dev LP tokens must be transferred to Router before calling this function
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @param liquidity Amount of LP tokens to burn
     * @param amountAMin Minimum amount of token A to receive (slippage protection)
     * @param amountBMin Minimum amount of token B to receive (slippage protection)
     * @param to Address to receive underlying tokens
     * @param deadline Transaction deadline
     * @return amountA Amount of token A received
     * @return amountB Amount of token B received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        nonReentrant
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB)
    {
        address pair = pairFor(tokenA, tokenB);
        require(pair != address(0), "Router: pair does not exist");

        // Check router has enough LP tokens
        require(IERC20(pair).balanceOf(address(this)) >= liquidity, "Router: insufficient LP balance");

        // Transfer LP tokens from router to pair
        require(IERC20(pair).transfer(pair, liquidity), "Router: LP transfer failed");

        (uint256 amount0, uint256 amount1) = IPair(pair).burn(to);
        (address token0, ) = sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        require(amountA >= amountAMin, "Router: insufficient A amount");
        require(amountB >= amountBMin, "Router: insufficient B amount");
    }

    /**
     * @notice Swaps exact amount of input tokens for as many output tokens as possible
     * @dev Input tokens must be transferred to Router before calling this function
     * @param amountIn Exact amount of input tokens
     * @param amountOutMin Minimum amount of output tokens (slippage protection)
     * @param path Array of token addresses representing swap path
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline
     * @return amounts Array of amounts for each swap in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: invalid path");
        amounts = _getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Router: insufficient output amount");

        address pair = pairFor(path[0], path[1]);
        require(pair != address(0), "Router: pair does not exist");

        // Check router has enough input tokens
        require(IERC20(path[0]).balanceOf(address(this)) >= amounts[0], "Router: insufficient token balance");

        // Transfer input tokens from router to pair
        require(IERC20(path[0]).transfer(pair, amounts[0]), "Router: token transfer failed");

        _swap(amounts, path, to);
    }

    /**
     * @notice Swaps input tokens for exact amount of output tokens
     * @dev Input tokens must be transferred to Router before calling this function
     * @param amountOut Exact amount of output tokens desired
     * @param amountInMax Maximum amount of input tokens (slippage protection)
     * @param path Array of token addresses representing swap path
     * @param to Address to receive output tokens
     * @param deadline Transaction deadline
     * @return amounts Array of amounts for each swap in the path
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: invalid path");
        amounts = _getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Router: excessive input amount");

        address pair = pairFor(path[0], path[1]);
        require(pair != address(0), "Router: pair does not exist");

        // Check router has enough input tokens
        require(IERC20(path[0]).balanceOf(address(this)) >= amounts[0], "Router: insufficient token balance");

        // Transfer input tokens from router to pair
        require(IERC20(path[0]).transfer(pair, amounts[0]), "Router: token transfer failed");

        // Refund excess tokens back to sender
        uint256 excess = amountInMax - amounts[0];
        if (excess > 0 && IERC20(path[0]).balanceOf(address(this)) >= excess) {
            require(IERC20(path[0]).transfer(msg.sender, excess), "Router: refund failed");
        }

        _swap(amounts, path, to);
    }

    /**
     * @notice Internal function to get reserves for a token pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return reserveA Reserve of token A
     * @return reserveB Reserve of token B
     */
    function _getReserves(address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (address token0, ) = sortTokens(tokenA, tokenB);
        address pair = pairFor(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1, ) = IPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    /**
     * @notice Internal function to execute swaps
     * @param amounts Array of amounts for each swap
     * @param path Array of token addresses
     * @param _to Final recipient address
     */
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2 ? pairFor(output, path[i + 2]) : _to;
            IPair(pairFor(input, output)).swap(amount0Out, amount1Out, to);
        }
    }

    /**
     * @notice Calculate amounts out for a swap path
     * @param amountIn Input amount
     * @param path Swap path
     * @return amounts Output amounts for each step
     */
    function _getAmountsOut(uint256 amountIn, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "Router: invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /**
     * @notice Calculate amounts in for a swap path
     * @param amountOut Desired output amount
     * @param path Swap path
     * @return amounts Input amounts for each step
     */
    function _getAmountsIn(uint256 amountOut, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "Router: invalid path");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = _getReserves(path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}
