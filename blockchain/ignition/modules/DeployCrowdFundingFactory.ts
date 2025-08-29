import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CrowdFundingFactoryModule", (m) => {
  const deployer = m.getAccount(0);

  const factory = m.contract("CrowdFundingFactory", [], {
    from: deployer,
  });

  return { factory };
});
