import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying VotingManager with:', deployer.address);

    const VM = await ethers.getContractFactory('VotingManager');
    const vm = await VM.deploy();
    await vm.waitForDeployment();
    const address = await vm.getAddress();
    console.log('VotingManager deployed to:', address);

    const artifact = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                '../artifacts/contracts/VotingManager.sol/VotingManager.json'
            ),
            'utf8'
        )
    );

    const out = { address, abi: artifact.abi };
    const libPath = path.join(__dirname, '../../lib/votingManager.json');
    fs.writeFileSync(libPath, JSON.stringify(out, null, 2));
    console.log('ABI + address written to lib/votingManager.json');
}

main().catch((e) => { console.error(e); process.exit(1); });