// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title StepHandlers
 * @notice Handles custom logic for different step types (approval, payment, etc.)
 */
contract StepHandlers {
    
    // Payment conversion rate: 1 ETH = 2500 USD
    uint256 public constant USD_PER_ETH = 2500;
    
    // Approval signatures storage
    mapping(address => mapping(address => bytes)) public approvalSignatures;
    mapping(address => mapping(address => uint256)) public approvalTimestamps;
    
    event ApprovalSigned(address indexed approver, address indexed processInstance, string approvalHash);
    event PaymentProcessed(address indexed payer, address indexed processInstance, uint256 amountWei, uint256 amountUsd);
    
    /**
     * @notice Convert USD amount to Wei (assumes 1 ETH = 2500 USD)
     * @param amountUsd The amount in USD (can be decimal, e.g., 100.50 represented as 10050)
     * @return amountWei The equivalent amount in Wei
     */
    function convertUsdToWei(uint256 amountUsd) public pure returns (uint256) {
        // amountUsd is in cents (e.g., 100.50 USD = 10050)
        // We need to convert to Wei: (amountUsd / (USD_PER_ETH * 100)) * 10^18
        // = (amountUsd * 10^18) / (USD_PER_ETH * 100)
        return (amountUsd * 10 ** 18) / (USD_PER_ETH * 100);
    }
    
    /**
     * @notice Convert Wei to USD amount
     * @param amountWei The amount in Wei
     * @return amountUsd The equivalent amount in USD (in cents)
     */
    function convertWeiToUsd(uint256 amountWei) public pure returns (uint256) {
        // amountWei * (USD_PER_ETH * 100) / 10^18
        return (amountWei * (USD_PER_ETH * 100)) / (10 ** 18);
    }
    
    /**
     * @notice Record an approval signature for a process step
     * @param processInstance The address of the process instance
     * @param approvalHash A hash representing the approval (e.g., IPFS hash)
     */
    function signApproval(address processInstance, string memory approvalHash) external {
        approvalSignatures[msg.sender][processInstance] = abi.encodePacked(approvalHash);
        approvalTimestamps[msg.sender][processInstance] = block.timestamp;
        emit ApprovalSigned(msg.sender, processInstance, approvalHash);
    }
    
    /**
     * @notice Check if an approval has been signed
     * @param approver The address of the approver
     * @param processInstance The address of the process instance
     * @return hasApproved Whether the approval was signed
     */
    function hasApprovalSigned(address approver, address processInstance) external view returns (bool) {
        return approvalTimestamps[approver][processInstance] > 0;
    }
    
    /**
     * @notice Process a payment for a process step
     * @param processInstance The address of the process instance
     * @param amountUsd The amount in USD (represented in cents, e.g., 100.50 USD = 10050)
     * @return amountWei The equivalent amount in Wei
     */
    function processPayment(address processInstance, uint256 amountUsd) external payable returns (uint256) {
        uint256 requiredWei = convertUsdToWei(amountUsd);
        require(msg.value >= requiredWei, "Insufficient ETH sent for payment");
        
        // If overpaid, refund the excess
        if (msg.value > requiredWei) {
            (bool success, ) = msg.sender.call{value: msg.value - requiredWei}("");
            require(success, "Refund failed");
        }
        
        emit PaymentProcessed(msg.sender, processInstance, requiredWei, amountUsd);
        return requiredWei;
    }
    
    /**
     * @notice Withdraw collected funds (admin function)
     */
    function withdraw() external {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
    
    receive() external payable {}
}
