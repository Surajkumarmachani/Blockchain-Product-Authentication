import { expect } from "chai";
import { network } from "hardhat";
import { canonicalize, contentHashOf } from "../scripts/lib/canonical.js";

const { ethers, networkHelpers } = await network.getOrCreate();

const URI = "ipfs://bafkreiexamplecid";
const METADATA = {
  name: "REGAL Heritage Tote (demo)",
  image: "ipfs://bafkreiimagecid",
  attributes: [{ trait_type: "Serial number", value: "RGL-2026-000001" }],
};
const HASH = contentHashOf(METADATA);

async function deployFixture() {
  const [admin, alice, bob] = await ethers.getSigners();
  const passport = await ethers.deployContract("RegalPassportPoC", [admin.address]);
  const MINTER_ROLE = await passport.MINTER_ROLE();
  return { passport, admin, alice, bob, MINTER_ROLE };
}

describe("RegalPassportPoC", function () {
  describe("deployment", function () {
    it("sets name, symbol and admin roles", async function () {
      const { passport, admin, MINTER_ROLE } = await networkHelpers.loadFixture(deployFixture);
      expect(await passport.name()).to.equal("REGAL Passport PoC");
      expect(await passport.symbol()).to.equal("REGALPOC");
      expect(await passport.hasRole(await passport.DEFAULT_ADMIN_ROLE(), admin.address)).to.equal(true);
      expect(await passport.hasRole(MINTER_ROLE, admin.address)).to.equal(true);
    });

    it("supports ERC-721, ERC-4906 and AccessControl interfaces", async function () {
      const { passport } = await networkHelpers.loadFixture(deployFixture);
      expect(await passport.supportsInterface("0x80ac58cd")).to.equal(true); // ERC-721
      expect(await passport.supportsInterface("0x49064906")).to.equal(true); // ERC-4906
      expect(await passport.supportsInterface("0x7965db0b")).to.equal(true); // AccessControl
    });
  });

  describe("mint", function () {
    it("mints to the recipient and stores URI and hash", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      await passport.mint(alice.address, 1n, URI, HASH);
      expect(await passport.ownerOf(1n)).to.equal(alice.address);
      expect(await passport.tokenURI(1n)).to.equal(URI);
      expect(await passport.contentHash(1n)).to.equal(HASH);
      expect(await passport.balanceOf(alice.address)).to.equal(1n);
    });

    it("emits PassportMinted and Transfer", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      const tx = passport.mint(alice.address, 7n, URI, HASH);
      await expect(tx).to.emit(passport, "PassportMinted").withArgs(7n, alice.address, URI, HASH);
      await expect(tx).to.emit(passport, "Transfer").withArgs(ethers.ZeroAddress, alice.address, 7n);
    });

    it("reverts for an account without MINTER_ROLE", async function () {
      const { passport, alice, MINTER_ROLE } = await networkHelpers.loadFixture(deployFixture);
      await expect(passport.connect(alice).mint(alice.address, 1n, URI, HASH))
        .to.be.revertedWithCustomError(passport, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, MINTER_ROLE);
    });

    it("lets the admin grant MINTER_ROLE to another account", async function () {
      const { passport, alice, bob, MINTER_ROLE } = await networkHelpers.loadFixture(deployFixture);
      await passport.grantRole(MINTER_ROLE, alice.address);
      await passport.connect(alice).mint(bob.address, 2n, URI, HASH);
      expect(await passport.ownerOf(2n)).to.equal(bob.address);
    });

    it("reverts on a duplicate token id", async function () {
      const { passport, alice, bob } = await networkHelpers.loadFixture(deployFixture);
      await passport.mint(alice.address, 1n, URI, HASH);
      await expect(passport.mint(bob.address, 1n, URI, HASH))
        .to.be.revertedWithCustomError(passport, "ERC721InvalidSender")
        .withArgs(ethers.ZeroAddress);
    });

    it("reverts on an empty URI", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      await expect(passport.mint(alice.address, 1n, "", HASH)).to.be.revertedWithCustomError(passport, "EmptyURI");
    });

    it("reverts on a zero content hash", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      await expect(passport.mint(alice.address, 1n, URI, ethers.ZeroHash)).to.be.revertedWithCustomError(
        passport,
        "EmptyContentHash",
      );
    });

    it("reverts when minting to the zero address", async function () {
      const { passport } = await networkHelpers.loadFixture(deployFixture);
      await expect(passport.mint(ethers.ZeroAddress, 1n, URI, HASH))
        .to.be.revertedWithCustomError(passport, "ERC721InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("reads", function () {
    it("reverts contentHash and tokenURI for a token that does not exist", async function () {
      const { passport } = await networkHelpers.loadFixture(deployFixture);
      await expect(passport.contentHash(99n))
        .to.be.revertedWithCustomError(passport, "ERC721NonexistentToken")
        .withArgs(99n);
      await expect(passport.tokenURI(99n))
        .to.be.revertedWithCustomError(passport, "ERC721NonexistentToken")
        .withArgs(99n);
    });

    it("lets the owner transfer the passport", async function () {
      const { passport, alice, bob } = await networkHelpers.loadFixture(deployFixture);
      await passport.mint(alice.address, 1n, URI, HASH);
      await passport.connect(alice).transferFrom(alice.address, bob.address, 1n);
      expect(await passport.ownerOf(1n)).to.equal(bob.address);
    });
  });

  describe("content hash check (what the verify page does)", function () {
    it("matches when metadata is unchanged, even with keys in a different order", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      await passport.mint(alice.address, 1n, URI, HASH);
      const fetched = {
        attributes: [{ value: "RGL-2026-000001", trait_type: "Serial number" }],
        image: "ipfs://bafkreiimagecid",
        name: "REGAL Heritage Tote (demo)",
      };
      expect(contentHashOf(fetched)).to.equal(await passport.contentHash(1n));
    });

    it("does not match when any field is altered", async function () {
      const { passport, alice } = await networkHelpers.loadFixture(deployFixture);
      await passport.mint(alice.address, 1n, URI, HASH);
      const tampered = structuredClone(METADATA);
      tampered.attributes[0].value = "RGL-2026-999999";
      expect(contentHashOf(tampered)).to.not.equal(await passport.contentHash(1n));
    });

    it("canonicalizes deterministically", function () {
      expect(canonicalize({ b: 1, a: [true, null, "x"] })).to.equal('{"a":[true,null,"x"],"b":1}');
    });
  });
});
