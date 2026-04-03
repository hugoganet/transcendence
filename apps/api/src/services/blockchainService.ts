/**
 * @module services/blockchainService
 * @description Mints NFT certificates on the blockchain via ethers.js.
 * Interacts with a deployed smart contract to record completion on-chain.
 */

import { ethers } from "ethers";

// Helper function to load env secure — called lazily so tests that don't
// use blockchain are not blocked by missing env vars.
function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getContractAddress(): string { return getEnvVar("CONTRACT_ADDRESS"); }
function getAvalancheRpc(): string { return getEnvVar("AVALANCHE_RPC_URL"); }
function getBlockchainPrivateKey(): string { return getEnvVar("BLOCKCHAIN_PRIVATE_KEY"); }

const CONTRACT_ABI = [
  "function mintCertificate(address recipient, string memory curriculumTitle, uint256 totalMissions) public returns (uint256)",
  "function getCertificate(address recipient) public view returns (tuple(uint256 tokenId, address recipient, string curriculumTitle, uint256 totalMissions, uint256 completedAt))",
  "event CertificateMinted(address indexed recipient, uint256 indexed tokenId, string curriculumTitle, uint256 totalMissions)",
];

/**
 * Mints an NFT certificate on the Avalanche blockchain for the given user.
 * Connects to the smart contract, calls mintCertificate, and extracts the tokenId
 * from the CertificateMinted event. If the certificate already exists on-chain,
 * fetches and returns the existing token data instead of throwing.
 */
export async function mintCertificateNFT(
    userId: string,
    userEthereumWallet: string,
    curriculumTitle: string,
    totalMissions: number,
): Promise<{ tokenId: number; txHash: string; contractAddress: string; alreadyExists?: boolean }> {
    try {
        const provider = new ethers.JsonRpcProvider(getAvalancheRpc());
        const signer = new ethers.Wallet(getBlockchainPrivateKey(), provider);
        const contract = new ethers.Contract(getContractAddress(), CONTRACT_ABI, signer);

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
        return { tokenId, txHash: tx.hash, contractAddress: getContractAddress() };
    } catch (error) {
        console.log("[mintCertificate] Error caught:", error);
        // Check if it's a "Certificate already exists" error, this is expected, not an error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("Certificate already exists")) {
            // Try to fetch existing certificate info from blockchain
            try {
                const provider = new ethers.JsonRpcProvider(getAvalancheRpc());
                const contract = new ethers.Contract(getContractAddress(), CONTRACT_ABI, provider);
                const recipientAddress = ethers.getAddress(userEthereumWallet);
                const certData = await contract.getCertificate(recipientAddress);
                // certData is CertificateData struct with named properties
                return {
                    tokenId: Number(certData[0]),
                    txHash: "",
                    contractAddress: getContractAddress(),
                    alreadyExists: true,
                };
            } catch (fetchError) {
                console.log("[mintCertificate] Failed to fetch existing certificate:", fetchError);
                return { tokenId: 0, txHash: "", contractAddress: getContractAddress(), alreadyExists: true };
            }
        }
        console.error("Blockchain error:", error);
        throw error;
    }
}
