// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pair.sol";
import "../interfaces/IFactory.sol";

/**
 * @title Factory
 * @notice Creates and manages trading pairs for the DEX
 * @dev Deploys new Pair contracts and maintains a registry
 */
contract Factory is IFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairNumber);

    /**
     * @notice Constructor
     */
    constructor() {}

    /**
     * @notice Returns the total number of pairs created
     * @return The length of allPairs array
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /**
     * @notice Creates a new trading pair
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB)
        external
        returns (address pair)
    {
        require(tokenA != tokenB, "Factory: identical addresses");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Factory: zero address");
        require(getPair[token0][token1] == address(0), "Factory: pair exists");

        // Create new Pair contract
        bytes memory bytecode = type(Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // Initialize the pair
        Pair(pair).initialize(token0, token1);

        // Update mappings
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }
}
