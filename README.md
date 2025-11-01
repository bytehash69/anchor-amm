# ⚓ Anchor AMM

A minimal, high-performance Automated Market Maker (AMM) built with Anchor for Solana.  
This repository contains smart contract code, tests, and tooling to deploy and interact with the AMM. 🚀

## Features ✨
- Constant product AMM core logic (x * y = k) ⚖️
- Liquidity provision and removal 💧
- Swap functionality with fee support 🔁
- Unit and integration tests ✅
- Designed for use with Anchor & Solana 🦀

## Quick Start 🚦

Prerequisites:
- Rust toolchain (stable) 🦀
- Solana CLI (recommended latest) ☀️
- Anchor CLI ⚓
- Node.js & npm (for frontend/tests if present) 🧩

Build the programs:
```bash
anchor build
```

Run tests (local validator):
```bash
anchor test
```

## Project Layout 📁
- programs/ — Anchor smart contract(s)
- tests/ — Anchor tests & integration tests
- scripts/ — helper scripts for deployment & interactions
- docs/ — documentation & design notes

## License 📜
This project is licensed under the MIT License. See LICENSE for details.

Have fun building! ⚓🧭
