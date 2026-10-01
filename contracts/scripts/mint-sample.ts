import { readFile } from "node:fs/promises";
import { network } from "hardhat";
import { contentHashOf } from "./lib/canonical.js";

// Mints one demo passport to the deployer.
//   TOKEN_ID=1 TOKEN_URI=ipfs://<CID> npx hardhat run scripts/mint-sample.ts --network amoy
// Until Week 2 (Pinata upload), TOKEN_URI defaults to a placeholder.

const { ethers } = await network.getOrCreate();
const [signer] = await ethers.getSigners();
const { chainId } = await ethers.provider.getNetwork();

const deployedPath = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
const deployed = JSON.parse(await readFile(deployedPath, "utf8"));
const address: string = deployed["RegalPassportPoCModule#RegalPassportPoC"];
if (!address) throw new Error(`No RegalPassportPoC address in ${deployedPath}. Deploy first.`);

const metadata = JSON.parse(await readFile("scripts/sample-metadata.json", "utf8"));
const hash = contentHashOf(metadata);
const tokenId = BigInt(process.env.TOKEN_ID ?? "1");
const uri = process.env.TOKEN_URI ?? "ipfs://REPLACE_WITH_METADATA_CID";

const passport = await ethers.getContractAt("RegalPassportPoC", address, signer);
console.log(`Minting token ${tokenId} on chain ${chainId} at ${address}`);
const tx = await passport.mint(signer.address, tokenId, uri, hash);
const receipt = await tx.wait();

console.log(`tx:          ${receipt?.hash}`);
console.log(`owner:       ${await passport.ownerOf(tokenId)}`);
console.log(`tokenURI:    ${await passport.tokenURI(tokenId)}`);
console.log(`contentHash: ${await passport.contentHash(tokenId)}`);
