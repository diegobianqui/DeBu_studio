import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployDeBu: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("DeBuDeployer", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  await deploy("StepHandlers", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployDeBu;
deployDeBu.tags = ["DeBuDeployer"];