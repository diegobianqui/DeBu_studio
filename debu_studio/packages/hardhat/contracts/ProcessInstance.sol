// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IProcessTemplate {
    function getStepCount() external view returns (uint256);
}

/**
 * @title ProcessInstance
 * @notice Represents a running instance of a process
 */
contract ProcessInstance {
    
    enum StepStatus { Pending, Completed, Rejected }

    struct StepState {
        StepStatus status;
        address actor;
        string data; // IPFS hash or raw data
        uint256 timestamp;
    }

    IProcessTemplate public template;
    uint256 public currentStepIndex;
    mapping(uint256 => StepState) public stepStates;
    address public initiator;

    event StepCompleted(uint256 indexed stepIndex, address indexed actor, string data);

    constructor(address _template, address _initiator) {
        template = IProcessTemplate(_template);
        initiator = _initiator;
        currentStepIndex = 0;
    }

    function executeStep(string memory _data) public {
        require(currentStepIndex < template.getStepCount(), "Process already completed");
        
        // In a real implementation, we would check permissions based on the step config
        
        stepStates[currentStepIndex] = StepState({
            status: StepStatus.Completed,
            actor: msg.sender,
            data: _data,
            timestamp: block.timestamp
        });

        emit StepCompleted(currentStepIndex, msg.sender, _data);
        currentStepIndex++;
    }

    function executeStepWithPayment(string memory _data) public payable {
        require(currentStepIndex < template.getStepCount(), "Process already completed");
        require(msg.value > 0, "Payment required");
        
        // In a real implementation, we would check permissions based on the step config
        
        stepStates[currentStepIndex] = StepState({
            status: StepStatus.Completed,
            actor: msg.sender,
            data: _data,
            timestamp: block.timestamp
        });

        emit StepCompleted(currentStepIndex, msg.sender, _data);
        currentStepIndex++;
        
        // The payment (msg.value) is now held in the contract
        // In a production system, you would transfer it to a treasury or beneficiary
    }

    function getStepState(uint256 index) public view returns (StepState memory) {
        return stepStates[index];
    }

    function isCompleted() public view returns (bool) {
        return currentStepIndex >= template.getStepCount();
    }
}
