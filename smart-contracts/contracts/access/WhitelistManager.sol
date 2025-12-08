// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WhitelistManager
 * @notice Manages the global whitelist for the private DEX
 * @dev Only whitelisted addresses can interact with DEX contracts
 * Includes emergency pause functionality for all whitelisted operations
 */
contract WhitelistManager is Ownable, Pausable {
    /// @notice Mapping of addresses to their whitelist status
    mapping(address => bool) private _whitelist;

    /// @notice Emitted when an address is added to the whitelist
    event AddressWhitelisted(address indexed account);

    /// @notice Emitted when an address is removed from the whitelist
    event AddressRemovedFromWhitelist(address indexed account);

    /**
     * @notice Constructor sets the deployer as the initial owner
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Adds an address to the whitelist
     * @dev Only callable by owner
     * @param account The address to whitelist
     */
    function addToWhitelist(address account) external onlyOwner {
        require(account != address(0), "WhitelistManager: zero address");
        require(!_whitelist[account], "WhitelistManager: already whitelisted");

        _whitelist[account] = true;
        emit AddressWhitelisted(account);
    }

    /**
     * @notice Adds multiple addresses to the whitelist in batch
     * @dev Only callable by owner, more gas efficient for multiple addresses
     * @param accounts Array of addresses to whitelist
     */
    function batchAddToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            require(account != address(0), "WhitelistManager: zero address");

            if (!_whitelist[account]) {
                _whitelist[account] = true;
                emit AddressWhitelisted(account);
            }
        }
    }

    /**
     * @notice Removes an address from the whitelist
     * @dev Only callable by owner
     * @param account The address to remove from whitelist
     */
    function removeFromWhitelist(address account) external onlyOwner {
        require(_whitelist[account], "WhitelistManager: not whitelisted");

        _whitelist[account] = false;
        emit AddressRemovedFromWhitelist(account);
    }

    /**
     * @notice Removes multiple addresses from the whitelist in batch
     * @dev Only callable by owner
     * @param accounts Array of addresses to remove from whitelist
     */
    function batchRemoveFromWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];

            if (_whitelist[account]) {
                _whitelist[account] = false;
                emit AddressRemovedFromWhitelist(account);
            }
        }
    }

    /**
     * @notice Checks if an address is whitelisted
     * @param account The address to check
     * @return bool True if the address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    /**
     * @notice Pauses all whitelist checks (emergency use only)
     * @dev Only callable by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses whitelist checks
     * @dev Only callable by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Checks if an address is whitelisted and system is not paused
     * @dev This is the primary function used by other DEX contracts
     * @param account The address to check
     * @return bool True if address is whitelisted and system is not paused
     */
    function isWhitelistedAndActive(address account) external view returns (bool) {
        return !paused() && _whitelist[account];
    }
}
