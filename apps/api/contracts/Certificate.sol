// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CertificateNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private tokenIdCounter = 1;

    struct CertificateData {
        uint256 tokenId;
        address recipient;
        string curriculumTitle;
        uint256 totalMissions;
        uint256 completedAt;
    }

    mapping(address => uint256) public userTokenId;
    mapping(uint256 => CertificateData) public certificateData;

    event CertificateMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string curriculumTitle,
        uint256 totalMissions
    );

    constructor() ERC721("Transcendence Certificate", "TCERT") Ownable(msg.sender) {}

    function mintCertificate(
        address recipient,
        string memory curriculumTitle,
        uint256 totalMissions
    ) public onlyOwner returns (uint256) {
        require(userTokenId[recipient] == 0, "Certificate already exists");
        require(recipient != address(0), "Invalid recipient");

        uint256 newTokenId = tokenIdCounter;
        tokenIdCounter++;

        _safeMint(recipient, newTokenId);

        certificateData[newTokenId] = CertificateData({
            tokenId: newTokenId,
            recipient: recipient,
            curriculumTitle: curriculumTitle,
            totalMissions: totalMissions,
            completedAt: block.timestamp
        });

        userTokenId[recipient] = newTokenId;

        emit CertificateMinted(recipient, newTokenId, curriculumTitle, totalMissions);

        return newTokenId;
    }

    function getCertificate(address recipient)
        public
        view
        returns (CertificateData memory)
    {
        uint256 tokenId = userTokenId[recipient];
        require(tokenId != 0, "No certificate found");
        return certificateData[tokenId];
    }

    function getCertificateMetadata(uint256 tokenId)
        public
        view
        returns (CertificateData memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return certificateData[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        CertificateData memory cert = certificateData[tokenId];

        string memory svg = _generateSVG(tokenId, cert);
        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(abi.encodePacked(
            '{"name": "Transcendence Certificate #', tokenId.toString(), '",',
            '"description": "Certificate of completion for ', cert.curriculumTitle, '. This NFT certifies that the holder has successfully completed the curriculum.",',
            '"image": "data:image/svg+xml;base64,', svgBase64, '",',
            '"attributes": [',
                '{"trait_type": "Curriculum", "value": "', cert.curriculumTitle, '"},',
                '{"trait_type": "Missions Completed", "display_type": "number", "value": ', cert.totalMissions.toString(), '},',
                '{"trait_type": "Completed At", "display_type": "date", "value": ', cert.completedAt.toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _generateSVG(uint256 tokenId, CertificateData memory cert) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">',
            '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#1a1a2e"/>',
                    '<stop offset="100%" style="stop-color:#16213e"/>',
                '</linearGradient>',
                '<linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">',
                    '<stop offset="0%" style="stop-color:#f4d03f"/>',
                    '<stop offset="50%" style="stop-color:#f5b041"/>',
                    '<stop offset="100%" style="stop-color:#f4d03f"/>',
                '</linearGradient>',
            '</defs>',
            '<rect width="400" height="500" fill="url(#bg)"/>',
            '<rect x="10" y="10" width="380" height="480" rx="10" fill="none" stroke="url(#gold)" stroke-width="3"/>',
            '<rect x="20" y="20" width="360" height="460" rx="8" fill="none" stroke="url(#gold)" stroke-width="1" opacity="0.5"/>',
            _generateSVGText(tokenId, cert),
            '</svg>'
        ));
    }

    function _generateSVGText(uint256 tokenId, CertificateData memory cert) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<text x="200" y="60" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="28" font-weight="bold">CERTIFICATE</text>',
            '<text x="200" y="90" text-anchor="middle" fill="#f4d03f" font-family="Georgia, serif" font-size="14">OF COMPLETION</text>',
            '<line x1="50" y1="120" x2="350" y2="120" stroke="url(#gold)" stroke-width="1" opacity="0.5"/>',
            '<text x="200" y="180" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="12">This certifies completion of</text>',
            '<text x="200" y="220" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="20" font-weight="bold">', cert.curriculumTitle, '</text>',
            '<text x="200" y="290" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14">', cert.totalMissions.toString(), ' Missions Completed</text>',
            '<line x1="50" y1="380" x2="350" y2="380" stroke="url(#gold)" stroke-width="1" opacity="0.5"/>',
            '<text x="200" y="420" text-anchor="middle" fill="#888888" font-family="Arial, sans-serif" font-size="10">Token ID: #', tokenId.toString(), '</text>',
            '<text x="200" y="460" text-anchor="middle" fill="url(#gold)" font-family="Georgia, serif" font-size="16" font-style="italic">Transcendence</text>'
        ));
    }
}
