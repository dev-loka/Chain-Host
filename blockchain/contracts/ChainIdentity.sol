// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ChainIdentity
 * @notice Decentralized Identity (DID) registry for Chain Host.
 *         Maps wallet addresses to identity profiles with key management.
 */
contract ChainIdentity {
    struct Identity {
        address owner;
        string did;           // DID string (e.g., "did:chainhost:0x...")
        string displayName;
        string metadataUri;   // IPFS URI for extended profile data
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
    }

    mapping(address => Identity) public identities;
    mapping(string => address) public didToAddress;
    mapping(address => address[]) public delegates;
    mapping(address => mapping(address => bool)) public isDelegateOf;

    uint256 public totalIdentities;

    event IdentityCreated(address indexed owner, string did, uint256 timestamp);
    event IdentityUpdated(address indexed owner, string metadataUri, uint256 timestamp);
    event DelegateAdded(address indexed identity, address indexed delegate);
    event DelegateRemoved(address indexed identity, address indexed delegate);
    event IdentityDeactivated(address indexed owner);

    modifier onlyOwnerOrDelegate(address identity) {
        require(
            msg.sender == identity || isDelegateOf[identity][msg.sender],
            "Not authorized"
        );
        _;
    }

    /**
     * @notice Create a new decentralized identity
     * @param displayName Human-readable name
     * @param metadataUri IPFS URI for profile metadata
     */
    function createIdentity(
        string calldata displayName,
        string calldata metadataUri
    ) external {
        require(identities[msg.sender].createdAt == 0, "Identity already exists");

        string memory did = string(
            abi.encodePacked("did:chainhost:", _toHexString(msg.sender))
        );

        identities[msg.sender] = Identity({
            owner: msg.sender,
            did: did,
            displayName: displayName,
            metadataUri: metadataUri,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        didToAddress[did] = msg.sender;
        totalIdentities++;

        emit IdentityCreated(msg.sender, did, block.timestamp);
    }

    /**
     * @notice Update identity profile
     */
    function updateIdentity(
        string calldata displayName,
        string calldata metadataUri
    ) external {
        Identity storage identity = identities[msg.sender];
        require(identity.createdAt > 0, "Identity not found");
        require(identity.active, "Identity deactivated");

        identity.displayName = displayName;
        identity.metadataUri = metadataUri;
        identity.updatedAt = block.timestamp;

        emit IdentityUpdated(msg.sender, metadataUri, block.timestamp);
    }

    /**
     * @notice Add a delegate who can act on behalf of the identity
     */
    function addDelegate(address delegate) external {
        require(identities[msg.sender].createdAt > 0, "Identity not found");
        require(!isDelegateOf[msg.sender][delegate], "Already a delegate");

        isDelegateOf[msg.sender][delegate] = true;
        delegates[msg.sender].push(delegate);

        emit DelegateAdded(msg.sender, delegate);
    }

    /**
     * @notice Remove a delegate
     */
    function removeDelegate(address delegate) external {
        require(isDelegateOf[msg.sender][delegate], "Not a delegate");
        isDelegateOf[msg.sender][delegate] = false;

        emit DelegateRemoved(msg.sender, delegate);
    }

    /**
     * @notice Deactivate identity
     */
    function deactivate() external {
        Identity storage identity = identities[msg.sender];
        require(identity.createdAt > 0, "Identity not found");
        identity.active = false;

        emit IdentityDeactivated(msg.sender);
    }

    /**
     * @notice Resolve a DID to an address
     */
    function resolve(string calldata did) external view returns (address) {
        return didToAddress[did];
    }

    // ── Internal ──────────────────────────
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 value = bytes20(addr);
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }
}
