App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,
  certificateUniqueID : null,
  currLat : null,
  currLon : null,
  init: function() {
    return App.initWeb3();
  },

  createQRCodeCertificate:(infoCertificate)=>{
      canvas = document.getElementById('QRCodeCanvasProd');
      QRCode.toCanvas(canvas, infoCertificate, function(error){
          if(error) console.error(error)
          console.log('qrcode certificate success!');
      })
  },

  getLocation:() =>{
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(App.giveLatLon);
    } else {
      console.log('Geolocation is not supported by this browser');
    }
  },

  giveLatLon:(position) => {
    currLat= position.coords.latitude.toString();
    currLon=position.coords.longitude.toString();
  },

  showMap:(lat,lon) => {
  $("#map")
          .html(
                '<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q='+lat+','+lon+'&hl=en&z=14&amp;output=embed"></iframe>');
  },

  initWeb3: async() => {
    urlParams = new URLSearchParams(window.location.search);
    certificateUniqueID = urlParams.get('UniqueIdentifier');
    App.getLocation();
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      try {
          await window.ethereum.enable();
          App.displayAccountInfo();
          return App.initContract();
      } catch(error) {
          console.error("Unable to retrieve your accounts! You have to approve this application on Metamask");
      }
  } else if(window.web3) {
      window.web3 = new Web3(web3.currentProvider || "https://ropsten.infura.io/v3/1be98c0a50ad4e9384e56e257aa5446a");
      App.displayAccountInfo();
      return App.initContract();
  } else {
      //no dapp browser
      console.log("Non-ethereum browser detected. You should consider trying Metamask");
  }

  },


  displayAccountInfo: () =>{
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddr').text(account);
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        })
      }
    });
  },

  initContract: async () => {
    $.getJSON('ArchiveCertification.json', archiveCertificationArtifact => {
      App.contracts.ArchiveCertification = TruffleContract(archiveCertificationArtifact);
      App.contracts.ArchiveCertification.setProvider(window.web3.currentProvider);
      App.listenToEvents();
      return App.reloadCertification();
  });
  },

   reloadCertification: async () =>{
        if(App.loading) {
            return;
        }
        App.loading = true;
         $("#card-body").empty();
        App.displayAccountInfo();

        try{
          const ArchiveCertificationInstance = await App.contracts.ArchiveCertification.deployed();
          const certificationInfo = await ArchiveCertificationInstance.getCertificate(certificateUniqueID);
          var currentOwner = (certificationInfo[0]).split("§§");

          $('#certName').text(certificationInfo[1]);
          $('#certDescr').text(certificationInfo[2]);
          $('#certCurrOwner').text(currentOwner);
          $('#certUniqueId').text(certificateUniqueID);
          $('#contractAddr').text(certificationInfo[3]);
          if(certificationInfo[6]!=0){
            $('#caseboxAddr').text(certificationInfo[5]);
            $('#caseBoxUniqueId').text(certificationInfo[6]);
          }else{
            $('#caseboxAddr').text("Not yet assigned");
            $('#caseBoxUniqueId').text("Not yet assigned");
          }



          App.createQRCodeCertificate(certificationInfo[3]+'&'+certificateUniqueID);

          for(var i=0;i<parseInt(certificationInfo[4]);i++){
          await App.loadAction(i,ArchiveCertificationInstance);
          }

          App.loading = false;
        }catch(error) {
          console.log(error);
          App.loading = false;
        }
    },

    loadAction: async (index, certificateInstance) =>{
      try{
      const processInfo = await certificateInstance.getProcessInfo(certificateUniqueID, index);

      $('#card-body').append('<div class = "m-0 font-weight-bold text-primary" id="cont'+index+'"></div>');
      $('#cont'+index+'').append('<a data-toggle = "collapse" href = "#actionslist'+index+'">'+(index+1)+'.  '+processInfo[1]+'</a>');
      $('#card-body').append('<div id = "actionslist'+index+'" class="panel-collapse collapse"></div>');
      $('#actionslist'+index+'').append('<ul class = "m-0 font-weight-bold text-primary" id="ullist'+index+'"></ul>');
      $('#ullist'+index+'').append('<li class = "list-group-item">Owner<p class="text-muted" id="actionFrom'+index+'"></p></li>');
      $('#ullist'+index+'').append('<li class = "list-group-item">Timestamp<p class="text-muted" id="actionTS'+index+'"></p></li>');
      if(index!=0){
          $('#ullist'+index+'').append('<li class = "list-group-item">Position'+
          '<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" '+
          'src="https://maps.google.com/maps?q='+processInfo[2]+','+processInfo[3]+'&hl=en&z=14&amp;output=embed"></iframe></li>');
          App.showMap(processInfo[2],processInfo[3]);
      }
      $('#actionFrom'+index+'').text(processInfo[0]);
          $('#actionTS'+index+'').text(new Date(processInfo[4]*1000).toISOString().replace(/T/, " ").replace(/\..+/,''));
              App.loading = false;
      }catch(error) {
        console.log(error);
        App.loading = false;
      }
    },

    modifyStatus: async () =>{
    if (confirm("Are you sure to modify the status?")) {
        var _newStatus = $('#newStatus').val();
        try {
          const ArchiveCertificationInstance = await App.contracts.ArchiveCertification.deployed();
          const modifyStatus = await ArchiveCertificationInstance.modifyCertificate(certificateUniqueID, _newStatus, currLat, currLon, {
            from: App.account,
            gas: 500000
          })
        }catch(error) {
          console.error(error);
        }
      }
  },

    modifyProcessOwner: async () =>{
    if (confirm("Are you sure to modify the owner?")) {
        var _newOwner = $('#newOwner').val();
          try {
            const ArchiveCertificationInstance = await App.contracts.ArchiveCertification.deployed();
            const modifyOwner = await ArchiveCertificationInstance.modifyProcessOwner(certificateUniqueID,_newOwner, currLat, currLon, {
              from: App.account,
              gas: 500000
            })
        $('#newOwner').val("");
        }catch(error) {
          console.error(error);
        }
    }
  },

  listenToEvents: async () => {
      const ArchiveCertificationInstance = await App.contracts.ArchiveCertification.deployed();
      ArchiveCertificationInstance.LogModifyCertificate({}, {}).watch(function(error, event) {
        if (error) {
          console.error(error);
        }
        App.reloadCertification();
      });
      ArchiveCertificationInstance.LogModifyProcessOwner({}, {}).watch(function(error, event) {
        App.reloadCertification();
      });
  },
};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
