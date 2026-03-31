pragma solidity ^0.8.0;

contract CertificateNFT {
    uint256 private tokenIdCounter = 1;
    
    struct Certificate {
        uint256 tokenId;
        address recipient;
        string curriculumTitle;
        uint256 totalMissions;
        uint256 completedAt;
    }
    
    mapping(address => Certificate) public certificates;
    mapping(uint256 => address) public tokenOwners;
    
    event CertificateMinted(
        address indexed recipient,
        uint256 tokenId,
        string curriculumTitle,
        uint256 totalMissions
    );
    
    function mintCertificate(
        address recipient,
        string memory curriculumTitle,
        uint256 totalMissions
    ) public returns (uint256) {
        require(certificates[recipient].tokenId == 0, "Certificate already exists");
        
        uint256 newTokenId = tokenIdCounter;
        tokenIdCounter++;
        
        certificates[recipient] = Certificate({
            tokenId: newTokenId,
            recipient: recipient,
            curriculumTitle: curriculumTitle,
            totalMissions: totalMissions,
            completedAt: block.timestamp
        });
        
        tokenOwners[newTokenId] = recipient;
        
        emit CertificateMinted(recipient, newTokenId, curriculumTitle, totalMissions);
        
        return newTokenId;
    }
    
    function getCertificate(address recipient) public view returns (Certificate memory) {
        return certificates[recipient];
    }
}
