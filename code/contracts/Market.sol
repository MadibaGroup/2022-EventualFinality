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
    Listing[] listings;

    function lockExit(uint256 _exitId) external returns (bool) {
        require(
            outbox.checkExitOwner(_exitId) == address(this),
            "Exit has not been transferred to the Market yet!"
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
        Listing memory listing = Listing({
            seller: payable(msg.sender),
            proof: _proof,
            index: _index,
            l2Sender: _l2Sender,
            to: _to,
            l2Block: _l2Block,
            l1Block: _l1Block,
            l2Timestamp: _l2Timestamp,
            value: _value,
            data: _data,
            askPrice: _askPrice
        });
        listings.push(listing);
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
        if (msg.value >= listings[0].askPrice) {
            outbox.transferSpender(
                listings[0].proof,
                listings[0].index,
                listings[0].l2Sender,
                listings[0].to,
                listings[0].l2Block,
                listings[0].l1Block,
                listings[0].l2Timestamp,
                listings[0].value,
                listings[0].data,
                msg.sender
            );
            listings[0].seller.transfer(msg.value);
            state = States.Closed;
        }
        return true;
    }
}
