# REGAL LAB — Phase 0 contracts

`RegalPassportPoC` is an ERC-721 NFT, one token per luxury product, on Polygon Amoy.

- **What each token stores:** a `tokenURI` that points to IPFS metadata, plus a `contentHash`. The hash is keccak256 of the canonical metadata JSON, so any later change to the metadata can be detected.
- **Who can mint:** only accounts holding `MINTER_ROLE`.

> **Demo only.** A QR code can be copied, so this contract alone cannot prove a physical item is genuine. Phase 1 replaces it with the upgradeable `RegalPassport` and adds NFC verification.

## Requirements

- Node.js 22 or later (required by Hardhat 3)
- A MetaMask test wallet holding Amoy test POL from a faucet
- An Alchemy (or other) Amoy RPC URL
- An Etherscan API key; one key covers Amoy PolygonScan verification

## Setup

```bash
npm install
```

Secrets go in Hardhat's encrypted keystore. They are never stored in this repo or in plain `.env` files.

```bash
npx hardhat keystore set AMOY_RPC_URL
npx hardhat keystore set AMOY_PRIVATE_KEY      # test wallet only, never a real one
npx hardhat keystore set ETHERSCAN_API_KEY
```

## Test

```bash
npm test          # compiles, then runs 15 tests
npm run typecheck
```

The tests cover:

- roles and supported interfaces
- minting, and the event it emits
- the access-control revert
- duplicate token IDs, empty URIs, zero hashes and the zero address
- reads of tokens that don't exist
- transfers
- the content-hash check the verify page will run

## Try it locally

```bash
npm run node            # terminal 1: local chain
npm run deploy:local    # terminal 2
npm run mint:local
```

## Deploy to Amoy

```bash
npm run deploy:amoy     # deploys and verifies on Amoy PolygonScan
npm run mint:amoy       # mints token 1 to your wallet
```

The contract address is saved in `ignition/deployments/chain-80002/deployed_addresses.json`. Commit this file; the web app reads the address from it.

To mint other tokens, set the token ID and metadata URI before running the script:

```bash
TOKEN_ID=2 TOKEN_URI=ipfs://<metadata CID> npm run mint:amoy
```

Until the Week 2 Pinata upload exists, `TOKEN_URI` defaults to a placeholder.

To let a second wallet mint, such as the admin dashboard's MetaMask, grant it the role from the PolygonScan "Write Contract" tab. Call `grantRole(MINTER_ROLE, <address>)` from the admin wallet.

## Files

| Path | Purpose |
| --- | --- |
| `contracts/RegalPassportPoC.sol` | The NFT contract |
| `test/RegalPassportPoC.ts` | Mocha + ethers tests |
| `scripts/lib/canonical.ts` | Canonical JSON and `contentHashOf()`; the web app must use this same logic |
| `scripts/sample-metadata.json` | Demo product metadata (ERC-721 metadata format) |
| `scripts/mint-sample.ts` | Mints one demo passport |
| `ignition/modules/RegalPassportPoC.ts` | Deployment module |
