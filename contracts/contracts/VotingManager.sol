// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * VotingManager — stores nullifier hashes to prevent double voting.
 * Judge identity stays hidden; only the nullifierHash is stored on-chain.
 * Off-chain Semaphore proof is verified before calling commitVote.
 * (Full on-chain Semaphore verifier can be wired in later via ISemaphore.)
 */
contract VotingManager {
    // competitionId => nullifierHash => used
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsed;

    // competitionId => projectId => totalScore
    mapping(uint256 => mapping(string => uint256)) public scores;

    // competitionId => projectId => voteCount
    mapping(uint256 => mapping(string => uint256)) public voteCounts;

    // competitionId => list of projects that received votes (for enumeration)
    mapping(uint256 => string[]) private _votedProjects;
    mapping(uint256 => mapping(string => bool)) private _projectRegistered;

    event VoteCommitted(
        uint256 indexed competitionId,
        uint256 nullifierHash,
        string projectId,
        uint256 score
    );

    /**
     * @param competitionId  matches CompetitionFactory id
     * @param nullifierHash  Semaphore nullifier (prevents double vote)
     * @param projectId      MongoDB _id of the submission
     * @param score          1–10
     */
    function commitVote(
        uint256 competitionId,
        uint256 nullifierHash,
        string calldata projectId,
        uint256 score
    ) external {
        require(score >= 1 && score <= 10, "Score out of range");
        require(!nullifierUsed[competitionId][nullifierHash], "Already voted");

        nullifierUsed[competitionId][nullifierHash] = true;
        scores[competitionId][projectId] += score;
        voteCounts[competitionId][projectId] += 1;

        if (!_projectRegistered[competitionId][projectId]) {
            _projectRegistered[competitionId][projectId] = true;
            _votedProjects[competitionId].push(projectId);
        }

        emit VoteCommitted(competitionId, nullifierHash, projectId, score);
    }

    /// @notice Returns all project IDs that received at least one vote
    function getVotedProjects(
        uint256 competitionId
    ) external view returns (string[] memory) {
        return _votedProjects[competitionId];
    }
}
