// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IWhitelistManager
 * @notice Interface for the WhitelistManager contract
 */
interface IWhitelistManager {
    function isWhitelisted(address account) external view returns (bool);
    function isWhitelistedAndActive(address account) external view returns (bool);
}
