// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title REGAL LAB Passport (Phase 0 proof of concept)
/// @notice One NFT per luxury product. tokenURI points to IPFS metadata, and
///         contentHash anchors the keccak256 of that metadata so any change to
///         it can be detected.
/// @dev DEMO ONLY. A QR code can be copied, so this contract alone cannot prove
///      a physical item is genuine. Phase 1 replaces it with the upgradeable
///      RegalPassport and NFC verification.
contract RegalPassportPoC is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(uint256 tokenId => bytes32) private _contentHashes;

    event PassportMinted(
        uint256 indexed tokenId,
        address indexed to,
        string uri,
        bytes32 contentHash
    );

    error EmptyURI();
    error EmptyContentHash();

    constructor(address admin) ERC721("REGAL Passport PoC", "REGALPOC") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Mints a passport for one product.
    /// @param to Wallet that will own the passport.
    /// @param tokenId Unique id chosen by the admin system. Reusing an id reverts.
    /// @param uri Metadata location, e.g. "ipfs://<CID>".
    /// @param contentHash_ keccak256 of the canonical metadata JSON.
    function mint(
        address to,
        uint256 tokenId,
        string calldata uri,
        bytes32 contentHash_
    ) external onlyRole(MINTER_ROLE) {
        if (bytes(uri).length == 0) revert EmptyURI();
        if (contentHash_ == bytes32(0)) revert EmptyContentHash();

        _contentHashes[tokenId] = contentHash_;
        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);

        emit PassportMinted(tokenId, to, uri, contentHash_);
    }

    /// @notice Returns the anchored metadata hash. Reverts if the token does not exist.
    function contentHash(uint256 tokenId) external view returns (bytes32) {
        _requireOwned(tokenId);
        return _contentHashes[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
