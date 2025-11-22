// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./ProcessTemplate.sol";

/**
 * @title DeBuDeployer
 * @notice Factory contract for deploying new Process Templates
 */
contract DeBuDeployer {
    
    // Events to index deployments for the frontend
    event ProcessDeployed(
        address indexed processAddress, 
        address indexed creator, 
        string name, 
        uint256 version
    );

    address[] public deployedProcesses;

    /**
     * @notice Deploys a new Process Template
     * @param _name Name of the process
     * @param _description Brief description
     * @param _steps Array of steps defining the process flow
     */
    function deployProcess(
        string memory _name,
        string memory _description,
        ProcessTemplate.Step[] memory _steps
    ) public returns (address) {
        
        ProcessTemplate newProcess = new ProcessTemplate(
            _name,
            _description,
            1, // Initial version is always 1
            msg.sender,
            _steps
        );

        deployedProcesses.push(address(newProcess));
        
        emit ProcessDeployed(address(newProcess), msg.sender, _name, 1);
        
        return address(newProcess);
    }

    function getDeployedProcessesCount() public view returns (uint256) {
        return deployedProcesses.length;
    }
}