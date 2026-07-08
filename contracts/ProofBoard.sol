// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofBoard {
    struct Project {
        address owner;
        string name;
        string description;
        bool exists;
    }

    struct Milestone {
        uint256 projectId;
        string title;
        string status;
        bytes32 metadataHash;
        uint256 timestamp;
    }

    uint256 public nextProjectId = 1;
    Milestone[] private milestones;

    mapping(uint256 => Project) public projects;

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name);
    event MilestoneAdded(uint256 indexed milestoneId, uint256 indexed projectId, string title, bytes32 metadataHash);

    modifier onlyProjectOwner(uint256 projectId) {
        require(projects[projectId].exists, "project not found");
        require(projects[projectId].owner == msg.sender, "not project owner");
        _;
    }

    function registerProject(string calldata name, string calldata description) external returns (uint256 projectId) {
        projectId = nextProjectId++;
        projects[projectId] = Project({
            owner: msg.sender,
            name: name,
            description: description,
            exists: true
        });

        emit ProjectRegistered(projectId, msg.sender, name);
    }

    function addMilestone(
        uint256 projectId,
        string calldata title,
        string calldata status,
        bytes32 metadataHash
    ) external onlyProjectOwner(projectId) returns (uint256 milestoneId) {
        milestoneId = milestones.length;
        milestones.push(Milestone({
            projectId: projectId,
            title: title,
            status: status,
            metadataHash: metadataHash,
            timestamp: block.timestamp
        }));

        emit MilestoneAdded(milestoneId, projectId, title, metadataHash);
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        require(milestoneId < milestones.length, "milestone not found");
        return milestones[milestoneId];
    }
}
