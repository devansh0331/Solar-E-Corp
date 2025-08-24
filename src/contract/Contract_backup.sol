// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Contract {
    struct Producer {
        uint256 rate; // wei per kWh
        uint256 balance;
        bool registered;
        bool supplyActive;
    }
    
    struct Consumer {
        uint256 balance;
        bool registered;
    }
    
    struct Request {
        address consumer;
        uint256 rate;
        uint256 requestTime;  // When consumer made the request
        uint256 acceptTime;   // When producer accepted (0 if not accepted)
        uint256 settleTime;   // When payment was settled (0 if not settled)
        uint256 requestedAmount; // kWh
        bool active;
    }
    
    struct Transaction {
        address producer;
        address consumer;
        uint256 amount;
        uint256 duration;
        uint256 timestamp;
    }
    
    address[] public producerAddresses;
    mapping(address => Producer) public producers;
    mapping(address => Consumer) public consumers;
    mapping(address => Request) public requests;
    
    // Track all settled transactions
    Transaction[] public transactionHistory;
    
    modifier onlyProducer() {
        require(producers[msg.sender].registered, "Not a producer");
        _;
    }
    
    modifier onlyConsumer() {
        require(consumers[msg.sender].registered, "Not a consumer");
        _;
    }
    
    function registerProducer() external {
        require(!producers[msg.sender].registered, "Already registered");
        producers[msg.sender] = Producer({
            rate: 0,
            balance: 0,
            registered: true,
            supplyActive: true
        });
        producerAddresses.push(msg.sender);
    }
    
    function registerConsumer() external {
        require(!consumers[msg.sender].registered, "Already registered");
        consumers[msg.sender] = Consumer({
            balance: 0,
            registered: true
        });
    }
    
    function setRate(uint256 _rate) external onlyProducer {
        producers[msg.sender].rate = _rate;
    }
    
    function activateSupply() external onlyProducer {
        producers[msg.sender].supplyActive = true;
    }
    
    function deactivateSupply() external onlyProducer {
        producers[msg.sender].supplyActive = false;
    }
    
    function isSupplyActive(address producer) public view returns (bool) {
        return producers[producer].supplyActive;
    }
    
    function deposit() external payable onlyConsumer {
        consumers[msg.sender].balance += msg.value;
    }
    
    function requestEnergy(address producer, uint256 amount) external onlyConsumer {
        require(!requests[producer].active, "Request already active");
        require(producers[producer].supplyActive, "Producer supply is inactive");
        uint256 rate = producers[producer].rate;
        require(rate > 0, "Producer has no rate set");
        
        requests[producer] = Request({
            consumer: msg.sender,
            rate: rate,
            requestTime: block.timestamp,
            acceptTime: 0,
            settleTime: 0,
            requestedAmount: amount,
            active: true
        });
    }
    
    function acceptRequest(address consumer) external onlyProducer {
        Request storage request = requests[msg.sender];
        require(request.consumer == consumer, "No request from this consumer");
        require(request.acceptTime == 0, "Request already accepted");
        request.acceptTime = block.timestamp;
    }
    // Deliver Amount will be encrypted and decrypted by the verify function
    
    uint256 deliveredAmount;
    
    function verify( uint256 _deliveredAmount) public{
        deliveredAmount = _deliveredAmount;
    }
    

    function settlePayment(address producer) external {
        Request storage request = requests[producer];
        require(request.active, "No active request");
        require(request.acceptTime > 0, "Request not accepted yet");
        require(deliveredAmount > 0, "Amount must be positive");
        
        uint256 amount = deliveredAmount * request.rate;
        Consumer storage consumer = consumers[request.consumer];
        require(consumer.balance >= amount, "Insufficient balance");
        
        consumer.balance -= amount;
        producers[producer].balance += amount;
        request.settleTime = block.timestamp;
        request.active = false;
        
        // Store transaction in history
        transactionHistory.push(Transaction({
            producer: producer,
            consumer: request.consumer,
            amount: amount,
            duration: request.settleTime - request.acceptTime,
            timestamp: block.timestamp
        }));

        
    }
    
    // Get request details
    function getRequestDetails(address producer) public view returns (
        address consumer,
        uint256 rate,
        uint256 requestTime,
        uint256 acceptTime,
        uint256 settleTime,
        uint256 requestedAmount,
        bool active
    ) {
        Request storage request = requests[producer];
        return (
            request.consumer,
            request.rate,
            request.requestTime,
            request.acceptTime,
            request.settleTime,
            request.requestedAmount,
            request.active
        );
    }
    
    // Get transaction history count
    function getTransactionCount() public view returns (uint256) {
        return transactionHistory.length;
    }
    
    // Get transaction details by index
    function getTransaction(uint256 index) public view returns (
        address producer,
        address consumer,
        uint256 amount,
        uint256 duration,
        uint256 timestamp
    ) {
        require(index < transactionHistory.length, "Invalid index");
        Transaction storage t = transactionHistory[index];
        return (
            t.producer,
            t.consumer,
            t.amount,
            t.duration,
            t.timestamp
        );
    }
    
    // Get all producers
    function getAllProducers() external view returns (address[] memory, uint256[] memory, bool[] memory) {
        uint256 count = producerAddresses.length;
        address[] memory addresses = new address[](count);
        uint256[] memory rates = new uint256[](count);
        bool[] memory activeStatuses = new bool[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address producerAddr = producerAddresses[i];
            addresses[i] = producerAddr;
            rates[i] = producers[producerAddr].rate;
            activeStatuses[i] = producers[producerAddr].supplyActive;
        }
        
        return (addresses, rates, activeStatuses);
    }
    
    function getProducerBalance(address producer) public view returns (uint256) {
        return producers[producer].balance;
    }
    
    function getConsumerBalance(address consumer) public view returns (uint256) {
        return consumers[consumer].balance;
    }
    
    function withdrawBalance() external onlyConsumer {
        uint256 amount = consumers[msg.sender].balance;
        require(amount > 0, "No balance to withdraw");
        consumers[msg.sender].balance = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function withdrawProducerBalance() external onlyProducer {
        uint256 amount = producers[msg.sender].balance;
        require(amount > 0, "No balance to withdraw");
        producers[msg.sender].balance = 0;
        payable(msg.sender).transfer(amount);
    }
    
    function terminateRequest(address producer) external {
        require(msg.sender == requests[producer].consumer || msg.sender == producer, "Not authorized");
        requests[producer].active = false;
    }
}