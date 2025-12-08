// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Math
 * @notice Mathematical utilities for the DEX
 * @dev Contains sqrt function for calculating liquidity and min helper
 */
library Math {
    /**
     * @notice Calculates the square root of a number using Babylonian method
     * @dev Used for calculating initial liquidity: sqrt(x * y)
     * @param y The number to calculate square root of
     * @return z The square root of y
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // else z = 0 (default value)
    }

    /**
     * @notice Returns the minimum of two numbers
     * @param x First number
     * @param y Second number
     * @return The smaller of the two numbers
     */
    function min(uint256 x, uint256 y) internal pure returns (uint256) {
        return x < y ? x : y;
    }
}
