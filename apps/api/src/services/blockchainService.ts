import { ethers } from "ethers";

// Helper function to load env secure
function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const CONTRACT_ADDRESS = getEnvVar("CONTRACT_ADDRESS");
const AVALANCHE_RPC = getEnvVar("AVALANCHE_RPC_URL");
const BLOCKCHAIN_PRIVATE_KEY = getEnvVar("BLOCKCHAIN_PRIVATE_KEY");

// Convert userId to Ethereum address
function userIdToEthereumAddress(userId: string): string {
    const cleaned = userId.replace(/-/g, "");
    const address = "0x" + cleaned.substring(0, 40);
    return address;
}

const CONTRACT_ABI = [
    "function mintCertificate(address recipient, string memory curriculumTitle, uint256 totalMissions) public returns (uint256)",
    "function getCertificate(address recipient) public view returns (uint256 tokenId, address recipient, string curriculumTitle, uint256 totalMissions, uint256 completedAt)",
];

export async function mintCertificateNFT(
    userId: string,
    curriculumTitle: string,
    totalMissions: number
): Promise<{ tokenId: number; txHash: string }> {
    try {
        const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
        const signer = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const ethereumAddress = userIdToEthereumAddress(userId);

        const tx = await contract.mintCertificate(
            ethereumAddress,
            curriculumTitle,
            totalMissions
        );

        const receipt = await tx.wait();

        return {
            tokenId: receipt?.logs.length ?? 0,
            txHash: tx.hash,
        };
    } catch (error) {
        console.error("Blockchain error:", error);
        throw error;
    }
}