// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ContentIntegrity
 * @notice Stores content hashes on-chain for tamper-proof verification.
 *         Used by Chain Host to anchor website deployment hashes.
 */
contract ContentIntegrity {
    struct HashRecord {
        address publisher;
        bytes32 contentHash;
        uint256 timestamp;
        string entityType;
        string entityId;
    }

    mapping(bytes32 => HashRecord) public records;
    mapping(address => bytes32[]) public publisherRecords;

    event ContentAnchored(
        bytes32 indexed recordId,
        address indexed publisher,
        bytes32 contentHash,
        string entityType,
        string entityId,
        uint256 timestamp
    );

    event ContentVerified(
        bytes32 indexed recordId,
        address indexed verifier,
        bool isValid
    );

    /**
     * @notice Anchor a content hash on-chain
     * @param contentHash SHA-256 hash of the content
     * @param entityType Type of entity (e.g., "website", "deployment")
     * @param entityId Unique identifier of the entity
     */
    function anchor(
        bytes32 contentHash,
        string calldata entityType,
        string calldata entityId
    ) external returns (bytes32) {
        bytes32 recordId = keccak256(
            abi.encodePacked(msg.sender, contentHash, block.timestamp)
        );

        require(records[recordId].timestamp == 0, "Record already exists");

        records[recordId] = HashRecord({
            publisher: msg.sender,
            contentHash: contentHash,
            timestamp: block.timestamp,
            entityType: entityType,
            entityId: entityId
        });

        publisherRecords[msg.sender].push(recordId);

        emit ContentAnchored(
            recordId,
            msg.sender,
            contentHash,
            entityType,
            entityId,
            block.timestamp
        );

        return recordId;
    }

    /**
     * @notice Verify if content matches a stored hash
     * @param recordId The record to verify against
     * @param contentHash The hash to verify
     */
    function verify(
        bytes32 recordId,
        bytes32 contentHash
    ) external returns (bool) {
        HashRecord storage record = records[recordId];
        require(record.timestamp > 0, "Record not found");

        bool isValid = record.contentHash == contentHash;

        emit ContentVerified(recordId, msg.sender, isValid);

        return isValid;
    }

    /**
     * @notice Get all record IDs for a publisher
     */
    function getPublisherRecords(
        address publisher
    ) external view returns (bytes32[] memory) {
        return publisherRecords[publisher];
    }

    /**
     * @notice Get record count for a publisher
     */
    function getRecordCount(
        address publisher
    ) external view returns (uint256) {
        return publisherRecords[publisher].length;
    }
}
