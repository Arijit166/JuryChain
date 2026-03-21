import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    const Factory = await ethers.getContractFactory("CompetitionFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    console.log("CompetitionFactory deployed to:", address);

    // Write address + ABI to lib/ so Next.js can use it
    const artifact = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, "../artifacts/contracts/CompetitionFactory.sol/CompetitionFactory.json"),
            "utf8"
        )
    );

    const out = {
        address,
        abi: artifact.abi,
    };

    // Write to contracts/deployed.json (commit this after deploy)
    fs.writeFileSync(
        path.join(__dirname, "../deployed.json"),
        JSON.stringify(out, null, 2)
    );

    // Also write to lib/ in the Next.js app for import
    const libPath = path.join(__dirname, "../../lib/deployedContract.json");
    fs.writeFileSync(libPath, JSON.stringify(out, null, 2));

    console.log("ABI + address written to lib/deployedContract.json");
}

main().catch((e) => { console.error(e); process.exit(1); });