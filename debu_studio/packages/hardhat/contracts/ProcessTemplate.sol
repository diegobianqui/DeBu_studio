// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./ProcessInstance.sol";

/**
 * @title ProcessTemplate
 * @notice Represents an immutable blueprint of a bureaucratic process
 */
contract ProcessTemplate {
    
    struct Step {
        string name;
        string description;
        string actionType; // e.g., "form", "approval", "payment"
        string config;     // JSON string for schema/validation rules
    }

    string public name;
    string public description;
    string public category;
    uint256 public version;
    address public creator;
    uint256 public instantiationCount; // Track usage for rankings
    
    Step[] public steps;

    event InstanceCreated(address indexed instance, address indexed creator);
    event InstanceCountIncremented(address indexed template, uint256 newCount);
    
    // Keep track of instances per user for easy retrieval
    mapping(address => address[]) public userInstances;

    constructor(
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _version,
        address _creator,
        Step[] memory _steps
    ) {
        name = _name;
        description = _description;
        category = _category;
        version = _version;
        creator = _creator;
        
        for(uint i = 0; i < _steps.length; i++) {
            steps.push(_steps[i]);
        }
    }

    function getStepCount() public view returns (uint256) {
        return steps.length;
    }
    
    function getStep(uint256 index) public view returns (Step memory) {
        return steps[index];
    }
    
    function instantiate() external returns (address instance) {
        ProcessInstance newInstance = new ProcessInstance(address(this), msg.sender);
        userInstances[msg.sender].push(address(newInstance));
        
        // Increment instantiation counter for rankings
        instantiationCount++;
        
        emit InstanceCreated(address(newInstance), msg.sender);
        emit InstanceCountIncremented(address(this), instantiationCount);
        return address(newInstance);
    }

    function getUserInstances(address user) external view returns (address[] memory) {
        return userInstances[user];
    }
}