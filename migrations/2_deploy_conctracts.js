var ArchiveCertification = artifacts.require("./ArchiveCertification.sol")

module.exports = function(deployer){
  deployer.deploy(ArchiveCertification);
}
