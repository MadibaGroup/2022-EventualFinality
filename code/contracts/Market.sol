pragma solidity ^0.8.4;

import "./Outbox.sol";

contract Market {
    IOutbox public outbox;

    constructor(address _outbox) public {
        outbox = IOutbox(_outbox);
        state = States.Closed;
    }

    mapping(address => uint256) public totalEtherBalance;
    bool public exitLocked;

    enum States {
        Open,
        Closed
    }
    States internal state;

    struct Listing {
        address payable seller;
        bytes32[] proof;
        uint256 index;
        address l2Sender;
        address to;
        uint256 l2Block;
        uint256 l1Block;
        uint256 l2Timestamp;
        uint256 value;
        bytes data;
        uint256 askPrice;
    }
    Listing listedExit;

    function lockExit(uint256 _exitId) external returns (bool) {
        require(
            outbox.checkExitOwner(_exitId) == address(this),
            "Exit is not transferred to the Market yet!"
        );
        exitLocked = true;
        return true;
    }

    modifier auctionAtStage(States _state) {
        require(state == _state);
        _;
    }
    modifier ifExitLocked() {
        require(exitLocked == true);
        _;
    }

    function openMarket(
        bytes32[] memory _proof,
        uint256 _index,
        address _l2Sender,
        address _to,
        uint256 _l2Block,
        uint256 _l1Block,
        uint256 _l2Timestamp,
        uint256 _value,
        bytes memory _data,
        uint256 _askPrice
    ) external auctionAtStage(States.Closed) ifExitLocked returns (bool) {
        state = States.Open;
        listedExit = Listing(
            payable(msg.sender),
            _proof,
            _index,
            _l2Sender,
            _to,
            _l2Block,
            _l1Block,
            _l2Timestamp,
            _value,
            _data,
            _askPrice
        );
        return true;
    }

    function closeMarket(uint256 _0utputId)
        external
        auctionAtStage(States.Open)
        returns (bool)
    {
        state = States.Closed;
    }

    function submitBid()
        external
        payable
        auctionAtStage(States.Open)
        returns (bool)
    {
        if (msg.value >= listedExit.askPrice) {
            outbox.transferSpender(
                listedExit.proof,
                listedExit.index,
                listedExit.l2Sender,
                listedExit.to,
                listedExit.l2Block,
                listedExit.l1Block,
                listedExit.l2Timestamp,
                listedExit.value,
                listedExit.data,
                msg.sender
            );
            listedExit.seller.transfer(msg.value);
            state = States.Closed;
        }
        return true;
    }
}
