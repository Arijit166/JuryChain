// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CompetitionFactory {
    struct Competition {
        uint256 id;
        address sponsor;
        uint256 prizePool;
        uint8 numWinners;
        uint8 category;
        uint256 startTime;
        uint256 submissionDeadline;
        uint256 votingDeadline;
        bytes32 judgeMerkleRoot;
        bool isPublic;
        bool isLive;
        bool distributed;
    }

    uint256 public nextId;
    mapping(uint256 => Competition) public competitions;
    // competitionId => rank (0-indexed) => basis points (out of 10000)
    mapping(uint256 => uint256[]) public prizeSplits;

    event CompetitionCreated(
        uint256 indexed id,
        address indexed sponsor,
        uint256 prizePool,
        bytes32 judgeMerkleRoot,
        bool isPublic,
        uint256[] splits,
        uint8 category
    );

    event PrizeDistributed(
        uint256 indexed id,
        address[] winners,
        uint256[] amounts
    );

    /// @dev Returns basis points split for a given winner count.
    ///      Must sum to 10000 (100.00%)
    function _getDefaultSplits(
        uint8 _numWinners
    ) internal pure returns (uint256[] memory) {
        uint256[] memory splits = new uint256[](_numWinners);

        if (_numWinners == 1) {
            splits[0] = 10000; // 100%
        } else if (_numWinners == 3) {
            splits[0] = 5000; // 50%
            splits[1] = 3000; // 30%
            splits[2] = 2000; // 20%
        } else if (_numWinners == 5) {
            splits[0] = 4500; // 45%
            splits[1] = 3000; // 30%
            splits[2] = 1500; // 15%
            splits[3] = 500; //  5%
            splits[4] = 500; //  5%
        } else if (_numWinners == 10) {
            splits[0] = 3000; // 30%
            splits[1] = 2000; // 20%
            splits[2] = 1500; // 15%
            splits[3] = 1000; // 10%
            splits[4] = 700; //  7%
            splits[5] = 700; //  7%
            splits[6] = 300; //  3%
            splits[7] = 300; //  3%
            splits[8] = 250; // 2.5%
            splits[9] = 250; // 2.5%
        } else {
            // Generic fallback: first place gets 40%, rest split equally
            uint256 remaining = 6000;
            splits[0] = 4000;
            uint256 perOther = remaining / (_numWinners - 1);
            for (uint8 i = 1; i < _numWinners; i++) {
                splits[i] = perOther;
            }
            // Give leftover dust to first place to keep sum == 10000
            uint256 used = 4000 + perOther * (_numWinners - 1);
            splits[0] += (10000 - used);
        }

        return splits;
    }

    function createCompetition(
        uint8 _numWinners,
        uint8 _category,
        uint256 _startTime,
        uint256 _submissionDeadline,
        uint256 _votingDeadline,
        bytes32 _judgeMerkleRoot,
        bool _isPublic
    ) external payable returns (uint256) {
        require(msg.value > 0, "Prize pool required");
        require(_numWinners > 0 && _numWinners <= 20, "Invalid winners count");
        require(_startTime >= block.timestamp, "Invalid start time");
        require(_category <= 3, "Invalid category");
        require(
            _submissionDeadline > _startTime,
            "Submission must be after start"
        );
        require(
            _votingDeadline > _submissionDeadline,
            "Voting must be after submission"
        );
        require(
            _votingDeadline <= block.timestamp + 365 days,
            "Deadline too far"
        );

        uint256 id = nextId++;
        uint256[] memory splits = _getDefaultSplits(_numWinners);
        prizeSplits[id] = splits;

        competitions[id] = Competition({
            id: id,
            sponsor: msg.sender,
            prizePool: msg.value,
            numWinners: _numWinners,
            category: _category,
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
            _isPublic,
            splits,
            _category
        );
        return id;
    }

    /// @notice Sponsor submits ranked winner list — contract auto-calculates amounts
    function distributePrizes(
        uint256 _id,
        address[] calldata _winners // ordered: [1st, 2nd, 3rd, ...]
    ) external {
        Competition storage c = competitions[_id];
        require(msg.sender == c.sponsor, "Only sponsor");
        require(block.timestamp >= c.votingDeadline, "Voting not ended");
        require(!c.distributed, "Already distributed");
        require(_winners.length == c.numWinners, "Wrong winner count");

        uint256[] memory splits = prizeSplits[_id];
        uint256[] memory amounts = new uint256[](c.numWinners);

        c.distributed = true;

        for (uint8 i = 0; i < c.numWinners; i++) {
            amounts[i] = (c.prizePool * splits[i]) / 10000;
            (bool ok, ) = _winners[i].call{value: amounts[i]}("");
            require(ok, "Transfer failed");
        }

        emit PrizeDistributed(_id, _winners, amounts);
    }

    /// @notice Returns the prize amount each rank will receive given current pool
    function getExpectedPrizes(
        uint256 _id
    ) external view returns (uint256[] memory amounts) {
        Competition storage c = competitions[_id];
        uint256[] memory splits = prizeSplits[_id];
        amounts = new uint256[](c.numWinners);
        for (uint8 i = 0; i < c.numWinners; i++) {
            amounts[i] = (c.prizePool * splits[i]) / 10000;
        }
    }

    function getPrizeSplits(
        uint256 _id
    ) external view returns (uint256[] memory) {
        return prizeSplits[_id];
    }

    function getCompetition(
        uint256 _id
    ) external view returns (Competition memory) {
        return competitions[_id];
    }
}
