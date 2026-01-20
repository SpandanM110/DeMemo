// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MemoryStorage
 * @dev Stores IPFS CIDs of encrypted AI memories, paid with USDC on Arc
 * @notice On Arc Network, USDC is the native gas token (like ETH on Ethereum)
 */
contract MemoryStorage {
    // Price to store one memory (0.01 USDC = 10000 because 6 decimals)
    uint256 public constant MEMORY_PRICE = 10000; // 0.01 USDC
    
    // Contract owner
    address public owner;
    
    // Structure for a memory entry
    struct Memory {
        string cid;           // IPFS content identifier
        uint256 timestamp;    // When it was stored
        bool exists;          // Flag for checking existence
    }
    
    // Mapping: user address => array of their memories
    mapping(address => Memory[]) private userMemories;
    
    // Mapping: user address => total memories count
    mapping(address => uint256) public userMemoryCount;
    
    // Events
    event MemoryStored(
        address indexed user,
        string cid,
        uint256 timestamp,
        uint256 index
    );
    
    event MemoryDeleted(
        address indexed user,
        uint256 index,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store a memory CID - requires payment of MEMORY_PRICE in USDC
     * @param _cid IPFS content identifier for the encrypted memory
     */
    function storeMemory(string memory _cid) external payable {
        require(msg.value >= MEMORY_PRICE, "Insufficient payment: need 0.01 USDC");
        require(bytes(_cid).length > 0, "CID cannot be empty");
        
        // Create memory entry
        Memory memory newMemory = Memory({
            cid: _cid,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Store memory
        userMemories[msg.sender].push(newMemory);
        userMemoryCount[msg.sender]++;
        
        // Emit event
        emit MemoryStored(
            msg.sender,
            _cid,
            block.timestamp,
            userMemories[msg.sender].length - 1
        );
        
        // Refund excess payment using call instead of transfer
        if (msg.value > MEMORY_PRICE) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - MEMORY_PRICE}("");
            require(success, "Refund failed");
        }
    }
    
    /**
     * @dev Get all memory CIDs for a user
     * @param _user User's wallet address
     * @return cids Array of CID strings
     */
    function getUserMemories(address _user) 
        external 
        view 
        returns (string[] memory cids) 
    {
        uint256 count = userMemories[_user].length;
        cids = new string[](count);
        
        for (uint256 i = 0; i < count; i++) {
            if (userMemories[_user][i].exists) {
                cids[i] = userMemories[_user][i].cid;
            }
        }
        
        return cids;
    }
    
    /**
     * @dev Get detailed memory information for a user
     * @param _user User's wallet address
     * @return cids Array of IPFS CIDs
     * @return timestamps Array of storage timestamps
     */
    function getUserMemoriesDetailed(address _user)
        external
        view
        returns (string[] memory cids, uint256[] memory timestamps)
    {
        uint256 count = userMemories[_user].length;
        cids = new string[](count);
        timestamps = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            if (userMemories[_user][i].exists) {
                cids[i] = userMemories[_user][i].cid;
                timestamps[i] = userMemories[_user][i].timestamp;
            }
        }
        
        return (cids, timestamps);
    }
    
    /**
     * @dev Get memory count for a user
     * @param _user User's wallet address
     * @return count Number of memories stored
     */
    function getUserMemoryCount(address _user) 
        external 
        view 
        returns (uint256 count) 
    {
        return userMemoryCount[_user];
    }
    
    /**
     * @dev Get a specific memory by index
     * @param _user User's wallet address
     * @param _index Memory index
     * @return cid The IPFS content identifier
     * @return timestamp When the memory was stored
     */
    function getMemoryByIndex(address _user, uint256 _index)
        external
        view
        returns (string memory cid, uint256 timestamp)
    {
        require(_index < userMemories[_user].length, "Index out of bounds");
        require(userMemories[_user][_index].exists, "Memory does not exist");
        
        Memory memory mem = userMemories[_user][_index];
        return (mem.cid, mem.timestamp);
    }
    
    /**
     * @dev Delete a memory (marks as deleted, doesn't actually remove)
     * @param _index Index of memory to delete
     */
    function deleteMemory(uint256 _index) external {
        require(_index < userMemories[msg.sender].length, "Index out of bounds");
        require(userMemories[msg.sender][_index].exists, "Memory already deleted");
        
        userMemories[msg.sender][_index].exists = false;
        userMemoryCount[msg.sender]--;
        
        emit MemoryDeleted(msg.sender, _index, block.timestamp);
    }
    
    /**
     * @dev Get contract balance (total USDC collected)
     * @return balance Contract balance in USDC
     */
    function getContractBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
    
    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        // Use call instead of transfer
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner, balance);
    }
    
    /**
     * @dev Get current memory price
     * @return price Price in USDC (6 decimals)
     */
    function getMemoryPrice() external pure returns (uint256 price) {
        return MEMORY_PRICE;
    }
    
    /**
     * @dev Check if a user has any memories
     * @param _user User's wallet address
     * @return hasAny True if user has at least one memory
     */
    function hasMemories(address _user) external view returns (bool hasAny) {
        return userMemoryCount[_user] > 0;
    }
}
