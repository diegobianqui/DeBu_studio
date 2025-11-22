// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

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
    uint256 public version;
    address public creator;
    
    Step[] public steps;

    constructor(
        string memory _name,
        string memory _description,
        uint256 _version,
        address _creator,
        Step[] memory _steps
    ) {
        name = _name;
        description = _description;
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
    
    // Future: function instantiate() external returns (address instance) {}
}