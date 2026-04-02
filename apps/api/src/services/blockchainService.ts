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

const CONTRACT_ABI = [
  "function mintCertificate(address recipient, string memory curriculumTitle, uint256 totalMissions) public returns (uint256)",
  "function getCertificate(address recipient) public view returns (tuple(uint256 tokenId, address recipient, string curriculumTitle, uint256 totalMissions, uint256 completedAt))",
  "event CertificateMinted(address indexed recipient, uint256 indexed tokenId, string curriculumTitle, uint256 totalMissions)",
];

export async function mintCertificateNFT(
    userId: string,
    userEthereumWallet: string,
    curriculumTitle: string,
    totalMissions: number,
): Promise<{ tokenId: number; txHash: string; contractAddress: string; alreadyExists?: boolean }> {
    try {
        const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
        const signer = new ethers.Wallet(BLOCKCHAIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const recipientAddress = ethers.getAddress(userEthereumWallet);
        const tx = await contract.mintCertificate(recipientAddress, curriculumTitle, totalMissions);
        const receipt = await tx.wait();

        let tokenId = 0;
        for (const log of receipt?.logs || []) {
            try {
                const parsedLog = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
                });
                if (parsedLog?.name === "CertificateMinted") {
                    tokenId = Number(parsedLog.args.tokenId);
                    break;
                }
            } catch {
                // Skip logs that can't be parsed by this contract
            }
        }
        return { tokenId, txHash: tx.hash, contractAddress: CONTRACT_ADDRESS };
    } catch (error) {
        console.log("[mintCertificate] Error caught:", error);
        // Check if it's a "Certificate already exists" error, this is expected, not an error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Certificate already exists")) {
            // Try to fetch existing certificate info from blockchain
            try {
                const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const recipientAddress = ethers.getAddress(userEthereumWallet);
                const certData = await contract.getCertificate(recipientAddress);
                // certData is CertificateData struct with named properties
                return {
                    tokenId: Number(certData.tokenId),
                    txHash: "",
                    contractAddress: CONTRACT_ADDRESS,
                    alreadyExists: true,
                };
            } catch (fetchError) {
                console.log("[mintCertificate] Failed to fetch existing certificate:", fetchError);
                return { tokenId: 0, txHash: "", contractAddress: CONTRACT_ADDRESS, alreadyExists: true };
            }
        }
        console.error("Blockchain error:", error);
        throw error;
    }
}
