const hre = require("hardhat");

async function main() {
    console.log("⛓️  Deploying Chain Host contracts...\n");

    // Deploy ContentIntegrity
    const ContentIntegrity = await hre.ethers.getContractFactory("ContentIntegrity");
    const contentIntegrity = await ContentIntegrity.deploy();
    await contentIntegrity.waitForDeployment();
    const contentAddr = await contentIntegrity.getAddress();
    console.log(`✅ ContentIntegrity deployed to: ${contentAddr}`);

    // Deploy ChainIdentity
    const ChainIdentity = await hre.ethers.getContractFactory("ChainIdentity");
    const chainIdentity = await ChainIdentity.deploy();
    await chainIdentity.waitForDeployment();
    const identityAddr = await chainIdentity.getAddress();
    console.log(`✅ ChainIdentity deployed to:    ${identityAddr}`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Deployment complete!");
    console.log("Add these to your .env:");
    console.log(`CONTENT_INTEGRITY_ADDRESS=${contentAddr}`);
    console.log(`CHAIN_IDENTITY_ADDRESS=${identityAddr}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
