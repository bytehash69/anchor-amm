# AMM Protocol

A decentralized Automated Market Maker (AMM) built on Solana using the Anchor framework. This protocol implements a constant product formula (x × y = k) to enable decentralized token swapping and liquidity provision.

## Overview

This AMM protocol allows users to:
- Create liquidity pools for token pairs
- Provide liquidity and earn trading fees
- Swap tokens using automated market making
- Remove liquidity proportionally

The protocol uses Program Derived Addresses (PDAs) for security and implements slippage protection for all operations.

### Core Components

- **Config Account**: Stores pool configuration, token references, and settings
- **Vault Accounts**: Hold deposited tokens for each trading pair
- **LP Token Mint**: Issues liquidity provider tokens as receipts
- **Constant Product Curve**: Implements the x × y = k formula for price discovery

### Key Features

- **Constant Product Formula**: Maintains liquidity depth using the proven x × y = k model
- **Fee Structure**: Configurable trading fees in basis points
- **Slippage Protection**: Minimum/maximum amount validation for all operations
- **PDA Security**: All critical accounts use Program Derived Addresses
- **Proportional Withdrawals**: LP tokens represent proportional ownership
  
## Dependencies

- `anchor-lang`: Solana program framework
- `anchor-spl`: SPL token program integration
- `constant-product-curve`: Mathematical curve implementation

## License

This project is licensed under the MIT License.

## Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor Framework 0.29+

### Building

```bash
anchor build
```

### Deployment

```bash
anchor deploy
```

## Disclaimer

This is experimental software. Use at your own risk. Always audit smart contracts before deploying to mainnet.
