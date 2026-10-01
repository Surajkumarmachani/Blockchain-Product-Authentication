import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Deploys RegalPassportPoC with the deployer as admin and first minter.
export default buildModule("RegalPassportPoCModule", (m) => {
  const admin = m.getAccount(0);
  const passport = m.contract("RegalPassportPoC", [admin]);
  return { passport };
});
