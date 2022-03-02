pragma solidity ^0.5.7;

contract archiveCertification{
  function setCaseBox(address _caseBox_addr,
  uint256 _caseBox_uid, uint256 unit_box_uid,
    address sender, string memory lat,
    string memory lon) public;
}

contract caseboxCertification{

  struct processAction{
    address from;
    string action;
    string latitude;
    string longitude;
    uint256 timestamp;
  }

  struct Certificate{
    address box_owner;
    string name;
    string description;
    processAction[] process_data;
    unitBox[] unit_boxes;
    uint256 unique_identifier;
    address unitLoadAddr;
    uint256 unitLoad_UId;
  }

  struct unitBox{
    address unitBox_addr;
    uint256 unitBox_UId;
  }


  address payable contract_owner;
  //map of box_certifications
  mapping (uint256 => Certificate) public box_certificates;


  // modifiers
  modifier contractOwner() {
    require(msg.sender == contract_owner, "Error setting owner");
    _;
  }

  // constructor
  constructor () public {
    contract_owner = msg.sender;
  }

  // deactivate the contract
  function kill() public contractOwner {
    selfdestruct(contract_owner);
  }

  // events
  event LogSignCertificate(
    uint indexed _unique_identifier,
    address indexed _process_owner,
    string _name
  );

  // events
  event LogModifyCertificate(
    uint _unique_identifier,
    string _information
  );

  // events
  event LogModifyProcessOwner(
    address _newOwner,
    uint _unique_identifier
  );

  event LogAddUnitBox(
    uint256 _unique_identifier,
    uint256 casebox_id,
    address unitBoxAddr
  );


  function signCertificate(address _process_owner, string memory _name,
  string memory _description, uint256 _unique_identifier) public contractOwner{

    box_certificates[_unique_identifier].box_owner = _process_owner;
    box_certificates[_unique_identifier].name = _name;
    box_certificates[_unique_identifier].description = _description;
    box_certificates[_unique_identifier].process_data.push (processAction(msg.sender,"Init", "0.0", "0.0", block.timestamp ));
    box_certificates[_unique_identifier].unique_identifier = _unique_identifier;
    box_certificates[_unique_identifier].unitLoadAddr = address(0);
    box_certificates[_unique_identifier].unitLoad_UId = 0;


    emit LogSignCertificate(_unique_identifier, _process_owner, _name);
  }

  function addUnitBox(uint256 unitbox_id, uint256 casebox_id, address unitBoxAddr, string memory lat, string memory lon) public {
    require(msg.sender == box_certificates[casebox_id].box_owner,"Error add unit box");
    box_certificates[casebox_id].unit_boxes.push(unitBox(unitBoxAddr,unitbox_id));
    box_certificates[casebox_id].process_data.push (processAction(msg.sender,"Added a new Unit Box", lat, lon, block.timestamp ));

    archiveCertification unitBox_certificate = archiveCertification(unitBoxAddr);
    unitBox_certificate.setCaseBox(address(this), casebox_id, unitbox_id, msg.sender, lat, lon);

    emit LogAddUnitBox(unitbox_id, casebox_id, unitBoxAddr);
  }

  function getCertificate(uint _unique_identifier) public view returns (
    address, string memory, string memory, address, uint, address, uint256){

    require(box_certificates[_unique_identifier].unique_identifier == _unique_identifier, "Error getCertificate");


    return (box_certificates[_unique_identifier].box_owner,
    box_certificates[_unique_identifier].name,
    box_certificates[_unique_identifier].description,
    address(this),
    box_certificates[_unique_identifier].process_data.length,
    box_certificates[_unique_identifier].unitLoadAddr,
    box_certificates[_unique_identifier].unitLoad_UId);
  }

  function getNumBoxes (uint _unique_identifier) public view returns (uint){
    return box_certificates[_unique_identifier].unit_boxes.length;
  }

  function getProcessInfo(uint256 _unique_identifier, uint _processIndex)
  public view returns (address, string memory, string memory, string memory, uint256){
    require(box_certificates[_unique_identifier].unique_identifier == _unique_identifier, "Error getCertificateInfo");

    return (box_certificates[_unique_identifier].process_data[_processIndex].from,
    box_certificates[_unique_identifier].process_data[_processIndex].action,
    box_certificates[_unique_identifier].process_data[_processIndex].latitude,
    box_certificates[_unique_identifier].process_data[_processIndex].longitude,
    box_certificates[_unique_identifier].process_data[_processIndex].timestamp);
  }
  function getBoxesInfo(uint256 _unique_identifier, uint _boxIndex)
  public view returns (address, uint256){
    require(box_certificates[_unique_identifier].unique_identifier == _unique_identifier, "Error getBoxesInfo");

    return (box_certificates[_unique_identifier].unit_boxes[_boxIndex].unitBox_addr,
      box_certificates[_unique_identifier].unit_boxes[_boxIndex].unitBox_UId
    );
  }
  function modifyCertificate(uint256 _unique_identifier, string memory _information, string memory lat, string memory lon) public {
    require(msg.sender == box_certificates[_unique_identifier].box_owner,"Error modifyCertificate");

    box_certificates[_unique_identifier].process_data.push (processAction(msg.sender,_information, lat, lon, block.timestamp ));
    emit LogModifyCertificate(_unique_identifier, _information);
  }

  function modifyProcessOwner(uint256 _unique_identifier, address _newOwner, string memory lat, string memory lon) public {
    require(msg.sender == box_certificates[_unique_identifier].box_owner,"Error modifyProcessOwner");

    box_certificates[_unique_identifier].box_owner = _newOwner;
    bytes memory ownerAction = abi.encodePacked("Transfer of ownership to ");
    ownerAction = abi.encodePacked(ownerAction,addressToString(_newOwner));
    box_certificates[_unique_identifier].process_data.push (processAction(msg.sender,string(ownerAction), lat, lon, block.timestamp ));
    emit LogModifyProcessOwner(_newOwner, _unique_identifier);
  }

  function getCertificateOwner(uint256 _unique_identifier) public view returns (address){
    Certificate storage certificate = box_certificates[_unique_identifier];
    return certificate.box_owner;
  }

  function getLastBlockTimestamp() public view returns (uint) {
    return  block.timestamp;
  }

  function addressToString(address _addr) public pure returns(string memory)
  {
    bytes32 value = bytes32(uint256(_addr));
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(51);
    str[0] = '0';
    str[1] = 'x';
    for (uint256 i = 0; i < 20; i++) {
        str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
        str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
    }
    return string(str);
  }


}
