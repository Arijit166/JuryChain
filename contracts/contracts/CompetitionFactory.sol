// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CompetitionFactory {
    struct Competition {
        uint256 id;
        address sponsor;
        uint256 prizePool;
        uint8 numWinners;
        uint256 submissionDeadline;
        uint256 startTime;
        uint256 votingDeadline;
        bytes32 judgeMerkleRoot;
        bool isPublic;
        bool isLive;
        bool distributed;
    }

    uint256 public nextId;
    mapping(uint256 => Competition) public competitions;

    event CompetitionCreated(
        uint256 indexed id,
        address indexed sponsor,
        uint256 prizePool,
        bytes32 judgeMerkleRoot,
        bool isPublic
    );

    event PrizeDistributed(
        uint256 indexed id,
        address[] winners,
        uint256[] amounts
    );

    /// @notice Create + escrow prize in one tx. Send POL as msg.value.
    function createCompetition(
        uint8 _numWinners,
        uint256 _startTime,
        uint256 _submissionDeadline,
        uint256 _votingDeadline,
        bytes32 _judgeMerkleRoot,
        bool _isPublic
    ) external payable returns (uint256) {
        require(msg.value > 0, "Prize pool required");
        require(_numWinners > 0 && _numWinners <= 20, "Invalid winners count");
        require(_startTime >= block.timestamp, "Invalid start time");
        require(
            _submissionDeadline > _startTime,
            "Submission must be after start"
        );
        require(
            _votingDeadline > _submissionDeadline,
            "Voting must be after submission"
        );

        uint256 id = nextId++;
        competitions[id] = Competition({
            id: id,
            sponsor: msg.sender,
            prizePool: msg.value,
            numWinners: _numWinners,
            startTime: _startTime,
            submissionDeadline: _submissionDeadline,
            votingDeadline: _votingDeadline,
            judgeMerkleRoot: _judgeMerkleRoot,
            isPublic: _isPublic,
            isLive: true,
            distributed: false
        });

        emit CompetitionCreated(
            id,
            msg.sender,
            msg.value,
            _judgeMerkleRoot,
            _isPublic
        );
        return id;
    }

    /// @notice Sponsor can distribute prizes after voting deadline
    function distributePrizes(
        uint256 _id,
        address[] calldata _winners,
        uint256[] calldata _amounts
    ) external {
        Competition storage c = competitions[_id];
        require(msg.sender == c.sponsor, "Only sponsor");
        require(block.timestamp >= c.votingDeadline, "Voting not ended");
        require(!c.distributed, "Already distributed");
        require(_winners.length == c.numWinners, "Wrong winner count");
        require(_winners.length == _amounts.length, "Length mismatch");

        uint256 total;
        for (uint i = 0; i < _amounts.length; i++) total += _amounts[i];
        require(total <= c.prizePool, "Exceeds prize pool");

        c.distributed = true;
        for (uint i = 0; i < _winners.length; i++) {
            (bool ok, ) = _winners[i].call{value: _amounts[i]}("");
            require(ok, "Transfer failed");
        }

        emit PrizeDistributed(_id, _winners, _amounts);
    }

    function getCompetition(
        uint256 _id
    ) external view returns (Competition memory) {
        return competitions[_id];
    }
}
