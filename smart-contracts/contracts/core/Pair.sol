// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../libraries/Math.sol";
import "../interfaces/IPair.sol";

/**
 * @title Pair
 * @notice Liquidity pool contract implementing constant product AMM (x * y = k)
 * @dev Inherits ERC20 for LP tokens, uses ReentrancyGuard for security
 * LP tokens represent proportional ownership of the pool reserves
 */
contract Pair is ERC20, ReentrancyGuard, IPair {
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;
    uint256 private constant FEE_DENOMINATOR = 1000;
    uint256 private constant FEE_NUMERATOR = 3; // 0.3% fee

    address public immutable factory;
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    /**
     * @notice Constructor initializes the pair
     * @dev Called by Factory when creating a new pair
     */
    constructor() ERC20("Private DEX LP", "PDEX-LP") {
        factory = msg.sender;
    }

    /**
     * @notice Initializes the pair with token addresses
     * @dev Can only be called once by factory
     * @param _token0 Address of first token
     * @param _token1 Address of second token
     */
    function initialize(
        address _token0,
        address _token1
    ) external {
        require(msg.sender == factory, "Pair: forbidden");
        require(token0 == address(0), "Pair: already initialized");

        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @notice Get current reserves and last block timestamp
     * @return _reserve0 Reserve of token0
     * @return _reserve1 Reserve of token1
     * @return _blockTimestampLast Timestamp of last interaction
     */
    function getReserves()
        public
        view
        returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @notice Updates reserves and timestamp
     * @param balance0 New balance of token0
     * @param balance1 New balance of token1
     */
    function _update(uint256 balance0, uint256 balance1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "Pair: overflow");

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp % 2 ** 32);

        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Mint LP tokens when liquidity is added
     * @dev Low-level function, should be called from Router
     * @param to Address to receive LP tokens
     * @return liquidity Amount of LP tokens minted
     */
    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            // First liquidity provider
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            // Subsequent liquidity providers
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }

        require(liquidity > 0, "Pair: insufficient liquidity minted");
        _mint(to, liquidity);

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @notice Burn LP tokens to remove liquidity
     * @dev Low-level function, should be called from Router
     * @param to Address to receive underlying tokens
     * @return amount0 Amount of token0 returned
     * @return amount1 Amount of token1 returned
     */
    function burn(address to)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        address _token0 = token0;
        address _token1 = token1;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "Pair: insufficient liquidity burned");

        _burn(address(this), liquidity);

        IERC20(_token0).transfer(to, amount0);
        IERC20(_token1).transfer(to, amount1);

        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @notice Swap tokens using constant product formula
     * @dev Low-level function, should be called from Router
     * @param amount0Out Amount of token0 to send out
     * @param amount1Out Amount of token1 to send out
     * @param to Address to receive output tokens
     */
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to
    ) external nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "Pair: insufficient output amount");
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Pair: insufficient liquidity");

        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "Pair: invalid to");

            if (amount0Out > 0) IERC20(_token0).transfer(to, amount0Out);
            if (amount1Out > 0) IERC20(_token1).transfer(to, amount1Out);

            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "Pair: insufficient input amount");

        {
            // Verify K invariant with 0.3% fee
            // balance adjusted = balance * 1000 - amountIn * 3
            uint256 balance0Adjusted = (balance0 * FEE_DENOMINATOR) - (amount0In * FEE_NUMERATOR);
            uint256 balance1Adjusted = (balance1 * FEE_DENOMINATOR) - (amount1In * FEE_NUMERATOR);
            require(
                balance0Adjusted * balance1Adjusted >= uint256(_reserve0) * uint256(_reserve1) * (FEE_DENOMINATOR ** 2),
                "Pair: K"
            );
        }

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /**
     * @notice Force reserves to match balances
     * @dev Used to recover from unexpected token transfers
     */
    function sync() external nonReentrant {
        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)));
    }
}
