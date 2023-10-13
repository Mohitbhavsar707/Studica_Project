const { ConnectionBuilder } = require('electron-cgi');
const Swal = require('sweetalert2');
// const Mousetrap = require('mousetrap');

//==================================VARIABLE DECLARATION======================================

//Boolean variables to store user selection from downloads list
let selected1 = false;
let selected2 = false;
let selected3 = false;
let selected4 = false;
let selected5 = false;
let selected6 = false;
let selected7 = false;
let selected8 = false;
let selected9 = false;
let selected10 = false;
let selected11 = false;
let selected12 = false;
let selected13 = false;
let selected14 = false;

//Adding Download - 5:

//Template:
//let selected[#] = false;
//--------



//Variable to store connected device to attach guided tour to
let deviceTourSelectedName = null;

//Boolean to store when sensor fusion data recording to excel file has started/ended
let started = false;

//Boolean to store if a DFU device is connected to the app
let dfu_device_present = false;

let ports = [];
let downloadsList = [];
let emptyArray = [];
let newDownloadsList = [];

let _connection = null;
let info = null;

//Adding Device - 3: Variable declaration for device index
let navx2_mxp_index = null;
let navx2_mxp_index2 = null;
let navx2_mxp_index3 = null;

let navxmicro_index = null;
let navxmicro_index2 = null;
let navxmicro_index3 = null;

let vmxpi_index = null;
let vmxpi_index2 = null;
let vmxpi_index3 = null;

//Add additional devices here

//--------------------------

let selected_update_path = null;
let selected_device_index = null;
let selected_device_name = null;

let selected_file = null;

let download_url = null;
let path_length = null;

let yawval = null;
let plus90values = [5];
let minus90values = [5];

let update_info = null;
let versions = null;

let x_matrix = [];
let y_matrix = [];
let z_matrix = [];
let bias_matrix = [];
let x = null;
let y = null;
let z = null;

let pitchval = null;
let rollval = null;



// Function to run the tour only once at the startup of the app
function initApp () {
    var hasStarted = false;
    return function (){
        if(!hasStarted && !localStorage.getItem('tourCompleted')) {
            hasStarted = true;
            localStorage.setItem('tourCompleted', true);
            startTour();
        }
    };
}

var startApp = initApp();
startApp();


//Loading Screen Animation 
window.onload = function () {
    setTimeout(function () {
        document.querySelector(".loading-screen").style.display = "none";
    }, 1500);

    //Set the default mode to light for the app
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-mode');
    toggleSwitch.checked = false;
    localStorage.setItem('theme', 'light');

    const autoDFUPopup = document.getElementById('autoDfuSelectionContainer');
    const autoDFUPopupClose = document.getElementById('closeSelectContainerBtn');


    autoDFUPopupClose.addEventListener('click', () => {
        autoDFUPopup.classList.remove('visible');
        });
};



// Interactive Tour Functionality
const toggleBtn = document.getElementById('toggle-tour');
let tourEnabled = false;

function startTour() {
  tour.start();
  document.getElementById("deviceDashboard").click();

  toggleBtn.style.backgroundColor = '#505257';
  toggleBtn.innerHTML = 'Disable Tour <i class="fa-solid fa-toggle-off"></i>';
}

function cancelTour() {
  tour.cancel();
  toggleBtn.style.backgroundColor = '#3FB1E7';
  toggleBtn.innerHTML = 'Enable Tour <i class="fa-solid fa-toggle-on"></i>';
}

function toggleTour() {
  if (tourEnabled) {
    cancelTour();
  } else {
    startTour();
    window.dispatchEvent(new Event('resize'));
  }
  tourEnabled = !tourEnabled;
}

toggleBtn.addEventListener('click', toggleTour);

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.key === 'T') {
    toggleTour();
  }
});

if (tourEnabled) {
  startTour();
  window.dispatchEvent(new Event('resize'));
  tourEnabled = true;
}



//Dark Mode Functionality
//Referenced from:https://dev.to/ananyaneogi/create-a-dark-light-mode-switch-with-css-variables-34l8
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (currentTheme === 'dark') {
    toggleSwitch.checked = true;
  } 
} 

function switchTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-mode');
      toggleSwitch.checked = false;
      localStorage.setItem('theme', 'light');
      material.color.set(0x316AC8);
      material2.color.set(0x316AC8);
      material3.color.set(0x316AC8);

    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
      toggleSwitch.checked = true;
      localStorage.setItem('theme', 'dark');
      material.color.set(0x3FB1E7);
      material2.color.set(0x3FB1E7);
      material3.color.set(0x3FB1E7);

    }
  }  

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.shiftKey && event.code === 'KeyN') {
    switchTheme();
  }
});

toggleSwitch.addEventListener('change', switchTheme, false);






function setupConnectionToRestartOnConnectionLost() {
    //Debugging & Build Config:
    //For Dev Mode: Comment out the next line for release build/remove comment for dev build:
    _connection = new ConnectionBuilder().connectTo('dotnet', 'run', '--project', 'CSHARP').build(); 
    
    //For Release Build: comment out the next line for dev build/remove comment for release build:
    //_connection = new ConnectionBuilder().connectTo('dotnet', 'run', '--project', 'resources/app/CSHARP').build(); //Remove comment for release build
    
    //For Release Build (.exe): Comment out the next line for dev build/remove comment for release build:
    //_connection = new ConnectionBuilder().connectTo('resources/app/CSHARP/bin/Debug/netcoreapp6.0/publish/ConsoleApp1.exe').build(); //Remove comment for release build (.exe csharp)
    
    //------------------------
    _connection.onDisconnect = () => {
        alert('Connection lost, restarting...');
        setupConnectionToRestartOnConnectionLost();
    };
}
setupConnectionToRestartOnConnectionLost();
_connection.on('update', message => {
    alert(message);
});

//Adding Device - 4: Toggle off visibility of new device button

//To disable and hide device buttons on startup, indicating device is not connected
document.getElementById("VMXBtn").style.display = "none";
document.getElementById("VMXBtn2").style.display = "none";
document.getElementById("VMXBtn3").style.display = "none";
document.getElementById("navx2_MicroBtn").style.display = "none";
document.getElementById("navx2_MicroBtn2").style.display = "none";
document.getElementById("navx2_MicroBtn3").style.display = "none";
document.getElementById("navx2_mxpBtn").style.display = "none";
document.getElementById("navx2_mxpBtn2").style.display = "none";
document.getElementById("navx2_mxpBtn3").style.display = "none";

//Template:

//document.getElementById("").style.display = "none";

//--------------------------


const dashboardVisible = document.getElementById('deviceDashboard');
const uiTabVisible = document.getElementById('navuiTab');
const firmwareTabVisible = document.getElementById('firmwareTab');
const deviceTabVisible = document.getElementById('deviceTab');
const magTabVisible = document.getElementById('magTab');
const deviceInfoVisible = document.getElementById('deviceInfo');

dashboardVisible.classList.add('visible');

//=========================='CLICK' EVENT HANDLERS FOR FRONTEND================================ 

//Establish First Connection
_connection.send('first', info, result => {});

//---------------------------------Landing Page-----------------------------------------

//Event handler for 'Scan for Available Devices' button on landing page
document.getElementById('scanDeviceBtnContainer').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const scanDeviceBtn_ = elementClicked.getAttribute('scanDeviceBtn');
    if (scanDeviceBtn_ != null) {

        document.getElementById('scanDeviceBtn').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('scanDeviceBtn').disabled = true;

        getDeviceNames();

    }
      
});

//Event handler for DFU device selection pop-up
document.getElementById('DFUDeviceSelect').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const VMXDevice_ = elementClicked.getAttribute('VMXDevice');
    const MXPDevice_ = elementClicked.getAttribute('MXPDevice');
    const MicroDevice_ = elementClicked.getAttribute('MicroDevice');

    //Adding Device - 8: Add variable for new device
    //Template:
        //const [ID]_ = elementClicked.getAttribute('[ID]');
    //--------------------------

    if (VMXDevice_ != null){
        selected_device_name = "vmxpi";
        
        sendDFUInfo();
        dashboardVisible.classList.remove('visible');
        firmwareTabVisible.classList.add('visible');
        document.getElementById("firmwareTab").click();
        autoDFUPopup.classList.remove('visible');
    }

    if (MXPDevice_ != null){
        selected_device_name = "navx2_mxp";
        sendDFUInfo();
        dashboardVisible.classList.remove('visible');
        firmwareTabVisible.classList.add('visible');
        document.getElementById("firmwareTab").click();
        autoDFUPopup.classList.remove('visible');
    }
    
    if (MicroDevice_ != null){
        selected_device_name = "navx2micro";
        sendDFUInfo();
        dashboardVisible.classList.remove('visible');
        firmwareTabVisible.classList.add('visible');
        document.getElementById("firmwareTab").click();
        autoDFUPopup.classList.remove('visible');
    }

    //Adding Device - 9: Add event handler for new device button click

    //Template

    // if ([ID]_ != null){
    //     selected_device_name = "[deviceName]";
    //     sendDFUInfo();
    //     dashboardVisible.classList.remove('visible');
    //     firmwareTabVisible.classList.add('visible');
    //     document.getElementById("firmwareTab").click();
    //     autoDFUPopup.classList.remove('visible');
    // }

    //--------------------------

});

//Event handler for device select button(s) on landing page
document.getElementById('deviceBtns').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const VMXBtn_ = elementClicked.getAttribute('VMXBtn');
    const VMXBtn2_ = elementClicked.getAttribute('VMXBtn2');
    const VMXBtn3_ = elementClicked.getAttribute('VMXBtn3');

    const navx2_MicroBtn_ = elementClicked.getAttribute('navx2_MicroBtn');
    const navx2_MicroBtn2_ = elementClicked.getAttribute('navx2_MicroBtn2');
    const navx2_MicroBtn3_ = elementClicked.getAttribute('navx2_MicroBtn3');

    const navx2_mxpBtn_ = elementClicked.getAttribute('navx2_mxpBtn');
    const navx2_mxpBtn2_ = elementClicked.getAttribute('navx2_mxpBtn2');
    const navx2_mxpBtn3_ = elementClicked.getAttribute('navx2_mxpBtn3');

    //Adding Device - 10: Add variable for new device
    //Template:
        //const [ID]_ = elementClicked.getAttribute('[ID]');
    //-------------------------

    
    if (VMXBtn_ != null) {
        document.getElementById('VMXBtn').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('VMXBtn').disabled = true;
        getDeviceInfo(vmxpi_index);
        selected_device_index = vmxpi_index;
        selected_device_name = "vmxpi";
        getConfigValues("all");

    }
    else if (VMXBtn2_ != null) {
        document.getElementById('VMXBtn2').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('VMXBtn2').disabled = true;
        getDeviceInfo(vmxpi_index2);
        selected_device_index = vmxpi_index2;
        selected_device_name = "vmxpi";
        getConfigValues("all");

    }
    else if (VMXBtn3_ != null) {
        document.getElementById('VMXBtn3').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('VMXBtn3').disabled = true;
        getDeviceInfo(vmxpi_index3);
        selected_device_index = vmxpi_index3;
        selected_device_name = "vmxpi";
        getConfigValues("all");

    }
    else if (navx2_MicroBtn_ != null) {

        document.getElementById('navx2_MicroBtn').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_MicroBtn').disabled = true;
        getDeviceInfo(navxmicro_index);
        selected_device_index = navxmicro_index;
        selected_device_name = "navx2micro";
        getConfigValues("all");
    }
    else if (navx2_MicroBtn2_ != null) {

        document.getElementById('navx2_MicroBtn2').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_MicroBtn2').disabled = true;
        getDeviceInfo(navxmicro_index2);
        selected_device_index = navxmicro_index2;
        selected_device_name = "navx2micro";
        getConfigValues("all");
    }
    else if (navx2_MicroBtn3_ != null) {

        document.getElementById('navx2_MicroBtn3').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_MicroBtn3').disabled = true;
        getDeviceInfo(navxmicro_index3);
        selected_device_index = navxmicro_index3;
        selected_device_name = "navx2micro";
        getConfigValues("all");
    }
    else if (navx2_mxpBtn_ != null){
        document.getElementById('navx2_mxpBtn').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_mxpBtn').disabled = true;
        getDeviceInfo(navx2_mxp_index);
        selected_device_index = navx2_mxp_index;
        selected_device_name = "navx2_mxp";
        getConfigValues("all");
    }
    else if (navx2_mxpBtn2_ != null){
        document.getElementById('navx2_mxpBtn2').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_mxpBtn2').disabled = true;
        getDeviceInfo(navx2_mxp_index2);
        selected_device_index = navx2_mxp_index2;
        selected_device_name = "navx2_mxp";
        getConfigValues("all");
    }
    else if (navx2_mxpBtn3_ != null){
        document.getElementById('navx2_mxpBtn3').style.cursor = "wait";
        document.body.style.cursor = "wait";
        document.getElementById('navx2_mxpBtn3').disabled = true;
        getDeviceInfo(navx2_mxp_index3);
        selected_device_index = navx2_mxp_index3;
        selected_device_name = "navx2_mxp";
        getConfigValues("all");
    }

    //Adding Device - 11: Add event handler for device select buttons

    //Template:
    // else if ([ID]_ != null){
    //     document.getElementById('[ID]').style.cursor = "wait";
    //     document.body.style.cursor = "wait";
    //     document.getElementById('[ID]').disabled = true;
    //     getDeviceInfo([deviceName]_index);
    //     selected_device_index = [deviceName]_index;
    //     selected_device_name = "[deviceName]";
    //     getConfigValues("all");
    // }
    //---------------------------


});

//-----------------------------------Firmware Updater Page-------------------------------------

//Event handler for Firmware Updater Select Downloads Popup
const popupSelectDownloadsContainer = document.getElementById('selectDownloadsContainer');
const closePopupSelectContainer = document.getElementById('closeSelectContainerBtn');
closePopupSelectContainer.addEventListener('click', () => {
    popupSelectDownloadsContainer.classList.remove('visible');
});

//Event handler for firmware select button on firmware updater page
document.getElementById('loadFirmwareDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const loadFirmwareBtn_ = elementClicked.getAttribute('loadFirmwareBtn');
    const download1_ = elementClicked.getAttribute('download1');
    const download2_ = elementClicked.getAttribute('download2');
    const download3_ = elementClicked.getAttribute('download3');
    const download4_ = elementClicked.getAttribute('download4');
    const download5_ = elementClicked.getAttribute('download5');
    const download6_ = elementClicked.getAttribute('download6');
    const download7_ = elementClicked.getAttribute('download7');
    const download8_ = elementClicked.getAttribute('download8');
    const download9_ = elementClicked.getAttribute('download9');
    const download10_ = elementClicked.getAttribute('download10');
    const download11_ = elementClicked.getAttribute('download11');
    const download12_ = elementClicked.getAttribute('download12');
    const download13_ = elementClicked.getAttribute('download13');
    const download14_ = elementClicked.getAttribute('download14');

    //Adding Downloads - 3:

    //Template:
    //const download[#]_ = elementClicked.getAttribute('download[#]');
    //-------

    const deleteFileBtn_ = elementClicked.getAttribute('deleteFileBtn');
    const openFileExplorer_ = elementClicked.getAttribute('openFileExplorer');
    const loadManualFilesBtn_ = elementClicked.getAttribute('loadManualFilesBtn');

    if (loadFirmwareBtn_ != null){
        updateDownloadsList(emptyArray);
        getAvailableUpdates();
        fetchUpdateData();
    }
    if (loadManualFilesBtn_ != null){
        updateDownloadsList(emptyArray);
        getManualUpdateFiles();
    }
    if (download1_ != null) {
        getUpdateInfo(downloadsList[0]);
        selected_file = downloadsList[0];
    }
    if (download2_ != null) {
        getUpdateInfo(downloadsList[1]);
        selected_file = downloadsList[1];
    }
    if (download3_ != null) {
        getUpdateInfo(downloadsList[2]);
        selected_file = downloadsList[2];
    }
    if (download4_ != null) {
        getUpdateInfo(downloadsList[3]);
        selected_file = downloadsList[3];
    }
    if (download5_ != null) {
        getUpdateInfo(downloadsList[4]);
        selected_file = downloadsList[4];
    }
    if (download6_ != null) {
        getUpdateInfo(downloadsList[5]);
        selected_file = downloadsList[5];
    }
    if (download7_ != null) {
        getUpdateInfo(downloadsList[6]);
        selected_file = downloadsList[6];
    }
    if (download8_ != null) {
        getUpdateInfo(downloadsList[7]);
        selected_file = downloadsList[7];
    }
    if (download9_ != null) {
        getUpdateInfo(downloadsList[8]);
        selected_file = downloadsList[8];
    }
    if (download10_ != null) {
        getUpdateInfo(downloadsList[9]);
        selected_file = downloadsList[9];
    }
    if (download11_ != null) {
        getUpdateInfo(downloadsList[10]);
        selected_file = downloadsList[10];
    }
    if (download12_ != null) {
        getUpdateInfo(downloadsList[11]);
        selected_file = downloadsList[11];
    }
    if (download13_ != null) {
        getUpdateInfo(downloadsList[12]);
        selected_file = downloadsList[12];
    }
    if (download14_ != null) {
        getUpdateInfo(downloadsList[13]);
        selected_file = downloadsList[13];
    }
    
    //add new code above this line


    //Adding Downloads - 4:

    //Template:
    // if (download[#]_ != null) {
    //     getUpdateInfo(downloadsList[[# - 1]]);
    //     selected_file = downloadsList[[# - 1]];
    // }
    //--------

    if (deleteFileBtn_ != null) {
        deleteFile(selected_file);
        updateDownloadsList(emptyArray);
        getAvailableUpdates();
    }

    if (openFileExplorer_ != null){
        require('child_process').exec('start "" "C:\\Users\\Pranav\\Desktop\\Studica\\Git3\\Final APP\\Updates"'); //differs
    }
});

//Event handler for update button click on firmware updater page
document.getElementById('firmwareUpdateDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const firmwareUpdateBtn_ = elementClicked.getAttribute('firmwareUpdateBtn');

    if (firmwareUpdateBtn_ != null) {
        if (document.getElementById('manufactureText').innerHTML == "---"){
            Swal.fire({
                title: 'Error!',
                text: 'Select a download file first before attempting to install.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            })
        }
        else {
            updateDevice(selected_update_path);
        }
    }
});

//Event handler for firmware select button on firmware updater page new update pop-up
document.getElementById('selectDownloadsMain').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const newdownload1_ = elementClicked.getAttribute('newdownload1');
    const newdownload2_ = elementClicked.getAttribute('newdownload2');
    const newdownload3_ = elementClicked.getAttribute('newdownload3');
    const newdownload4_ = elementClicked.getAttribute('newdownload4');
    const newdownload5_ = elementClicked.getAttribute('newdownload5');
    const newdownload6_ = elementClicked.getAttribute('newdownload6');
    const newdownload7_ = elementClicked.getAttribute('newdownload7');
    const newdownload8_ = elementClicked.getAttribute('newdownload8');
    const newdownload9_ = elementClicked.getAttribute('newdownload9');
    const newdownload10_ = elementClicked.getAttribute('newdownload10');
    const newdownload11_ = elementClicked.getAttribute('newdownload11');
    const newdownload12_ = elementClicked.getAttribute('newdownload12');
    const newdownload13_ = elementClicked.getAttribute('newdownload13');
    const newdownload14_ = elementClicked.getAttribute('newdownload14');

    //Adding Downloads - 6:

    //Template:
    //const newdownload[#]_ = elementClicked.getAttribute('newdownload[#]');
    //-------


    if (newdownload1_ != null) {
        if (selected1 == false){
            selected1 = true;
            document.getElementById('newdownload1').style.background = "#3FB1E7";
            document.getElementById('newdownload1').style.color = "white";
            document.getElementById('newdownload1').style.padding = "5px";

        }
        else{
            selected1 = false;
            document.getElementById('newdownload1').style.background = "none";
            document.getElementById('newdownload1').style.color = "black";
            document.getElementById('newdownload1').style.padding = "5px";

        }
    }
    if (newdownload2_ != null) {
        if (selected2 == false){
            selected2 = true;
            document.getElementById('newdownload2').style.background = "#3FB1E7";
            document.getElementById('newdownload2').style.color = "white";
            document.getElementById('newdownload2').style.padding = "5px";

        }
        else{
            selected2 = false;
            document.getElementById('newdownload2').style.background = "none";
            document.getElementById('newdownload2').style.color = "black";
            document.getElementById('newdownload2').style.padding = "5px";

        }
    }
    if (newdownload3_ != null) {
        if (selected3 == false){
            selected3 = true;
            document.getElementById('newdownload3').style.background = "#3FB1E7";
            document.getElementById('newdownload3').style.color = "white";
            document.getElementById('newdownload3').style.padding = "5px";

        }
        else{
            selected3 = false;
            document.getElementById('newdownload3').style.background = "none";
            document.getElementById('newdownload3').style.color = "black";
            document.getElementById('newdownload3').style.padding = "5px";

        }
    }
    if (newdownload4_ != null) {
        if (selected4 == false){
            selected4 = true;
            document.getElementById('newdownload4').style.background = "#3FB1E7";
            document.getElementById('newdownload4').style.color = "white";
            document.getElementById('newdownload4').style.padding = "5px";

        }
        else{
            selected4 = false;
            document.getElementById('newdownload4').style.background = "none";
            document.getElementById('newdownload4').style.color = "black";
            document.getElementById('newdownload4').style.padding = "5px";

        }   
    }
    if (newdownload5_ != null) {
        if (selected5 == false){
            selected5 = true;
            document.getElementById('newdownload5').style.background = "#3FB1E7";
            document.getElementById('newdownload5').style.color = "white";
            document.getElementById('newdownload5').style.padding = "5px";

        }
        else{
            selected5 = false;
            document.getElementById('newdownload5').style.background = "none";
            document.getElementById('newdownload5').style.color = "black";
            document.getElementById('newdownload5').style.padding = "5px";

        }
    }
    if (newdownload6_ != null) {
        if (selected6 == false){
            selected6 = true;
            document.getElementById('newdownload6').style.background = "#3FB1E7";
            document.getElementById('newdownload6').style.color = "white";
            document.getElementById('newdownload6').style.padding = "5px";

        }
        else{
            selected6 = false;
            document.getElementById('newdownload6').style.background = "none";
            document.getElementById('newdownload6').style.color = "black";
            document.getElementById('newdownload6').style.padding = "5px";

        }
    }
    if (newdownload7_ != null) {
        if (selected7 == false){
            selected7 = true;
            document.getElementById('newdownload7').style.background = "#3FB1E7";
            document.getElementById('newdownload7').style.color = "white";
            document.getElementById('newdownload7').style.padding = "5px";

        }
        else{
            selected7 = false;
            document.getElementById('newdownload7').style.background = "none";
            document.getElementById('newdownload7').style.color = "black";
            document.getElementById('newdownload7').style.padding = "5px";

        }
    }
    if (newdownload8_ != null) {
        if (selected8 == false){
            selected8 = true;
            document.getElementById('newdownload8').style.background = "#3FB1E7";
            document.getElementById('newdownload8').style.color = "white";
            document.getElementById('newdownload8').style.padding = "5px";

        }
        else{
            selected8 = false;
            document.getElementById('newdownload8').style.background = "none";
            document.getElementById('newdownload8').style.color = "black";
            document.getElementById('newdownload8').style.padding = "5px";

        }
    }
    if (newdownload9_ != null) {
        if (selected9 == false){
            selected9 = true;
            document.getElementById('newdownload9').style.background = "#3FB1E7";
            document.getElementById('newdownload9').style.color = "white";
            document.getElementById('newdownload9').style.padding = "5px";

        }
        else{
            selected9 = false;
            document.getElementById('newdownload9').style.background = "none";
            document.getElementById('newdownload9').style.color = "black";
            document.getElementById('newdownload9').style.padding = "5px";

        }
    }
    if (newdownload10_ != null) {
        if (selected10 == false){
            selected10 = true;
            document.getElementById('newdownload10').style.background = "#3FB1E7";
            document.getElementById('newdownload10').style.color = "white";
            document.getElementById('newdownload10').style.padding = "5px";

        }
        else{
            selected10 = false;
            document.getElementById('newdownload10').style.background = "none";
            document.getElementById('newdownload10').style.color = "black";
            document.getElementById('newdownload10').style.padding = "5px";

        }
    }
    if (newdownload11_ != null) {
        if (selected11 == false){
            selected11 = true;
            document.getElementById('newdownload11').style.background = "#3FB1E7";
            document.getElementById('newdownload11').style.color = "white";
            document.getElementById('newdownload11').style.padding = "5px";

        }
        else{
            selected11 = false;
            document.getElementById('newdownload11').style.background = "none";
            document.getElementById('newdownload11').style.color = "black";
            document.getElementById('newdownload11').style.padding = "5px";

        }
    }
    if (newdownload12_ != null) {
        if (selected12 == false){
            selected12 = true;
            document.getElementById('newdownload12').style.background = "#3FB1E7";
            document.getElementById('newdownload12').style.color = "white";
            document.getElementById('newdownload12').style.padding = "5px";

        }
        else{
            selected12 = false;
            document.getElementById('newdownload12').style.background = "none";
            document.getElementById('newdownload12').style.color = "black";
            document.getElementById('newdownload12').style.padding = "5px";

        }
    }
    if (newdownload13_ != null) {
        if (selected13 == false){
            selected13 = true;
            document.getElementById('newdownload13').style.background = "#3FB1E7";
            document.getElementById('newdownload13').style.color = "white";
            document.getElementById('newdownload13').style.padding = "5px";

        }
        else{
            selected13 = false;
            document.getElementById('newdownload13').style.background = "none";
            document.getElementById('newdownload13').style.color = "black";
            document.getElementById('newdownload13').style.padding = "5px";

        }
    }
    if (newdownload14_ != null) {
        if (selected14 == false){
            selected14 = true;
            document.getElementById('newdownload14').style.background = "#3FB1E7";
            document.getElementById('newdownload14').style.color = "white";
            document.getElementById('newdownload14').style.padding = "5px";

        }
        else{
            selected14 = false;
            document.getElementById('newdownload14').style.background = "none";
            document.getElementById('newdownload14').style.color = "black";
            document.getElementById('newdownload14').style.padding = "5px";

        }
    }

    //add new code above this line

    //Adding Downloads - 7:

    //Template:
    // if (newdownload[#]_ != null) {
    //     if (selected[#] == false){
    //         selected[#] = true;
    //         document.getElementById('newdownload[#]').style.background = "#3FB1E7";
    //         document.getElementById('newdownload[#]').style.color = "white";
    //         document.getElementById('newdownload[#]').style.padding = "5px";

    //     }
    //     else{
    //         selected[#] = false;
    //         document.getElementById('newdownload[#]').style.background = "none";
    //         document.getElementById('newdownload[#]').style.color = "black";
    //         document.getElementById('newdownload[#]').style.padding = "5px";

    //     }
    // }
    //--------

});

document.getElementById('downloadUpdatepopup').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const popupdownloadBtn_ = elementClicked.getAttribute('popupdownloadBtn');

    if (popupdownloadBtn_ != null){
        
        downloadUpdate();
    }
});

//------------------------------Device Configuration Page--------------------------------------

//Event handlers for button clicks on cards in device configuration page:
//Linear Motion Card
document.getElementById('linearMotionDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const linearMotionSetBtn_ = elementClicked.getAttribute('linearMotionSetBtn');
    const linearMotionResetBtn_ = elementClicked.getAttribute('linearMotionResetBtn');

    if (linearMotionSetBtn_ != null) {
        value = document.getElementById("LinearInput").value;
        configAction("linearmotion", value);
    }
    if (linearMotionResetBtn_ != null) {
        configReset("linearmotionReset");
    }

});
//Rotation Card
document.getElementById('rotationDiv').addEventListener('click', function (a){
    const elementClicked = a.target;
    const rotationSetBtn_ = elementClicked.getAttribute('rotationSetBtn');
    const rotationResetBtn_ = elementClicked.getAttribute('rotationResetBtn');

    if (rotationSetBtn_ != null){
        value = document.getElementById("RotationInput").value;
        configAction("rotation", value);
    }
    if (rotationResetBtn_ != null){
        configReset("rotationReset");
    }
});
//Magnetic Disturbance Card
document.getElementById('magDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const magSetBtn_ = elementClicked.getAttribute('magSetBtn');
    const magResetBtn_ = elementClicked.getAttribute('magResetBtn');

    if (magSetBtn_ != null){
        value = document.getElementById("MagInput").value;
        configAction("magneticdisturbance", value);
    }
    if (magResetBtn_ != null){
        configReset("magneticdisturbanceReset");
    }
});
//Gyro Range Card
document.getElementById('gyroDiv').addEventListener('click', function (a){
    const elementClicked = a.target;
    const gyroSetBtn_ = elementClicked.getAttribute('gyroSetBtn');
    const gyroResetBtn_ = elementClicked.getAttribute('gyroResetBtn');

    if (gyroSetBtn_ != null){
        value = document.getElementById("GyroInput").value;
        if (value % 125 == 0 || value == 0){
            configAction("gyrorange", value);
        }
        else{
            Swal.fire({
                title: 'Incorrect Value!',
                text: 'Make sure to enter a value that is an even multiple of 125.',
                icon: 'error',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }
        
    }
    if (gyroResetBtn_ != null){
        configReset("gyrorangeReset");
    }
});
//Acceleration Range Card
document.getElementById('accelDiv').addEventListener('click', function (a){
    const elementClicked = a.target;
    const accelSetBtn_ = elementClicked.getAttribute('accelSetBtn');
    const accelResetBtn_ = elementClicked.getAttribute('accelResetBtn');

    if (accelSetBtn_ != null){
        value = document.getElementById("AccelInput").value;
        if (value % 2 == 0 || value == 0){
            configAction("accelrange", value);
        }
        else{
            Swal.fire({
                title: 'Incorrect Value!',
                text: 'Make sure to enter a value that is an even multiple of 2.',
                icon: 'error',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }
    }
    if (accelResetBtn_ != null){
        configReset("accelrangeReset");
    }
});
//Max Gyro Error Card
document.getElementById('maxDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const maxSetBtn_ = elementClicked.getAttribute('maxSetBtn');
    const maxResetBtn_ = elementClicked.getAttribute('maxResetBtn');

    if (maxSetBtn_ != null) {
        value = document.getElementById("MaxGyroInput").value;
        configAction("maxgyrorange", value);
    }
    if (maxResetBtn_ != null) {
        configReset("maxgyrorangeReset")
    }
});

//Accelerometer - Start Calibration
document.getElementById('startCal').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const beginCalibrationBtn_ = elementClicked.getAttribute('beginCalibrationBtn');

    if (beginCalibrationBtn_ != null) {
        startAccelCalibration();
        CalibrationStatus();

    }
});

//Accelerometer - Cancel Calibration
document.getElementById('cancelDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const cancelCalibrationBtn_ = elementClicked.getAttribute('cancelCalibrationBtn');

    if (cancelCalibrationBtn_ != null) {
        stopAccelCalibration();
    }
});

//Sensor Fusion - Main Page - Start/Stop handling
document.getElementById('fusionCalculationSectionMain').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const startButtonFusionPageOne_ = elementClicked.getAttribute('startButtonFusionPageOne');
    const stopButtonFusionPageOne_ = elementClicked.getAttribute('stopButtonFusionPageOne');
    const resetYaw_ = elementClicked.getAttribute('resetYaw');

    if (startButtonFusionPageOne_ != null){
        startSensorFusionCal();
    }

    if (stopButtonFusionPageOne_ != null){
        stopSensorFusionCal();
    }

    if (resetYaw_ != null){
        resetYaw();
    }
});

//Sensor Fusion - Step One - +90
document.getElementById('saveValuesOneContainerPlus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepone_plus90_ = elementClicked.getAttribute('savestepone_plus90');
    
    if (savestepone_plus90_ != null) {
        plus90values[0] = yawval;
        document.getElementById('stepone_plus90').value = plus90values[0];   
    }

});

//Sensor Fusion - Step One - -90
document.getElementById('saveValuesOneContainerMinus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepone_minus90_ = elementClicked.getAttribute('savestepone_minus90');
    
    if (savestepone_minus90_ != null) {
        minus90values[0] = yawval;
        document.getElementById('stepone_minus90').value = minus90values[0];   
    }

});

//Sensor Fusion - Step Two - +90
document.getElementById('saveValuesTwoContainerPlus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savesteptwo_plus90_ = elementClicked.getAttribute('savesteptwo_plus90');
    
    if (savesteptwo_plus90_ != null) {
        plus90values[1] = yawval;
        document.getElementById('steptwo_plus90').value = plus90values[1];   
    }

});

//Sensor Fusion - Step Two - -90
document.getElementById('saveValuesTwoContainerMinus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savesteptwo_minus90_ = elementClicked.getAttribute('savesteptwo_minus90');
    
    if (savesteptwo_minus90_ != null) {
        minus90values[1] = yawval;
        document.getElementById('steptwo_minus90').value = minus90values[1];   
    }

});

//Sensor Fusion - Step Three - +90
document.getElementById('saveValuesThreeContainerPlus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepthree_plus90_ = elementClicked.getAttribute('savestepthree_plus90');
    
    if (savestepthree_plus90_ != null) {
        plus90values[2] = yawval;
        document.getElementById('stepthree_plus90').value = plus90values[2];   
    }

});

//Sensor Fusion - Step Three - -90
document.getElementById('saveValuesThreeContainerMinus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepthree_minus90_ = elementClicked.getAttribute('savestepthree_minus90');
    
    if (savestepthree_minus90_ != null) {
        minus90values[2] = yawval;
        document.getElementById('stepthree_minus90').value = minus90values[2];   
    }

});

//Sensor Fusion - Step Four - +90
document.getElementById('saveValuesFourContainerPlus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepfour_plus90_ = elementClicked.getAttribute('savestepfour_plus90');
    
    if (savestepfour_plus90_ != null) {
        plus90values[3] = yawval;
        document.getElementById('stepfour_plus90').value = plus90values[3];   
    }

});

//Sensor Fusion - Step Four - -90
document.getElementById('saveValuesFourContainerMinus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepfour_minus90_ = elementClicked.getAttribute('savestepfour_minus90');
    
    if (savestepfour_minus90_ != null) {
        minus90values[3] = yawval;
        document.getElementById('stepfour_minus90').value = minus90values[3];   
    }

});

//Sensor Fusion - Step Five - +90
document.getElementById('saveValuesFiveContainerPlus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepfive_plus90_ = elementClicked.getAttribute('savestepfive_plus90');
    
    if (savestepfive_plus90_ != null) {
        plus90values[4] = yawval;
        document.getElementById('stepfive_plus90').value = plus90values[4];   
    }

});

//Sensor Fusion - Step Five - -90
document.getElementById('saveValuesFiveContainerMinus').addEventListener('click', function (a){
    const elementClicked = a.target;
    const savestepfive_minus90_ = elementClicked.getAttribute('savestepfive_minus90');
    
    if (savestepfive_minus90_ != null) {
        minus90values[4] = yawval;
        document.getElementById('stepfive_minus90').value = minus90values[4];   
    }

});

//Sensor Fusion - Calculate Gyro Scale Factor
document.getElementById('ratioCalculationSection').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const calculateBtn_ = elementClicked.getAttribute('calculateBtn');

    if (calculateBtn_ != null){
        sendFusionData();
        calculateMean();

    }
})

//Sensor Fusion - Next Button 1 (Reset Yaw)
document.getElementById('nextBtn1').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const open_fusion_popupTwo_ = elementClicked.getAttribute('open-fusion-popupTwo');
    const rightIcon_ = elementClicked.getAttribute('rightIcon');

    if (open_fusion_popupTwo_ != null){
        resetYaw();
    }
    if (rightIcon_ != null){
        resetYaw();
    }
});

//Sensor Fusion - Next Button 2 (Reset Yaw)
document.getElementById('nextBtn2').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const open_fusion_popupThree_ = elementClicked.getAttribute('open-fusion-popupThree');
    const rightIcon2_ = elementClicked.getAttribute('rightIcon2');

    if (open_fusion_popupThree_ != null){
        resetYaw();
    }
    if (rightIcon2_ != null){
        resetYaw();
    }
});

//Sensor Fusion - Next Button 3 (Reset Yaw)
document.getElementById('nextBtn3').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const open_fusion_popupFour_ = elementClicked.getAttribute('open-fusion-popupFour');
    const rightIcon3_ = elementClicked.getAttribute('rightIcon3');

    if (open_fusion_popupFour_ != null){
        resetYaw();
    }
    if (rightIcon3_ != null){
        resetYaw();
    }
});

//Sensor Fusion - Next Button 4 (Reset Yaw)
document.getElementById('nextBtn4').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const open_fusion_popupFive_ = elementClicked.getAttribute('open-fusion-popupFive');
    const rightIcon4_ = elementClicked.getAttribute('rightIcon4');

    if (open_fusion_popupFive_ != null){
        resetYaw();
    }
    if (rightIcon4_ != null){
        resetYaw();
    }
});

//Event handler for keyboard shortcut to start recording sensor fusion data to an excel file
//Shortcut: CTRL+SHIFT+E
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'E') {
      _connection.send('exportdata', info, result => {
          if (started == false){
              alert("Excel file created on Desktop. Sensor Fusion data recording is active.");
              started = true;
          }
          else if (started == true){
              alert("Sensor Fusion data recording stopped. Recorded data is saved to the file located in the Desktop folder.");
              started = false;
          }
      });
    }
  });
  


//-----------------------------------MagCal Page----------------------------------------------

//Event handlers for 'Save' button to get, display, and store X Y Z axes data
//X+0
document.getElementById('xplus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const xplus0SaveBtn_ = elementClicked.getAttribute('xplus0SaveBtn');
    const xplus0GetBtn_ = elementClicked.getAttribute('xplus0GetBtn');

    if (xplus0GetBtn_ != null){
        MagCal("xplus0");
    }

    if (xplus0SaveBtn_ != null){
        SaveMagCal("xplus0");
    }
});

//X+180
document.getElementById('xplus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const xplus180SaveBtn_ = elementClicked.getAttribute('xplus180SaveBtn');
    const xplus180GetBtn_ = elementClicked.getAttribute('xplus180GetBtn');

    if (xplus180GetBtn_ != null){
        MagCal("xplus180");
    }

    if (xplus180SaveBtn_ != null){
        SaveMagCal("xplus180");
    }
});

//X-0
document.getElementById('xminus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const xminus0SaveBtn_ = elementClicked.getAttribute('xminus0SaveBtn');
    const xminus0GetBtn_ = elementClicked.getAttribute('xminus0GetBtn');

    if (xminus0GetBtn_ != null){
        MagCal("xminus0");
    }
    
    if (xminus0SaveBtn_ != null){
        SaveMagCal("xminus0");
    }
});

//X-180
document.getElementById('xminus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const xminus180SaveBtn_ = elementClicked.getAttribute('xminus180SaveBtn');
    const xminus180GetBtn_ = elementClicked.getAttribute('xminus180GetBtn');

    if (xminus180GetBtn_ != null){
        MagCal("xminus180");
    }
    if (xminus180SaveBtn_ != null){
        SaveMagCal("xminus180");
    }
});

//Y+0
document.getElementById('yplus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const yplus0SaveBtn_ = elementClicked.getAttribute('yplus0SaveBtn');
    const yplus0GetBtn_ = elementClicked.getAttribute('yplus0GetBtn');

    if (yplus0GetBtn_ != null){
        MagCal("yplus0");
    }
    if (yplus0SaveBtn_ != null){
        SaveMagCal("yplus0");
    }
});

//Y+180
document.getElementById('yplus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const yplus180SaveBtn_ = elementClicked.getAttribute('yplus180SaveBtn');
    const yplus180GetBtn_ = elementClicked.getAttribute('yplus180GetBtn');

    if (yplus180GetBtn_ != null){
        MagCal("yplus180");
    }
    if (yplus180SaveBtn_ != null){
        SaveMagCal("yplus180");
    }
});

//Y-0
document.getElementById('yminus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const yminus0SaveBtn_ = elementClicked.getAttribute('yminus0SaveBtn');
    const yminus0GetBtn_ = elementClicked.getAttribute('yminus0GetBtn');

    if (yminus0GetBtn_ != null){
        MagCal("yminus0");
    }
    if (yminus0SaveBtn_ != null){
        SaveMagCal("yminus0");
    }
});

//Y-180
document.getElementById('yminus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const yminus180SaveBtn_ = elementClicked.getAttribute('yminus180SaveBtn');
    const yminus180GetBtn_ = elementClicked.getAttribute('yminus180GetBtn');

    if (yminus180GetBtn_ != null){
        MagCal("yminus180");
    }
    if (yminus180SaveBtn_ != null){
        SaveMagCal("yminus180");
    }
});

//Z+0
document.getElementById('zplus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const zplus0SaveBtn_ = elementClicked.getAttribute('zplus0SaveBtn');
    const zplus0GetBtn_ = elementClicked.getAttribute('zplus0GetBtn');

    if (zplus0GetBtn_ != null){
        MagCal("zplus0");
    }
    if (zplus0SaveBtn_ != null){
        SaveMagCal("zplus0");
    }
});

//Z+180
document.getElementById('zplus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const zplus180SaveBtn_ = elementClicked.getAttribute('zplus180SaveBtn');
    const zplus180GetBtn_ = elementClicked.getAttribute('zplus180GetBtn');

    if (zplus180GetBtn_ != null){
        MagCal("zplus180");
    }
    if (zplus180SaveBtn_ != null){
        SaveMagCal("zplus180");
    }
});

//Z-0
document.getElementById('zminus0Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const zminus0SaveBtn_ = elementClicked.getAttribute('zminus0SaveBtn');
    const zminus0GetBtn_ = elementClicked.getAttribute('zminus0GetBtn');

    if (zminus0GetBtn_ != null){
        MagCal("zminus0");
    }
    if (zminus0SaveBtn_ != null){
        SaveMagCal("zminus0");
    }
});

//Z-180
document.getElementById('zminus180Div').addEventListener('click', function (a){
    const elementClicked = a.target;
    const zminus180SaveBtn_ = elementClicked.getAttribute('zminus180SaveBtn');
    const zminus180GetBtn_ = elementClicked.getAttribute('zminus180GetBtn');

    if (zminus180GetBtn_ != null){
        MagCal("zminus180");
    }
    if (zminus180SaveBtn_ != null){
        SaveMagCal("zminus180");
    }
});

//Calculate Matrix Button - MagCal
document.getElementById('calculatematrixDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const calculateSaveBtn_ = elementClicked.getAttribute('calculateSaveBtn');

    if (calculateSaveBtn_ != null){
        calculateMatrix();
    }
});

//Event handler for 'Save to Device' and 'Retrieve from Device' buttons on MagCal page
document.getElementById('saveDiv').addEventListener('click', function (a) {
    const elementClicked = a.target;
    const saveBtn_ = elementClicked.getAttribute('saveBtn');
    const retrieveBtn_ = elementClicked.getAttribute('retrieveBtn');

    if (saveBtn_ != null) {
        SaveValues();
    }
    if (retrieveBtn_ != null){
        RetrieveValues();
    }
});

//=========================FUNCTIONS TO SEND REQUESTS TO BACKEND (C#)=============================

//----------------------------------------Landing Page------------------------------------------

//Function to obtain connected device info from backend
function getDeviceNames() {
    _connection.send('name', info, names => {
        enableButtons(names);

        if (dfu_device_present){

            Swal.fire({
                title: 'Device in DFU Mode Detected!',
                text: 'Would you like to proceed directly to the firmware updater?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Yes',
                confirmButtonColor: '#163972',
                denyButtonText: 'No',
                denyButtonColor: '#818d9c',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111',
                customClass: {
                    actions: 'my-actions',
                    confirmButton: 'order-1',
                    denyButton: 'order-2',
                },
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            }).then((result) => {
                if (result.isConfirmed) {

                    autoDFUPopup.classList.add('visible');
        
                } else if (result.isDenied) {

                    Swal.fire({
                        title: '',
                        text: 'Please re-connect your device in normal mode to access configuration options. This can be achieved by disconnecting your device and re-connecting it while not holding onto any buttons.',
                        icon: 'info',
                        confirmButtonText: 'Continue',
                        confirmButtonColor: '#163972',
                        background: toggleSwitch.checked ? '#111' : '#FFF',
                        color: toggleSwitch.checked ? '#FFF' : '#111'
                    });

                    if (names.length > ports.length){ //to resolve issue where sometimes program detects several devices connected when there is only one device connected
                        enableButtons(emptyArray);
                        getDeviceNames();
                    }
                    else{
                        if (names.length == 0) {

                            document.getElementById('scanDeviceBtn').style.cursor = "pointer";
                            document.getElementById('scanDeviceBtn').disabled = false;
                            document.body.style.cursor = "auto";
                        }
                
                        if (names.length == 1) {
                            document.getElementById('numDevicesConnected').innerHTML = "1 device connected";
                        }
                        else {
                            document.getElementById('numDevicesConnected').innerHTML = names.length + " devices connected";
                        }
                    }
                }
            });

            dfu_device_present = false;
        }
        else{
            if (names.length > ports.length){ //to resolve issue where sometimes program detects several devices connected when there is only one device connected
                enableButtons(emptyArray);
                getDeviceNames();
            }
            else{
                if (names.length == 0) {
                    Swal.fire({
                        title: 'No devices detected!',
                        text: 'Connect a navx device to your computer. If the error persists, try reconnecting the device.',
                        icon: 'error',
                        confirmButtonText: 'Continue',
                        confirmButtonColor: '#163972',
                        background: toggleSwitch.checked ? '#111' : '#FFF',
                        color: toggleSwitch.checked ? '#FFF' : '#111'
                    });
                    document.getElementById('scanDeviceBtn').style.cursor = "pointer";
                    document.getElementById('scanDeviceBtn').disabled = false;
                    document.body.style.cursor = "auto";
                }
        
                if (names.length == 1) {
                    document.getElementById('numDevicesConnected').innerHTML = "1 device connected";
                }
                else {
                    document.getElementById('numDevicesConnected').innerHTML = names.length + " devices connected";
                }
            } 
        }

    });
}

//Function to obtain board information from backend
function getDeviceInfo(index) {
    _connection.send('info', index, result => {
        updateInfoSection(result);
        
        if (result[0] != ""){
            if (selected_device_name == "vmxpi"){
                uiTabVisible.classList.add('visible');
                firmwareTabVisible.classList.add('visible');
                deviceTabVisible.classList.add('visible');
                magTabVisible.classList.add('visible');
                deviceInfoVisible.classList.add('visible');

                document.getElementById('VMXBtn').style.cursor = "pointer";
                document.body.style.cursor = "auto";
                document.getElementById('VMXBtn').disabled = false;

            }
            else if (selected_device_name == "navx2_mxp"){
                uiTabVisible.classList.add('visible');
                firmwareTabVisible.classList.add('visible');
                deviceTabVisible.classList.add('visible');
                magTabVisible.classList.add('visible');
                deviceInfoVisible.classList.add('visible');

                document.getElementById('navx2_mxpBtn').style.cursor = "pointer";
                document.body.style.cursor = "auto";
                document.getElementById('navx2_mxpBtn').disabled = false;
            }
            else if (selected_device_name == "navx2micro"){
                uiTabVisible.classList.add('visible');
                firmwareTabVisible.classList.add('visible');
                deviceTabVisible.classList.add('visible');
                magTabVisible.classList.add('visible');
                deviceInfoVisible.classList.add('visible');

                document.getElementById('navx2_MicroBtn').style.cursor = "pointer";
                document.body.style.cursor = "auto";
                document.getElementById('navx2_MicroBtn').disabled = false;
            }
            //replace this line with new code to add
            
            
            //Adding Device - 12: Add event handler for device selection:

            //Template
            // else if (selected_device_name == "[deviceName]"){
            //     uiTabVisible.classList.add('visible');
            //     firmwareTabVisible.classList.add('visible');
            //     deviceTabVisible.classList.add('visible');
            //     magTabVisible.classList.add('visible');
            //     deviceInfoVisible.classList.add('visible');

            //     document.getElementById('[ID]').style.cursor = "pointer";
            //     document.body.style.cursor = "auto";
            //     document.getElementById('[ID]').disabled = false;
            // }
            //--------------------------

        }

        dashboardVisible.classList.remove('visible');
        document.getElementById("navuiTab").click();

        //Tour for the ui Tab inserted here
        if (tourEnabled && tour.getCurrentStep()) {
            const tour = new Shepherd.Tour({
                defaultStepOptions: {
                    cancelIcon: {
                      enabled: true
                    },
                    classes: 'sheppard-theme-arrows'
                  },
              steps: [
                {
                  id: 'welcome',
                  title: 'Welcome to NavX Ui Application Tab',
                  text: `Here you can access the live real-time values from your device and use for calibration.`,
                  attachTo: {
                    element: '.start-button',
                    on: 'right'
                  },
                  buttons: [
                    {
                      action() {
                        return this.back();
                      },
                      classes: 'shepherd-button-secondary',
                      text: 'Back'
                    },
                    {
                      action() {
                        return this.next();
                      },
                      text: 'Next'
                    }
                  ],
                  // Hide the default overlay
                  showOverlay: false
                },
                {
                  id: '3d-rendering',
                  title: 'NavX Ui 3d Object Rendering',
                  text: `Pick up your device to see the values change`,
                  attachTo: {
                    element: '.uiMiddle',
                    on: 'bottom'
                  },
                  buttons: [
                    {
                      action() {
                        return this.back();
                      },
                      classes: 'shepherd-button-secondary',
                      text: 'Back'
                    },
                    {
                      action() {
                        return this.next();
                      },
                      text: 'Next'
                    }
                  ],
                  // Hide the default overlay
                  showOverlay: false
                },
                {
                  id: 'live-values',
                  title: 'NavX Ui Live Values',
                  text: `Here you can access the current time yaw, pitch, and roll values`,
                  attachTo: {
                    element: '.liveYawContainer',
                    on: 'left'
                  },
                  buttons: [
                    {
                      action() {
                        return this.back();
                      },
                      classes: 'shepherd-button-secondary',
                      text: 'Back'
                    },
                    {
                      action() {
                        return this.complete();
                      },
                      text: 'Finish'
                    }
                  ],
                  // Hide the default overlay
                  showOverlay: false
                }
              ],
            });
          
            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
              document.body.classList.add('shepherd-dark-background');
            });
          
            // Remove the dark background class from the body element when the tour is hidden
            tour.on('complete', function() {
              document.body.classList.remove('shepherd-dark-background');
            });
            tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
          
            // Start the tour automatically
            tour.start();
          }
          
    });
}

//------------------------------------FIRMWARE UPDATER----------------------------------------

//Function to parse imported JSON data
function JSON_Check(json) {
    
    const JSONdata = JSON.stringify(json);
    const data = JSON.parse(JSONdata);
    
    console.log(data);
    if (selected_device_name == "navx2_mxp"){
        versions = [data.navx2_mxp.length];

        for(let i = 0; i < data.navx2_mxp.length; i++){
            versions[i] = data.navx2_mxp[i].version;
        }
    }
    else if (selected_device_name == "navx2micro"){
        versions = [data.navx2_micro.length];

        for(let i = 0; i < data.navx2_micro.length; i++){
            versions[i] = data.navx2_micro[i].version;
        }
    }
    else if (selected_device_name == "vmxpi"){
        versions = [data.vmx.length];

        for(let i = 0; i < data.vmx.length; i++){
            versions[i] = data.vmx[i].version;
        }
    }
    //replace this line with new code to add

    //Adding Device - 13: Parse through CDN JSON data for new device

    //Template:
    // else if (selected_device_name == "[deviceName]"){
    //     versions = [data.[deviceName (as on CDN)].length];
    //     for(let i = 0; i < data.[deviceName (as on CDN)].length; i++){
    //         versions[i] = data.[deviceName (as on CDN)][i].version;
    //     }
    // }
    //------------

    update_info = data;
    checkUpdate(versions);
}

//Function to check for new updates on CDN server
function checkUpdate(info) {
    _connection.send('newUpdates', info, result => {

        if (result == "false") {

            Swal.fire({
                title: 'New Downloads Available!',
                text: 'There are new updates available. Do you want to download the latest update for your device?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Yes',
                confirmButtonColor: '#163972',
                denyButtonText: 'No',
                denyButtonColor: '#818d9c',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111',
                customClass: {
                    actions: 'my-actions',
                    confirmButton: 'order-1',
                    denyButton: 'order-2',
                },
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            }).then((result) => {
                if (result.isConfirmed) {
                    
                    if (newDownloadsList.length > 1){
                        for (let i = 0; i < newDownloadsList.length; i++){
 
                            var download = "newdownload";
                            download += (i + 1);
                            document.getElementById(download).innerHTML = '<i class="fa-solid fa-file-arrow-down"></i>' + ' ' + newDownloadsList[i];
                        }
                        popupSelectDownloadsContainer.classList.add('visible');
                    }
                    else{
                        downloadUpdate();
                    }

                } else if (result.isDenied) {
                }
            });

        }

    });
}

//Function to download the new update(s) from C.D.N. server
function downloadUpdate() {

    Swal.fire({
        title: 'Downloading New Updates',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });
    
    if (newDownloadsList.length == 1){

        if (selected_device_name == "navx2_mxp"){
            for (let i = 0; i < versions.length; i++){
                if (newDownloadsList[0] == versions[i]){
                    download_url = update_info.navx2_mxp[i].url;
                    const download = require('download');
                    const file = download_url;
                    let filePath = "";
                    filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                    download(file, filePath);
                    
                }
            }
        }
        else if (selected_device_name == "vmxpi"){
            for (let i = 0; i < versions.length; i++){
                if (newDownloadsList[0] == versions[i]){
                    download_url = update_info.vmx[i].url;
                    const download = require('download');
                    const file = download_url;
                    let filePath = "";
                    filePath = `${__dirname}/Updates/vmx`; //Directory
                    download(file, filePath);
                }
            }
        }
        else if (selected_device_name == "navx2micro"){
            for (let i = 0; i < versions.length; i++){
                if (newDownloadsList[0] == versions[i]){
                    download_url = update_info.navx2_micro[i].url;
                    const download = require('download');
                    const file = download_url;
                    let filePath = "";
                    filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                    download(file, filePath);
                }
            }
        }
        //replace this line with new code

        //Adding Device - 14

        //Template:
        // else if (selected_device_name == "[deviceName]"){
        //     for (let i = 0; i < versions.length; i++){
        //         if (newDownloadsList[0] == versions[i]){
        //             download_url = update_info.[deviceName (as on CDN)][i].url;
        //             const download = require('download');
        //             const file = download_url;
        //             let filePath = "";
        //             filePath = `${__dirname}/Updates/[folder]`; //Directory
        //             download(file, filePath);
        //         }
        //     }
        // }
        //--------
    }
    else{
        if (selected_device_name == "navx2_mxp") {

            //5 is current max for number of downloads listed
    
            if (selected1 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[0] == versions[i]){
                        download_url = update_info.navx2_mxp[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                        download(file, filePath);
                    }
                }
            }
    
            if (selected2 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[1] == versions[i]){
                        download_url = update_info.navx2_mxp[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                        download(file, filePath);
                    }
                }
            }
            
            if (selected3 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[2] == versions[i]){
                        download_url = update_info.navx2_mxp[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected4 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[3] == versions[i]){
                        download_url = update_info.navx2_mxp[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected5 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[4] == versions[i]){
                        download_url = update_info.navx2_mxp[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-mxp`; //Directory
                        download(file, filePath);
                    }
                }
            }
        }

        else if (selected_device_name == "vmxpi") { 
            if (selected1 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[0] == versions[i]){
                        download_url = update_info.vmx[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/vmx`; //Directory
                        try{
                            download(file, filePath);
                        }
                        catch(e){
                            console.log("erorrr");
                        }
                    }
                }
            }
    
            if (selected2 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[1] == versions[i]){
                        download_url = update_info.vmx[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/vmx`; //Directory
                        try{
                            download(file, filePath);
                        }
                        catch(error){
                            console.log("erorrr");
                        }
                    }
                }
            }

            if (selected3 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[2] == versions[i]){
                        download_url = update_info.vmx[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/vmx`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected4 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[3] == versions[i]){
                        download_url = update_info.vmx[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/vmx`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected5 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[4] == versions[i]){
                        download_url = update_info.vmx[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/vmx`; //Directory
                        download(file, filePath);
                    }
                }
            }

        }

        else if (selected_device_name == "navx2micro") {
            if (selected1 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[0] == versions[i]){
                        download_url = update_info.navx2_micro[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                        download(file, filePath);
                    }
                }
            }
    
            if (selected2 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[1] == versions[i]){
                        download_url = update_info.navx2_micro[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected3 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[2] == versions[i]){
                        download_url = update_info.navx2_micro[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected4 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[3] == versions[i]){
                        download_url = update_info.navx2_micro[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                        download(file, filePath);
                    }
                }
            }

            if (selected5 == true){
                for (let i = 0; i < versions.length; i++){
                    if (newDownloadsList[4] == versions[i]){
                        download_url = update_info.navx2_micro[i].url;
                        const download = require('download');
                        const file = download_url;
                        let filePath = "";
                        filePath = `${__dirname}/Updates/navx2-micro`; //Directory
                        download(file, filePath);
                    }
                }
            }
        }
        //add code above this line

        //Adding Device - 15:

        //Template:
        // else if (selected_device_name == "[deviceName]") {
        //     if (selected1 == true){
        //         for (let i = 0; i < versions.length; i++){
        //             if (newDownloadsList[0] == versions[i]){
        //                 download_url = update_info.[deviceName (as on CDN)][i].url;
        //                 const download = require('download');
        //                 const file = download_url;
        //                 let filePath = "";
        //                 filePath = `${__dirname}/Updates/[folder]`; //Directory
        //                 download(file, filePath);
        //             }
        //         }
        //     }
    
        //     if (selected2 == true){
        //         for (let i = 0; i < versions.length; i++){
        //             if (newDownloadsList[1] == versions[i]){
        //                 download_url = update_info.[deviceName (as on CDN)][i].url;
        //                 const download = require('download');
        //                 const file = download_url;
        //                 let filePath = "";
        //                 filePath = `${__dirname}/Updates/[folder]`; //Directory
        //                 download(file, filePath);
        //             }
        //         }
        //     }

        //     if (selected3 == true){
        //         for (let i = 0; i < versions.length; i++){
        //             if (newDownloadsList[2] == versions[i]){
        //                 download_url = update_info.[deviceName (as on CDN)][i].url;
        //                 const download = require('download');
        //                 const file = download_url;
        //                 let filePath = "";
        //                 filePath = `${__dirname}/Updates/[folder]`; //Directory
        //                 download(file, filePath);
        //             }
        //         }
        //     }

        //     if (selected4 == true){
        //         for (let i = 0; i < versions.length; i++){
        //             if (newDownloadsList[3] == versions[i]){
        //                 download_url = update_info.[deviceName (as on CDN)][i].url;
        //                 const download = require('download');
        //                 const file = download_url;
        //                 let filePath = "";
        //                 filePath = `${__dirname}/Updates/[folder]`; //Directory
        //                 download(file, filePath);
        //             }
        //         }
        //     }

        //     if (selected5 == true){
        //         for (let i = 0; i < versions.length; i++){
        //             if (newDownloadsList[4] == versions[i]){
        //                 download_url = update_info.[deviceName (as on CDN)][i].url;
        //                 const download = require('download');
        //                 const file = download_url;
        //                 let filePath = "";
        //                 filePath = `${__dirname}/Updates/[folder]`; //Directory
        //                 download(file, filePath);
        //             }
        //         }
        //     }
        // }
        //---------


        popupSelectDownloadsContainer.classList.remove('visible');
    }
    
    var delayInMilliseconds = 3000; 
    setTimeout(function() {
        Swal.fire({
            title: 'Done',
            text: 'New updates have been downloaded and can now be installed.',
            icon: 'success',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#163972',
            background: toggleSwitch.checked ? '#111' : '#FFF',
            color: toggleSwitch.checked ? '#FFF' : '#111'
        });
        getAvailableUpdates();
    }, delayInMilliseconds);

    selected1 = false;
    selected2 = false;
    selected3 = false;
    selected4 = false;
    selected5 = false;

    //Adding Downloads - 8:

    for (let i = 0; i < 14; i++){
 
        var download = "newdownload";
        download += (i + 1);
        document.getElementById(download).style.background = "none";
        document.getElementById(download).style.color = "black";    
    }

    for (let i = 0; i < 14; i++){
 
        var download = "newdownload";
        download += (i + 1);
        document.getElementById(download).innerHTML = "";
    }

}

//Function that sends user selected device info to backend
function sendDFUInfo(){
    _connection.send('DFUInfo', selected_device_name, result => {});
}

//Function to get update file info from manually loaded directory
function getManualUpdateFiles() {
    _connection.send('manualUpdates', info, result => {
        updateDownloadsList(result);
    });
}

//Function to obtain available update files from specific directory
function getAvailableUpdates() {
    _connection.send('updatesAvail', info, result => {
        updateDownloadsList(result);
    });
}

//Function to obtain information for a selected update file
function getUpdateInfo(path) {
    selected_update_path = path;
    _connection.send('updateInfo', path, result => {
        updateUpdateInfoSection(result);
    });
}

//Function to update the selected device with the selected firmware
function updateDevice(path) {

    Swal.fire({
        title: 'Update Started',
        html: 'The update should take about 10 seconds to download.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        },
    });

    _connection.send('updateDevice', path, result => {

        if (result == "DFU Mode Error") {
            Swal.fire({
                title: 'DFU Mode Error!',
                text: 'Make sure to follow the steps under "PROCESS" to put the device in DFU Mode.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }

        else if (result == "Done") {
            Swal.fire({
                title: 'Update Complete!',
                text: 'The device has succesfully been updated and is restarting. You will now be directed to the dashboard.',
                icon: 'success',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111',
                didClose: (reload) => {
                    document.getElementById("exit").click();
                }
            });
        }

        else if (result == "Firmware Validation Error") {
            Swal.fire({
                title: 'Firmware Validation Error!',
                text: 'The selected firmware file dows not match any known Kauai Labs product. Downloading firmware to a mismatching product will likely cause unexpected behaviours.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }

        else if (result == "Firmware Mismatch Error") {
            Swal.fire({
                title: 'Firmware Mismatch Error!',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }

        else if (result == "Converting Error") {
            Swal.fire({
                title: 'Converting Error!',
                text: 'Error converting update file to DFU format.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }

        else if (result == "Parsing Error") {
            Swal.fire({
                title: 'Parsing Error!',
                text: 'Error parsing the DFU file.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }

        else if (result == "Deploying Error") {
            Swal.fire({
                title: 'Deploying Error!',
                text: 'Error deploying DFU file.',
                icon: 'error',
                confirmButtonText: 'Okay',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }
    });
}

//Sends request to backend to delete selected file
function deleteFile(path) {

    _connection.send('deletefile', path, result => {
        getAvailableUpdates();
        document.getElementById('manufactureText').innerHTML = "---";
        document.getElementById('modelText').innerHTML = "---";
        document.getElementById('versionText').innerHTML = "---";
    });

}

//---------------------------------DEVICE CONFIGURATION PAGE-----------------------------------

//Function to update the value entered by the user for a specific card
function configAction(command, value) {

    _connection.send('configure', { command: command, value: value }, result => {

        if (result.slice(-7) == "Success") {
            Swal.fire({
                title: 'Done!',
                text: 'The value has succesfully been updated.',
                icon: 'success',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
            if (command == "gyrorange"){
                document.getElementById('navgyrorange').innerHTML = value;
            }
            else if(command == "accelrange"){
                document.getElementById('navaccelrange').innerHTML = value;
            }
            
        }
        else if (result.slice(-6) == "Failed") {
            Swal.fire({
                title: 'Error',
                text: 'Unable to set the value. Make sure the device is up-to-date and try again.',
                icon: 'error',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }
        else {
            alert(result);
        }

    });
}

//Function to send reset request to backend for selected card
function configReset(command) {

    _connection.send('reset', command, result => {

        if (result.slice(-7) == "Success") {

            Swal.fire({
                title: 'Done!',
                text: 'The value has succesfully been updated.',
                icon: 'success',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });

            getConfigValues(command);
        }
        else if (result.slice(-6) == "Failed") {
            Swal.fire({
                title: 'Error',
                text: 'Unable to set the value. Make sure the device is up-to-date and try again.',
                icon: 'error',
                confirmButtonText: 'Continue',
                confirmButtonColor: '#163972',
                background: toggleSwitch.checked ? '#111' : '#FFF',
                color: toggleSwitch.checked ? '#FFF' : '#111'
            });
        }
        else {
            alert(result);
        }

    });
}

//Function to obtain updated values from backend for selected card
function getConfigValues(command) {

    _connection.send('getConfigValues', command, data => {
        if (command == "all") {
            updateAllConfigValues(data);
        }

        else if (command == "linearmotionReset") {
            document.getElementById('LinearInput').value = data[0];
        }
        else if (command == "rotationReset") {
            document.getElementById('RotationInput').value = data[1];
        }
        else if (command == "magneticdisturbanceReset") {
            document.getElementById('MagInput').value = data[2];
        }
        else if (command == "gyrorangeReset") {
            document.getElementById('GyroInput').value = data[3];
            document.getElementById('navgyrorange').innerHTML = data[3];

        }
        else if (command == "accelrangeReset") {
            document.getElementById('AccelInput').value = data[4];
            document.getElementById('navaccelrange').innerHTML = data[4];
        }
        else if (command == "maxgyrorangeReset") {
            document.getElementById('MaxGyroInput').value = data[5];
        }
        
    });
}

//Function to start accelerometer calibration
function startAccelCalibration() {
    _connection.send('accelcalibration', info, result => {});
}

//Function to start recording status of throughout the calibration process
function CalibrationStatus() {
    _connection.send('calibrationstatus', info, result => {
        if (result[0] == "Done") {
            document.getElementById('accelCalState').src = "./img/checkmark.png";
        }
        if (result[1] == "Good") {
            document.getElementById('accelCalQuality').src = "./img/checkmark.png";
        }
    });
}

//Sends request to backend to stop calibration process 
function stopAccelCalibration() {
    _connection.send('stopcalibration', info, result => {});
}

//Sends request to backend to start sensor fusion calibration process
function startSensorFusionCal() {
    _connection.send('startsensorcal', info, result => {
        resetYaw();
    });
}

//Sends request to backend to stop sensor fusion calibration process
function stopSensorFusionCal() {
    _connection.send('stopsensorcal', info, result => {});
}

//Sends request to backend to update gyro scale factor ratio, also stops calibration
function setGyroScale(ratio){
    _connection.send('gyroscale', ratio, result => {});
}

//Sends request to backend to reset the yaw value - for testing purposes
function resetYaw(){
    _connection.send('resetyaw', info, result => {});
}

//Function to send collected sensor fusion data to backend
function sendFusionData(){
    _connection.send('sensorfusiondata', {plus90values: plus90values, minus90values: minus90values}, result =>{});
}

//----------------------------------------MAGCAL PAGE------------------------------------------

//Sends new updated axes data (including user-input) to backend
function SaveMagCal(step){
    getAxesValues(step);
    _connection.send('magcalsave', {command: step, x: x, y: y, z: z}, result => {
        //alert(result);
    });
}

//Sends request to obtain axes data for specific step
function MagCal(step){
    _connection.send('magcalopen', step, result => {
        display_result(result, step);
    });
}

//Sends request to calculate matrix
function calculateMatrix(){
    _connection.send('calculatematrix', info, result => {
        displayMatrix();
    });
}

//Sends request to backend to save results to device
function SaveValues() {
    _connection.send('savetodevice', info, result => {});
}

//Sends request to backend to gather stored matrix information from device
function RetrieveValues() {
    _connection.send('retrievevalues', info, result => {
        displayMatrix();
    });
}

//===================================OTHER HELPER FUNCTIONS====================================

//-----------------------------------------Landing Page----------------------------------------

//Function to enable/disable device buttons on landing page
function enableButtons(array) {

    //Adding Device - 5: Declare boolean variable for your device to store if another device of the same type is connected.

    let connected1_mxp = false;
    let connected2_mxp = false;
    let connected1_vmx = false;
    let connected2_vmx = false;
    let connected1_micro = false;
    let connected2_micro = false;

    //Add additional devices here

    //--------------------------

    
    //Adding Device - 6: Disable and hide new device button

    //Disable and hide buttons
    document.getElementById("VMXBtn").style.display = "none";
    document.getElementById("VMXBtn2").style.display = "none";
    document.getElementById("VMXBtn3").style.display = "none";

    document.getElementById("navx2_MicroBtn").style.display = "none";
    document.getElementById("navx2_MicroBtn2").style.display = "none";
    document.getElementById("navx2_MicroBtn3").style.display = "none";

    document.getElementById("navx2_mxpBtn").style.display = "none";
    document.getElementById("navx2_mxpBtn2").style.display = "none";
    document.getElementById("navx2_mxpBtn3").style.display = "none";

    //Template

    // document.getElementById("").style.display = "none";

    //--------------------------


    for (let i = 0; i < array.length; i++) {
        if (array[i] == "VMX-pi") {
            let board = "VMXBtn";
            if (connected2_vmx == true){
                board = "VMXBtn3";    
                vmxpi_index3 = i;
            }
            else if (connected1_vmx == true){
                board = "VMXBtn2";  
                connected2_vmx = true;
                vmxpi_index2 = i;
            }
            else {
                board = "VMXBtn";  
                connected1_vmx = true;
                vmxpi_index = i;
            }
            document.getElementById(board).disabled = false;
            document.getElementById(board).style.pointerEvents = "initial";
            document.getElementById(board).style.filter = "initial";
            document.getElementById(board).style.display = "block";
            deviceTourSelectedName = '.VMX2Image';
            
        }

        if (array[i] == "navX2-Micro (Gen 2)") {
            let board = "navx2_MicroBtn";
            if (connected2_micro == true){
                board = "navx2_MicroBtn3";   
                navxmicro_index3 = i; 
            }
            else if (connected1_micro == true){
                board = "navx2_MicroBtn2";  
                connected2_micro = true;
                navxmicro_index2 = i;
            }
            else {
                board = "navx2_MicroBtn";  
                connected1_micro = true;
                navxmicro_index = i;
            }
            document.getElementById(board).disabled = false;
            document.getElementById(board).style.pointerEvents = "initial";
            document.getElementById(board).style.filter = "initial";
            document.getElementById(board).style.display = "block";
            deviceTourSelectedName = '.NavX2MicroImage';
        }

        if (array[i] == "navX2-MXP (Gen 2)") {
            let board = "navx2_mxpBtn";
            if (connected2_mxp == true){
                board = "navx2_mxpBtn3";   
                navx2_mxp_index3 = i; 
            }
            else if (connected1_mxp == true){
                board = "navx2_mxpBtn2";  
                connected2_mxp = true;
                navx2_mxp_index2 = i;
            }
            else {
                board = "navx2_mxpBtn";  
                connected1_mxp = true;
                navx2_mxp_index = i;
            }
            document.getElementById(board).disabled = false;
            document.getElementById(board).style.pointerEvents = "initial";
            document.getElementById(board).style.filter = "initial";
            document.getElementById(board).style.display = "block";
            deviceTourSelectedName = '.NavX2MXPImage';
        }

        //Adding Device - 7: Add an if condition to display the new device button if it is detected as connected.

        //Template:
        
        //For single device with no multiple same-type support:
        // if (array[i] == "[deviceName exactly as written on board]") {
        //     let board = "[deviceName]";
        //     [deviceName]_index = i;
        //     document.getElementById(board).disabled = false;
        //     document.getElementById(board).style.pointerEvents = "initial";
        //     document.getElementById(board).style.filter = "initial";
        //     document.getElementById(board).style.display = "block";
        //     deviceTourSelectedName = '.[deviceName]Image';
        // }

        //For single device with multiple same-type support:
        // if (array[i] == "[deviceName exactly as writeen on board]") {
        //     let board = "[deviceName]";
        //     if (connected2_[deviceName] == true){
        //         board = "[deviceName]Btn3";   
        //         [deviceName]_index3 = i; 
        //     }
        //     else if (connected1_[deviceName] == true){
        //         board = "[deviceName]Btn2";  
        //         connected2_[deviceName] = true;
        //         [deviceName]_index2 = i;
        //     }
        //     else {
        //         board = "[deviceName]Btn";  
        //         connected1_[deviceName] = true;
        //         [deviceName]_index = i;
        //     }
        //     document.getElementById(board).disabled = false;
        //     document.getElementById(board).style.pointerEvents = "initial";
        //     document.getElementById(board).style.filter = "initial";
        //     document.getElementById(board).style.display = "block";
        //     deviceTourSelectedName = '.[deviceName]Image';
        // }

        //--------------------------

    }
    document.getElementById('scanDeviceBtn').style.cursor = "pointer";
    document.getElementById('scanDeviceBtn').disabled = false;
    document.body.style.cursor = "auto";
}

//Function to update board information section in navigation column
function updateInfoSection(info) {
    document.getElementById('firmwareVersionInfo').innerHTML = info[2];
    document.getElementById('boardVersionInfo').innerHTML = info[1];
    document.getElementById('boardIDInfo').innerHTML = info[3];
    document.getElementById('boardTypeInfo').innerHTML = info[0];

}

//------------------------------------Firmware Updater---------------------------------------

//To import .JSON file from Studica CDN
async function fetchUpdateData(){
    await fetch('https://dev.studica.com/maven/release/firmware/navx/Available.json', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      }).then((response) => response.json())
        .catch(error => {
            if (error == "TypeError: Failed to fetch"){
                Swal.fire({
                    title: 'Failed to get new update information!',
                    text: 'The application was not able to check for new updates, please make sure you are connected to internet and try again. Meanwhile, you can continue with locally saved download files.',
                    icon: 'error',
                    confirmButtonText: 'Continue',
                    confirmButtonColor: '#163972',
                    background: toggleSwitch.checked ? '#111' : '#FFF',
                    color: toggleSwitch.checked ? '#FFF' : '#111'
                });
            }
            ;})
        .then((json) => JSON_Check(json));
}

//Update the downloads list with available download names
function updateDownloadsList(downloads) {

    //Adding Downloads - 9:

    for (let i = 0; i < 14; i++) {  //only change argument for this for loop
        var download = "download";
        download += (i + 1);
        document.getElementById(download).innerHTML = "";
    }

    downloadsList = downloads;
    
    for (let i = 0; i < downloads.length; i++) {
        var download = "download";
        download += (i + 1);
        document.getElementById(download).innerHTML = ' ' + '<i class="fa-regular fa-file"></i>' + ' ' + downloads[i].substring(path_length);
    }
}

//Update frontend with selected download information
function updateUpdateInfoSection(info) {
    document.getElementById('manufactureText').innerHTML = info[0];
    document.getElementById('modelText').innerHTML = info[1];
    document.getElementById('versionText').innerHTML = info[2];
}

//-------------------------------------DeviceConfig---------------------------------------------

//Update frontend cards with device config values obtained from backend
function updateAllConfigValues(array) {
    document.getElementById('LinearInput').value = array[0];
    document.getElementById('RotationInput').value = array[1];
    document.getElementById('MagInput').value = array[2];
    document.getElementById('GyroInput').value = array[3];
    document.getElementById('navgyrorange').innerHTML = array[3];
    document.getElementById('AccelInput').value = array[4];
    document.getElementById('navaccelrange').innerHTML = array[4];
    document.getElementById('MaxGyroInput').value = array[5];
}

//Calculates updated gyro scale factor ratio
function calculateMean(){
    let plus90 = null;
    let minus90 = null;
    let plusMean = null;
    let minusMean = null;
    let ratio = null;

    for (let i = 0; i < plus90values.length; i++){
        plus90 += parseFloat(plus90values[i]);
        minus90 += parseFloat(minus90values[i]);
    }

    plusMean = plus90 / plus90values.length;
    minusMean = minus90 / plus90values.length;

    ratio = 90 / ( (Math.abs(plusMean) + Math.abs(minusMean)) / 2);

    if (ratio >= 0.9 && ratio <= 1.1){
        setGyroScale(ratio);
    }
    else{
        Swal.fire({
            title: 'Calibration Unsuccessful!',
            text: 'The calibration result was out of the desired range. Please try again and follow the steps closely for accurate results.',
            icon: 'error',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#163972',
            background: toggleSwitch.checked ? '#111' : '#FFF',
            color: toggleSwitch.checked ? '#FFF' : '#111'
        });
    }
}

//-------------------------------------------MagCal--------------------------------------------

//Gets the axes data from the input boxes on the MagCal popups
function getAxesValues(command){

    if (command == "xplus0"){
        x = document.getElementById('xplus_0x').value;
        y = document.getElementById('xplus_0y').value;
        z = document.getElementById('xplus_0z').value;
    }
    else if(command == "xplus180"){
        x = document.getElementById('xplus_180x').value;
        y = document.getElementById('xplus_180y').value;
        z = document.getElementById('xplus_180z').value;
    }
    else if(command == "xminus0"){
        x = document.getElementById('xminus_0x').value;
        y = document.getElementById('xminus_0y').value;
        z = document.getElementById('xminus_0z').value;
    }
    else if(command == "xminus180"){
        x = document.getElementById('xminus_180x').value;
        y = document.getElementById('xminus_180y').value;
        z = document.getElementById('xminus_180z').value;
    }
    else if(command == "yplus0"){
        x = document.getElementById('yplus_0x').value;
        y = document.getElementById('yplus_0y').value;
        z = document.getElementById('yplus_0z').value;
    }
    else if(command == "yplus180"){
        x = document.getElementById('yplus_180x').value;
        y = document.getElementById('yplus_180y').value;
        z = document.getElementById('yplus_180z').value;
    }
    else if(command == "yminus0"){
        x = document.getElementById('yminus_0x').value;
        y = document.getElementById('yminus_0y').value;
        z = document.getElementById('yminus_0z').value;
    }
    else if(command == "yminus180"){
        x = document.getElementById('yminus_180x').value;
        y = document.getElementById('yminus_180y').value;
        z = document.getElementById('yminus_180z').value;
    }
    else if(command == "zplus0"){
        x = document.getElementById('zplus_0x').value;
        y = document.getElementById('zplus_0y').value;
        z = document.getElementById('zplus_0z').value;
    }
    else if(command == "zplus180"){
        x = document.getElementById('zplus_180x').value;
        y = document.getElementById('zplus_180y').value;
        z = document.getElementById('zplus_180z').value;
    }
    else if(command == "zminus0"){
        x = document.getElementById('zminus_0x').value;
        y = document.getElementById('zminus_0y').value;
        z = document.getElementById('zminus_0z').value;
    }
    else if(command == "zminus180"){
        x = document.getElementById('zminus_180x').value;
        y = document.getElementById('zminus_180y').value;
        z = document.getElementById('zminus_180z').value;
    }
}

//Displays recieved axes data values onto frontend 
function display_result(result, command){
    if (command == "xplus0"){
        document.getElementById('xplus_0x').value = result[0];
        document.getElementById('xplus_0y').value = result[1];
        document.getElementById('xplus_0z').value = result[2];
    }
    else if(command == "xplus180"){
        document.getElementById('xplus_180x').value = result[0];
        document.getElementById('xplus_180y').value = result[1];
        document.getElementById('xplus_180z').value = result[2];
    }
    else if(command == "xminus0"){
        document.getElementById('xminus_0x').value = result[0];
        document.getElementById('xminus_0y').value = result[1];
        document.getElementById('xminus_0z').value = result[2];
    }
    else if(command == "xminus180"){
        document.getElementById('xminus_180x').value = result[0];
        document.getElementById('xminus_180y').value = result[1];
        document.getElementById('xminus_180z').value = result[2];
    }
    else if(command == "yplus0"){
        document.getElementById('yplus_0x').value = result[0];
        document.getElementById('yplus_0y').value = result[1];
        document.getElementById('yplus_0z').value = result[2];
    }
    else if(command == "yplus180"){
        document.getElementById('yplus_180x').value = result[0];
        document.getElementById('yplus_180y').value = result[1];
        document.getElementById('yplus_180z').value = result[2];
    }
    else if(command == "yminus0"){
        document.getElementById('yminus_0x').value = result[0];
        document.getElementById('yminus_0y').value = result[1];
        document.getElementById('yminus_0z').value = result[2];
    }
    else if(command == "yminus180"){
        document.getElementById('yminus_180x').value = result[0];
        document.getElementById('yminus_180y').value = result[1];
        document.getElementById('yminus_180z').value = result[2];
    }
    else if(command == "zplus0"){
        document.getElementById('zplus_0x').value = result[0];
        document.getElementById('zplus_0y').value = result[1];
        document.getElementById('zplus_0z').value = result[2];
    }
    else if(command == "zplus180"){
        document.getElementById('zplus_180x').value = result[0];
        document.getElementById('zplus_180y').value = result[1];
        document.getElementById('zplus_180z').value = result[2];
    }
    else if(command == "zminus0"){
        document.getElementById('zminus_0x').value = result[0];
        document.getElementById('zminus_0y').value = result[1];
        document.getElementById('zminus_0z').value = result[2];
    }
    else if(command == "zminus180"){
        document.getElementById('zminus_180x').value = result[0];
        document.getElementById('zminus_180y').value = result[1];
        document.getElementById('zminus_180z').value = result[2];
    }
}

//Displays recieved calculated matrix information onto frontend
function displayMatrix(){
    document.getElementById('M11').value = x_matrix[0];
    document.getElementById('M12').value = y_matrix[0];
    document.getElementById('M13').value = z_matrix[0];

    document.getElementById('M21').value = x_matrix[1];
    document.getElementById('M22').value = y_matrix[1];
    document.getElementById('M23').value = z_matrix[1];

    document.getElementById('M31').value = x_matrix[2];
    document.getElementById('M32').value = y_matrix[2];
    document.getElementById('M33').value = z_matrix[2];

    document.getElementById('bias1').value = bias_matrix[0];
    document.getElementById('bias2').value = bias_matrix[1];
    document.getElementById('bias3').value = bias_matrix[2];
}

//==========================Connections to recieve data sent from backend======================

//-----------------------------------------Landing Page---------------------------------------------

//Recieves information regarding if DFU device is connected
_connection.on("dfu", result => {
    dfu_device_present = result;
});

//Recieves information on how many ports are connected
_connection.on('ports', result => {
    ports = result;
})

//-----------------------------------------Firmware Updater-----------------------------------

//Recieves path length for downloads to be used for chopping the displayed filename
_connection.on('pathlength', value => {
    path_length = value + 1;
});

//Recieves list of new downloads 
_connection.on('newdownloads', result => {
    //alert(result);
    newDownloadsList = result;
});

//---------------------------------------Device Configuration--------------------------------

//Recieves calibration state status from backend, and changes icon accordingly
_connection.on('calstatusstate', result => {
    
    document.getElementById('accelCalStateLabel').innerHTML = result;

    if (result == "Done"){
        document.getElementById('accelCalState').src = "./img/checkmark.png";
    }
    else if (result == "In Progress"){
        document.getElementById('accelCalState').src = "./img/waiting.gif";
    }
    else{
        document.getElementById('accelCalState').src = "./img/xIcon.png";
    }
    
});

//Recieves calibration state quality status from backend, and changes icon accordingly
_connection.on('calstatusqual', result => {

    document.getElementById('accelCalQualityLabel').innerHTML = result;
    if (result == "Good"){
        document.getElementById('accelCalQuality').src = "./img/checkmark.png";  
    }
    else if (result == "OK"){
        document.getElementById('accelCalQuality').src = "./img/waiting.gif"
    }
    else {
        document.getElementById('accelCalQuality').src = "./img/xIcon.png";
    }

});

//Recieves dynamic yaw value from backend, and displays it onto the frontend
_connection.on('yawval', result => {
    document.getElementById('yawValue').innerHTML = result;
    document.getElementById('yawValue2').innerHTML = result;
    document.getElementById('yawValue3').innerHTML = result;
    document.getElementById('yawValue4').innerHTML = result;
    document.getElementById('yawValue5').innerHTML = result;
    yawval = result;
    rotateImage(yawval);
});

//Rotates the compass according to the live yaw value
function rotateImage(degrees) {
    const compass = document.getElementById("compass");
    const compass2 = document.getElementById('compass2');
    const compass3 = document.getElementById("compass3");
    const compass4 = document.getElementById("compass4");
    const compass5 = document.getElementById("compass5");

    compass.style.transform = `rotate(${degrees}deg)`;
    compass2.style.transform = `rotate(${degrees}deg)`;
    compass3.style.transform = `rotate(${degrees}deg)`;
    compass4.style.transform = `rotate(${degrees}deg)`;
    compass5.style.transform = `rotate(${degrees}deg)`;
}

//-----------------------------------------NAVXUI--------------------------------------------

//Includes accel X,Y,Z, heading, and temp
_connection.on('othernavxuivalues', result => {
    document.getElementById('accelx').innerHTML = result[0];
    document.getElementById('accely').innerHTML = result[1];
    document.getElementById('accelz').innerHTML = result[2];
    document.getElementById('heading').innerHTML = result[3];
    compass = parseFloat(result[3]);
    if ((compass > 340 && compass <= 360) || (compass > 0 && compass <= 20)){
        document.getElementById('direction').innerHTML = "N";
    }
    else if (compass > 20 && compass < 60){
        document.getElementById('direction').innerHTML = "NE";
    }
    else if (compass > 60 && compass <= 110){
        document.getElementById('direction').innerHTML = "E";
    }
    else if (compass > 110 && compass < 160){
        document.getElementById('direction').innerHTML = "SE";
    }
    else if (compass > 160 && compass <= 200){
        document.getElementById('direction').innerHTML = "S";
    }
    else if (compass > 200 && compass < 245){
        document.getElementById('direction').innerHTML = "SW";
    }
    else if (compass > 245 && compass <= 290){
        document.getElementById('direction').innerHTML = "W";
    }
    else if (compass > 290 && compass < 360){
        document.getElementById('direction').innerHTML = "NW";
    }
    document.getElementById('temp').innerHTML = result[4];
});

//-----------------------------------------MagCal---------------------------------------------

//Receive calculated matrix values from backend:
_connection.on('xmatrix', xmatrix => {
    x_matrix = xmatrix;
});
_connection.on('ymatrix', ymatrix => {
    y_matrix = ymatrix;
});
_connection.on('zmatrix', zmatrix => {
    z_matrix = zmatrix;
});
_connection.on('biasmatrix', biasmatrix => {
    bias_matrix = biasmatrix;
});

//----------------------------------------Other--------------------------------------------

//Errors
_connection.on('error', result => {
    if (result == "Timed Out"){
        Swal.fire({
            title: 'No devices detected!',
            text: 'Connect a navx device to your computer. If the error persists, try reconnecting the device.',
            icon: 'error',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#163972',
            background: toggleSwitch.checked ? '#111' : '#FFF',
            color: toggleSwitch.checked ? '#FFF' : '#111'
        });
        document.getElementById('scanDeviceBtn').style.cursor = "pointer";
        document.getElementById('scanDeviceBtn').disabled = false;
        document.body.style.cursor = "auto";
    }
    else if (result == "Timed Out 2"){
        Swal.fire({
            title: 'Error connecting with device!',
            text: 'Try reconnecting the navx device to the computer.',
            icon: 'error',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#163972',
            background: toggleSwitch.checked ? '#111' : '#FFF',
            color: toggleSwitch.checked ? '#FFF' : '#111'
        });
        enableButtons(emptyArray);
        document.getElementById('numDevicesConnected').innerHTML = "0 devices connected";

        document.getElementById('VMXBtn').style.cursor = "pointer";
        document.body.style.cursor = "auto";
        document.getElementById('VMXBtn').disabled = false;

        document.getElementById('navx2_mxpBtn').style.cursor = "pointer";
        document.body.style.cursor = "auto";
        document.getElementById('navx2_mxpBtn').disabled = false;

        document.getElementById('navx2_MicroBtn').style.cursor = "pointer";
        document.body.style.cursor = "auto";
        document.getElementById('navx2_MicroBtn').disabled = false;

        //Adding Device - 16:

        //Template:
        // document.getElementById('[deviceName]').style.cursor = "pointer";
        // document.body.style.cursor = "auto";
        // document.getElementById('[deviceName]').disabled = false;
        //---------
    }
    else{
        alert(result);
    }
});


//=========================================POP-UPS=============================================

//Landing Page Popup
const autoDFUPopup = document.getElementById('autoDfuSelectionContainer');
const autoDFUPopupClose = document.getElementById('closeDeviceSelectContainerBtn');

autoDFUPopupClose.addEventListener('click', () => {
    autoDFUPopup.classList.remove('visible');
});

//Accelerometer Popup Section

// Get the button and popup container elements
const showAccelPopupBtn = document.getElementById('show-accel-popup');
const popupAccelContainer = document.getElementById('accel-popup-container');

// Add a click event listener to the button
showAccelPopupBtn.addEventListener('click', () => {
    // Add the "visible" class to the popup container to slide it in
    popupAccelContainer.classList.add('visible');

    //Accel Tour

    if (tourEnabled && tour.getCurrentStep()) {

        const tour = new Shepherd.Tour({
            defaultStepOptions: {
              cancelIcon: {
                enabled: true
              },
              classes: 'sheppard-theme-arrows'
            }
          });


        setTimeout(() => {
            tour.addStep({
                title: 'Accelerometer  Calibration Window',
                text: 'Welcome to Calibration Page for the Sensor Fusion',
                attachTo: {
                    element: '.accel-header-main',
                    on: 'right'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'Video Guidence',
                text: 'Please watch this video carefully to understand how this calibration process works.',
                attachTo: {
                    element: '.vidContentSection',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'State and Quality Check',
                text: 'Once you begin calibration, follow the steps in the video until a checkmark or a done status is achieved here',
                attachTo: {
                    element: '.accelState',
                    on: 'right'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.complete();
                        },
                        text: 'Finish'
                    }
                ]
            });

            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
                document.body.classList.add('shepherd-dark-background');
              });
            
              // Remove the dark background class from the body element when the tour is hidden
              tour.on('complete', function() {
                document.body.classList.remove('shepherd-dark-background');
              });
              tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
            tour.start();
        }, 1000);
    }
    
});

// Get the close button element
const closeAccelPopupBtn = document.getElementById('close-accel-popup');

// Add a click event listener to the close button
closeAccelPopupBtn.addEventListener('click', () => {
    // Remove the "visible" class from the popup container to slide it out
    popupAccelContainer.classList.remove('visible');
    stopAccelCalibration();
    tour.complete('AccelPopup'); //doesnt work for some reason still
});

// Sensor Fusion Calculation Section

const showFusionPopupBtn = document.getElementById('show-fusion-popup');
const showFusionPopupBtnTwo = document.getElementById('open-fusion-popupTwo');
const showFusionPopupBtnThree = document.getElementById('open-fusion-popupThree');
const showFusionPopupBtnFour = document.getElementById('open-fusion-popupFour');
const showFusionPopupBtnFive = document.getElementById('open-fusion-popupFive');

const popupFusionContainer = document.getElementById('fusion-popup-container');
const popupFusionContainerTwo = document.getElementById('fusion-popupTwo-container');
const popupFusionContainerThree = document.getElementById('fusion-popupThree-container');
const popupFusionContainerFour = document.getElementById('fusion-popupFour-container');
const popupFusionContainerFive = document.getElementById('fusion-popupFive-container');


showFusionPopupBtn.addEventListener('click', () => {
    popupFusionContainer.classList.add('visible');

    resetYaw();

    //Tour for first fusion popup window

    if (tourEnabled && tour.getCurrentStep()) {

        const tour = new Shepherd.Tour({
            defaultStepOptions: {
              cancelIcon: {
                enabled: true
              },
              classes: 'sheppard-theme-arrows'
            }
          });


        setTimeout(() => {
            tour.addStep({
                title: 'Sensor Fusion Calibration Window',
                text: 'Welcome to Calibration Page for the Sensor Fusion',
                attachTo: {
                    element: '.fusion-header-main',
                    on: 'right'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });


            tour.addStep({
                title: 'Lets Start!',
                text: 'To begin the calibration, simply click the Calculate button here.',
                attachTo: {
                    element: '.startButtonFusionPageOne',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'Video Guidence',
                text: 'Please watch this video carefully to understand how this calibration process works.',
                attachTo: {
                    element: '.vidFusion',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'View Next Window',
                text: 'To accurately calibrate this sensor, you will have to repeat this step 5 times. Use these buttons to navigate to the next window. ',
                attachTo: {
                    element: '.rightButton',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.complete();
                        },
                        text: 'Finish'
                    }
                ]
            });

            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
                document.body.classList.add('shepherd-dark-background');
              });
            
              // Remove the dark background class from the body element when the tour is hidden
              tour.on('complete', function() {
                document.body.classList.remove('shepherd-dark-background');
              });

              tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
            tour.start();
        }, 1000);
    }

});

showFusionPopupBtnTwo.addEventListener('click', () => {
    popupFusionContainerTwo.classList.add('visible');
});

showFusionPopupBtnThree.addEventListener('click', () => {
    popupFusionContainerThree.classList.add('visible');
});

showFusionPopupBtnFour.addEventListener('click', () => {
    popupFusionContainerFour.classList.add('visible');
});

showFusionPopupBtnFive.addEventListener('click', () => {
    popupFusionContainerFive.classList.add('visible');


    if (tourEnabled && tour.getCurrentStep()) {

        const tour = new Shepherd.Tour({
            defaultStepOptions: {
              cancelIcon: {
                enabled: true
              },
              classes: 'sheppard-theme-arrows'
            }
          });


        setTimeout(() => {
            tour.addStep({
                title: 'Final Sensor Fusion Calibration Window',
                text: 'Please repeat the calibration process for one final time to accurately calibrate this device',
                attachTo: {
                    element: '.fusion-header-main',
                    on: 'right'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });


            tour.addStep({
                title: 'Lets Start!',
                text: 'To begin the calibration, simply click the START button here.',
                attachTo: {
                    element: '#calculateBtn',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'Save the data',
                text: 'Once you have successfully calibrated the sensor, press here to save the devices data',
                attachTo: {
                    element: '#exportData',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'Exit this Window',
                text: 'Click here once you are done with the calibration',
                attachTo: {
                    element: '#close-finalFusion-popup',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.complete();
                        },
                        text: 'Finish'
                    }
                ]
            });

            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
                document.body.classList.add('shepherd-dark-background');
              });
            
              // Remove the dark background class from the body element when the tour is hidden
              tour.on('complete', function() {
                document.body.classList.remove('shepherd-dark-background');
              });

              tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
            tour.start();
        }, 1000);
    }

});

const closeFusionPopupBtn = document.getElementById('close-fusion-popup');
const closeFusionPopupBtnTwo = document.getElementById('close-fusion-popupTwo');
const closeFusionPopupBtnThree = document.getElementById('close-fusion-popupThree');
const closeFusionPopupBtnFour = document.getElementById('close-fusion-popupFour');
const closeFusionPopupBtnFive = document.getElementById('close-fusion-popupFive');
const closeFinalFusionPopupBtn = document.getElementById('close-finalFusion-popup');

closeFusionPopupBtn.addEventListener('click', () => {
    popupFusionContainer.classList.remove('visible');

    document.getElementById('stepone_plus90').value = "...";   
    document.getElementById('stepone_minus90').value = "...";   
    document.getElementById('steptwo_plus90').value = "...";   
    document.getElementById('steptwo_minus90').value = "...";   
    document.getElementById('stepthree_plus90').value = "...";   
    document.getElementById('stepthree_minus90').value = "...";   
    document.getElementById('stepfour_plus90').value = "...";   
    document.getElementById('stepfour_minus90').value = "...";   
    document.getElementById('stepfive_plus90').value = "...";   
    document.getElementById('stepfive_minus90').value = "...";  

    stopSensorFusionCal();
});

closeFusionPopupBtnTwo.addEventListener('click', () => {
    popupFusionContainerTwo.classList.remove('visible');
});

closeFusionPopupBtnThree.addEventListener('click', () => {
    popupFusionContainerThree.classList.remove('visible');
});

closeFusionPopupBtnFour.addEventListener('click', () => {
    popupFusionContainerFour.classList.remove('visible');
});


closeFusionPopupBtnFive.addEventListener('click', () => {
    popupFusionContainerFive.classList.remove('visible');
});

closeFinalFusionPopupBtn.addEventListener('click', () => {
    popupFusionContainerFive.classList.remove('visible');
    popupFusionContainerFour.classList.remove('visible');
    popupFusionContainerThree.classList.remove('visible');
    popupFusionContainerTwo.classList.remove('visible');
    popupFusionContainer.classList.remove('visible');

    document.getElementById('stepone_plus90').value = "...";   
    document.getElementById('stepone_minus90').value = "...";   
    document.getElementById('steptwo_plus90').value = "...";   
    document.getElementById('steptwo_minus90').value = "...";   
    document.getElementById('stepthree_plus90').value = "...";   
    document.getElementById('stepthree_minus90').value = "...";   
    document.getElementById('stepfour_plus90').value = "...";   
    document.getElementById('stepfour_minus90').value = "...";   
    document.getElementById('stepfive_plus90').value = "...";   
    document.getElementById('stepfive_minus90').value = "...";  
});

// Magneomter Popups Section

// Get the button and popup container elements
const showMagPopupBtn = document.getElementById('calculateMatrixBtn');
const showMagPopupTwoBtn = document.getElementById('rightButton');
const showMagPopupThreeBtn = document.getElementById('openThirdPopup');
const showMagPopupFourBtn = document.getElementById('openFourthPopup');
const showMagPopupFiveBtn = document.getElementById('openFifthPopup');
const showMagPopupSixBtn = document.getElementById('openSixthPopup');
const showMagPopupSevenBtn = document.getElementById('openSeventhPopup');

// Get the popup container elements
const popupMagContainer = document.getElementById('mag-popup-container');
const popupTwoMagContainer = document.getElementById('mag-popupTwo-container');
const popupThreeMagContainer = document.getElementById('mag-popupThree-container');
const popupFourMagContainer = document.getElementById('mag-popupFour-container');
const popupFiveMagContainer = document.getElementById('mag-popupFive-container');
const popupSixMagContainer = document.getElementById('mag-popupSix-container');

// First Mag Popup Section

// Add a click event listener to the button
showMagPopupBtn.addEventListener('click', () => {


    if(selected_device_name == "vmxpi"){
        document.getElementById('imageLeftMag').src = './img/magCalImages/VMX/vmx_x+0.jpg';
        document.getElementById('imageRightMag').src = './img/magCalImages/VMX/vmx_x+180.jpg';
    }  
    if (selected_device_name == "navx2_mxp"){
        document.getElementById('imageLeftMag').src = './img/magCalImages/MXP/navx2mxp_x+0.jpg';
        document.getElementById('imageRightMag').src = './img/magCalImages/MXP/navx2mxp_x+180.jpg';
    }  
    if (selected_device_name == "navx2micro"){
        document.getElementById('imageLeftMag').src = './img/magCalImages/MICRO/navx2micro_x+0.jpg';
        document.getElementById('imageRightMag').src = './img/magCalImages/MICRO/navx2micro_x+180.jpg';
    }


    // Add the "visible" class to the popup container to slide it in
    popupMagContainer.classList.add('visible');

    //Mag Tour 1

    if (tourEnabled && tour.getCurrentStep()) {

        const tour = new Shepherd.Tour({
            defaultStepOptions: {
              cancelIcon: {
                enabled: true
              },
              classes: 'sheppard-theme-arrows'
            }
          });

        setTimeout(() => {
            tour.addStep({
                title: 'Magnetometer Calibration Window',
                text: 'Welcome to Magnetometer Page',
                attachTo: {
                    element: '.step-te',
                    on: 'right'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                title: 'Magnetometer Video Tutorial',
                text: 'Please watch this video carefully to understand how this calibration process works.',
                attachTo: {
                    element: '.vidMag',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

            tour.addStep({
                    title: 'Point 0 Degrees Calculation',
                    text: 'Follow the second part of the video to calibrate this section',
                    attachTo: {
                        element: '.pointLabel',
                        on: 'top'
                    },
                    buttons: [
                        {
                            action: function () {
                                return this.back();
                            },
                            classes: 'shepherd-button-secondary',
                            text: 'Back'
                        },
                        {
                            action: function () {
                                return this.next();
                            },
                            text: 'Next'
                        }
                    ]
                });

                
            tour.addStep({
                title: 'Record Values',
                text: 'Press this button to record the values for the device',
                attachTo: {
                    element: '.recordMagValuesBtn',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });


            tour.addStep({
                title: 'Save Values',
                text: 'Press this button to save the values for the device',
                attachTo: {
                    element: '.magSaveValuesBtn',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });
      
            tour.addStep({
                title: 'View Next Step',
                text: ' Now you have to calibrate for Point 180 degrees',
                attachTo: {
                    element: '#nextBtn',
                    on: 'bottom'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.complete();
                        },
                        text: 'Finish'
                    }
                ]
            });

            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
                document.body.classList.add('shepherd-dark-background');
              });
            
              // Remove the dark background class from the body element when the tour is hidden
              tour.on('complete', function() {
                document.body.classList.remove('shepherd-dark-background');
              });

              tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
            tour.start();
        }, 1000);
    }

});

showMagPopupTwoBtn.addEventListener('click', () => {
    // Check if the secondCalculation element is visible
    if (document.getElementById("secondCalculation").classList.contains("visible")) {

        if(selected_device_name == "vmxpi"){
            document.getElementById('imageLeftMag2').src = './img/magCalImages/VMX/vmx_x-0.jpg';
            document.getElementById('imageRightMag2').src = './img/magCalImages/VMX/vmx_x-180.jpg';
        }  
        
        if (selected_device_name == "navx2micro"){
           
            document.getElementById('imageLeftMag2').src = './img/magCalImages/MICRO/navx2micro_x-0.jpg';
            document.getElementById('imageRightMag2').src = './img/magCalImages/MICRO/navx2micro_x-180.jpg';
        }  
        
        if (selected_device_name == "navx2_mxp"){
            document.getElementById('imageLeftMag2').src = './img/magCalImages/MXP/navx2mxp_x-0.jpg';
            document.getElementById('imageRightMag2').src = './img/magCalImages/MXP/navx2mxp_x-180.jpg';
        }

        // If it is visible, add the "visible" class to the popup container to slide it in
        popupTwoMagContainer.classList.add('visible');
        //  document.getElementById("secondCalculation").classList.remove("visible");

    } else {
        // If it is not visible, add the "visible" class to the secondCalculation element to make it visible
        document.getElementById("secondCalculation").classList.add("visible");
        //Tour for second calculation part
        if (tourEnabled && tour.getCurrentStep()) {

            const tour = new Shepherd.Tour({
                defaultStepOptions: {
                  cancelIcon: {
                    enabled: true
                  },
                  classes: 'sheppard-theme-arrows'
                }
              });
    
            setTimeout(() => {
                tour.addStep({
                    title: 'Point 180 Degrees Calculation',
                    text: 'Follow the second part of the video to calibrate this section',
                    attachTo: {
                        element: '#pointLabel180',
                        on: 'top'
                    },
                    buttons: [
                        {
                            action: function () {
                                return this.back();
                            },
                            classes: 'shepherd-button-secondary',
                            text: 'Back'
                        },
                        {
                            action: function () {
                                return this.next();
                            },
                            text: 'Next'
                        }
                    ]
                });
             
                tour.addStep({
                    title: 'Record Values',
                    text: 'Press this button to record the values for the device',
                    attachTo: {
                        element: '#xplus0RecordBtn',
                        on: 'top'
                    },
                    buttons: [
                        {
                            action: function () {
                                return this.back();
                            },
                            classes: 'shepherd-button-secondary',
                            text: 'Back'
                        },
                        {
                            action: function () {
                                return this.next();
                            },
                            text: 'Next'
                        }
                    ]
                });
    
                tour.addStep({
                    title: 'Save Values',
                    text: 'Press this button to save the values for the device',
                    attachTo: {
                        element: '#xplus180SaveBtn',
                        on: 'top'
                    },
                    buttons: [
                        {
                            action: function () {
                                return this.back();
                            },
                            classes: 'shepherd-button-secondary',
                            text: 'Back'
                        },
                        {
                            action: function () {
                                return this.next();
                            },
                            text: 'Next'
                        }
                    ]
                });
      
            tour.addStep({
                title: 'Calculate the next Axis Point',
                text: 'Once you have recorded and saved the values, click here to calibrate for the next Axis Data Point',
                attachTo: {
                    element: '#nextBtn',
                    on: 'bottom'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.next();
                        },
                        text: 'Next'
                    }
                ]
            });

                // Add the dark background class to the body element when the tour is shown
                tour.on('show', function() {
                    document.body.classList.add('shepherd-dark-background');
                  });
                
                  // Remove the dark background class from the body element when the tour is hidden
                  tour.on('complete', function() {
                    document.body.classList.remove('shepherd-dark-background');
                  });

                  tour.on('cancel', function() {
                    // Remove the dark background class from the body element when the tour is cancelled
                    document.body.classList.remove('shepherd-dark-background');
                  });
                tour.start();
            }, 1000);
        }
        //  popupTwoMagContainer.classList.remove('visible');
    }
});

showMagPopupThreeBtn.addEventListener('click', () => {
    if (document.getElementById("thirdCalculation").classList.contains("visible")) {

        if(selected_device_name == "vmxpi"){
            document.getElementById('imageLeftMag3').src = './img/magCalImages/VMX/vmx_y+0.jpg';
            document.getElementById('imageRightMag3').src = './img/magCalImages/VMX/vmx_y+180.jpg';
        }  
        
        if (selected_device_name == "navx2micro"){
            document.getElementById('imageLeftMag3').src = './img/magCalImages/MICRO/navx2micro_y+0.jpg';
            document.getElementById('imageRightMag3').src = './img/magCalImages/MICRO/navx2micro_y+180.jpg';
        }  
        
        if (selected_device_name == "navx2_mxp"){
            document.getElementById('imageLeftMag3').src = './img/magCalImages/MXP/navx2mxp_y+0.jpg';
            document.getElementById('imageRightMag3').src = './img/magCalImages/MXP/navx2mxp_y+180.jpg';
            
        }
        popupThreeMagContainer.classList.add('visible');
        
    
    } else {
        // Constant Right Image
        document.getElementById("thirdCalculation").classList.add("visible");
    }
});

showMagPopupFourBtn.addEventListener('click', () => {
    if (document.getElementById("fourthCalculation").classList.contains("visible")) {

        if(selected_device_name == "vmxpi"){
            document.getElementById('imageLeftMag4').src = './img/magCalImages/VMX/vmx_y-0.jpg';
            document.getElementById('imageRightMag4').src = './img/magCalImages/VMX/vmx_y-180.jpg';
        }  
        
        if (selected_device_name == "navx2micro"){
            document.getElementById('imageLeftMag4').src = './img/magCalImages/MICRO/navx2micro_y-0.jpg';
            document.getElementById('imageRightMag4').src = './img/magCalImages/MICRO/navx2micro_y-180.jpg';
        }  
        
        if (selected_device_name == "navx2_mxp"){
            document.getElementById('imageLeftMag4').src = './img/magCalImages/MXP/navx2mxp_y-0.jpg';
            document.getElementById('imageRightMag4').src = './img/magCalImages/MXP/navx2mxp_y-180.jpg';
        }



        popupFourMagContainer.classList.add('visible');
    } else {
        document.getElementById("fourthCalculation").classList.add("visible");

    }
});

showMagPopupFiveBtn.addEventListener('click', () => {
    if (document.getElementById("fifthCalculation").classList.contains("visible")) {

        if(selected_device_name == "vmxpi"){
            document.getElementById('imageLeftMag5').src = './img/magCalImages/VMX/vmx_z+0.jpg';
            document.getElementById('imageRightMag5').src = './img/magCalImages/VMX/vmx_z+180.jpg';
        }  
        
        if (selected_device_name == "navx2micro"){
            document.getElementById('imageLeftMag5').src = './img/magCalImages/MICRO/navx2micro_z+0.jpg';
            document.getElementById('imageRightMag5').src = './img/magCalImages/MICRO/navx2micro_z+180.jpg';
        }  
        
        if (selected_device_name == "navx2_mxp"){
            document.getElementById('imageLeftMag5').src = './img/magCalImages/MXP/navx2mxp_z+0.jpg';
            document.getElementById('imageRightMag5').src = './img/magCalImages/MXP/navx2mxp_z+180.jpg';
        }


        popupFiveMagContainer.classList.add('visible');
    } else {
        document.getElementById("fifthCalculation").classList.add("visible");

    }
});

showMagPopupSixBtn.addEventListener('click', () => {
    if (document.getElementById("sixthCalculation").classList.contains("visible")) {

        if(selected_device_name == "vmxpi"){
            document.getElementById('imageLeftMag6').src = './img/magCalImages/VMX/vmx_z-0.jpg';
            document.getElementById('imageRightMag6').src = './img/magCalImages/VMX/vmx_z-180.jpg';
        }  
        
        if (selected_device_name == "navx2micro"){
            document.getElementById('imageLeftMag6').src = './img/magCalImages/MICRO/navx2micro_z-0.jpg';
            document.getElementById('imageRightMag6').src = './img/magCalImages/MICRO/navx2micro_z-180.jpg';
        }  
        
        if (selected_device_name == "navx2_mxp"){
            document.getElementById('imageLeftMag6').src = './img/magCalImages/MXP/navx2mxp_z-0.jpg';
            document.getElementById('imageRightMag6').src = './img/magCalImages/MXP/navx2mxp_z-180.jpg';
        }
        popupSixMagContainer.classList.add('visible');
    } else {
        document.getElementById("sixthCalculation").classList.add("visible");

    }
});

showMagPopupSevenBtn.addEventListener('click', () => {
    document.getElementById("seventhCalculation").classList.add("visible");

    //Tour for last step of mag cal
    if (tourEnabled && tour.getCurrentStep()) {

        const tour = new Shepherd.Tour({
            defaultStepOptions: {
              cancelIcon: {
                enabled: true
              },
              classes: 'sheppard-theme-arrows'
            }
          });

        setTimeout(() => {
       
            tour.addStep({
                title: 'Exit this Window',
                text: 'Click here once you are done with the calibration',
                attachTo: {
                    element: '#calculateSaveBtn',
                    on: 'top'
                },
                buttons: [
                    {
                        action: function () {
                            return this.back();
                        },
                        classes: 'shepherd-button-secondary',
                        text: 'Back'
                    },
                    {
                        action: function () {
                            return this.complete();
                        },
                        text: 'Finish'
                    }
                ]
            });
      
            // Add the dark background class to the body element when the tour is shown
            tour.on('show', function() {
                document.body.classList.add('shepherd-dark-background');
              });
            
              // Remove the dark background class from the body element when the tour is hidden
              tour.on('complete', function() {
                document.body.classList.remove('shepherd-dark-background');
              });

              tour.on('cancel', function() {
                // Remove the dark background class from the body element when the tour is cancelled
                document.body.classList.remove('shepherd-dark-background');
              });
            tour.start();
        }, 1000);
    }

});

// Closing Section for tabs
const closeMagPopupBtn = document.getElementById('close-mag-popup');
// Add a click event listener to the close button
closeMagPopupBtn.addEventListener('click', () => {
    // Remove the "visible" class from the popup container to slide it out
    popupMagContainer.classList.remove('visible');

    document.getElementById('xplus_0x').value = "...";
    document.getElementById('xplus_0y').value = "...";
    document.getElementById('xplus_0z').value = "...";
    document.getElementById('xplus_180x').value = "...";
    document.getElementById('xplus_180y').value = "...";
    document.getElementById('xplus_180z').value = "...";
    document.getElementById('xminus_0x').value = "...";
    document.getElementById('xminus_0y').value = "...";
    document.getElementById('xminus_0z').value = "...";
    document.getElementById('xminus_180x').value = "...";
    document.getElementById('xminus_180y').value = "...";
    document.getElementById('xminus_180z').value = "...";
    document.getElementById('yplus_0x').value = "...";
    document.getElementById('yplus_0y').value = "...";
    document.getElementById('yplus_0z').value = "...";
    document.getElementById('yplus_180x').value = "...";
    document.getElementById('yplus_180y').value = "...";
    document.getElementById('yplus_180z').value = "...";
    document.getElementById('yminus_0x').value = "...";
    document.getElementById('yminus_0y').value = "...";
    document.getElementById('yminus_0z').value = "...";
    document.getElementById('yminus_180x').value = "...";
    document.getElementById('yminus_180y').value = "...";
    document.getElementById('yminus_180z').value = "...";
    document.getElementById('zplus_0x').value = "...";
    document.getElementById('zplus_0y').value = "...";
    document.getElementById('zplus_0z').value = "...";
    document.getElementById('zplus_180x').value = "...";
    document.getElementById('zplus_180y').value = "...";
    document.getElementById('zplus_180z').value = "...";
    document.getElementById('zminus_0x').value = "...";
    document.getElementById('zminus_0y').value = "...";
    document.getElementById('zminus_0z').value = "...";
    document.getElementById('zminus_180x').value = "...";
    document.getElementById('zminus_180y').value = "...";
    document.getElementById('zminus_180z').value = "...";
});

// Get the close button element
const closeMagPopupTwoBtn = document.getElementById('previousPopupButton');
// Add a click event listener to the close button
closeMagPopupTwoBtn.addEventListener('click', () => {
    // Remove the "visible" class from the popup container to slide it out
    popupTwoMagContainer.classList.remove('visible');
});

// Get the close button element
const closeMagPopupThreeBtn = document.getElementById('closeThirdPopup');
closeMagPopupThreeBtn.addEventListener('click', () => {
    popupThreeMagContainer.classList.remove('visible');
});

// Get the close button element
const closeMagPopupFourBtn = document.getElementById('closeFourthPopup');
closeMagPopupFourBtn.addEventListener('click', () => {
    popupFourMagContainer.classList.remove('visible');
}
);

const closeMagPopupFiveBtn = document.getElementById('closeFifthPopup');
closeMagPopupFiveBtn.addEventListener('click', () => {
    popupFiveMagContainer.classList.remove('visible');
}
);

const closeMagPopupSixBtn = document.getElementById('closeSixthPopup');
closeMagPopupSixBtn.addEventListener('click', () => {
    popupSixMagContainer.classList.remove('visible');
}
);

const closeFinalPopupBtn = document.getElementById('calculateSaveBtn');
closeFinalPopupBtn.addEventListener('click', () => {
    popupSixMagContainer.classList.remove('visible');
    popupFiveMagContainer.classList.remove('visible');
    popupFourMagContainer.classList.remove('visible');
    popupThreeMagContainer.classList.remove('visible');
    popupTwoMagContainer.classList.remove('visible');
    popupMagContainer.classList.remove('visible');

    document.getElementById('xplus_0x').value = "...";
    document.getElementById('xplus_0y').value = "...";
    document.getElementById('xplus_0z').value = "...";
    document.getElementById('xplus_180x').value = "...";
    document.getElementById('xplus_180y').value = "...";
    document.getElementById('xplus_180z').value = "...";
    document.getElementById('xminus_0x').value = "...";
    document.getElementById('xminus_0y').value = "...";
    document.getElementById('xminus_0z').value = "...";
    document.getElementById('xminus_180x').value = "...";
    document.getElementById('xminus_180y').value = "...";
    document.getElementById('xminus_180z').value = "...";
    document.getElementById('yplus_0x').value = "...";
    document.getElementById('yplus_0y').value = "...";
    document.getElementById('yplus_0z').value = "...";
    document.getElementById('yplus_180x').value = "...";
    document.getElementById('yplus_180y').value = "...";
    document.getElementById('yplus_180z').value = "...";
    document.getElementById('yminus_0x').value = "...";
    document.getElementById('yminus_0y').value = "...";
    document.getElementById('yminus_0z').value = "...";
    document.getElementById('yminus_180x').value = "...";
    document.getElementById('yminus_180y').value = "...";
    document.getElementById('yminus_180z').value = "...";
    document.getElementById('zplus_0x').value = "...";
    document.getElementById('zplus_0y').value = "...";
    document.getElementById('zplus_0z').value = "...";
    document.getElementById('zplus_180x').value = "...";
    document.getElementById('zplus_180y').value = "...";
    document.getElementById('zplus_180z').value = "...";
    document.getElementById('zminus_0x').value = "...";
    document.getElementById('zminus_0y').value = "...";
    document.getElementById('zminus_0z').value = "...";
    document.getElementById('zminus_180x').value = "...";
    document.getElementById('zminus_180y').value = "...";
    document.getElementById('zminus_180z').value = "...";
});

//==========================================================================================

//Event listener for 'Change Device' button click
//Disconnects the connected device and redirects user to device dashboard
document.getElementById("exit").addEventListener("click", (event) => {
    _connection.send('disconnect', info, result => {
        enableButtons(emptyArray);
        document.getElementById('numDevicesConnected').innerHTML = "0 devices connected";
        
        //Adding Device - 17:

        selected1 = false;
        selected2 = false;
        selected3 = false;
        selected4 = false;
        selected5 = false;
        downloadsList = [];
        emptyArray = [];
        newDownloadsList = [];
        info = null;
        navx2_mxp_index = null;
        navx2_mxp_index2 = null;
        navx2_mxp_index3 = null;
        navxmicro_index = null;
        navxmicro_index2 = null;
        navxmicro_index3 = null;
        vmxpi_index = null;
        vmxpi_index2 = null;
        vmxpi_index3 = null;
        selected_update_path = null;
        selected_device_index = null;
        selected_device_name = null;
        selected_file = null;
        download_url = null;
        path_length = null;
        yawval = null;
        plus90values = [5];
        minus90values = [5];
        update_info = null;
        versions = null;
        x_matrix = [];
        y_matrix = [];
        z_matrix = [];
        bias_matrix = [];
        pitchval = null;
        rollval = null;

        document.getElementById('liverollval').innerHTML = "0";
        document.getElementById('livepitchval').innerHTML = "0";
        document.getElementById('liveyawval').innerHTML = "0";
        document.getElementById('accelx').innerHTML = "0";
        document.getElementById('accely').innerHTML = "0";
        document.getElementById('accelz').innerHTML = "0";
        document.getElementById('navaccelrange').innerHTML = "0";
        document.getElementById('navgyrorange').innerHTML = "0";
        document.getElementById('heading').innerHTML = "0";
        document.getElementById('temp').innerHTML = "0";
        resetRender();

        //Adding Downloads - 10:

        for (let i = 0; i < 14; i++) {  //only change argument for this for loop
            var download = "download";
            download += (i + 1);
            document.getElementById(download).innerHTML = "";
        }

        document.getElementById('manufactureText').innerHTML = "---";
        document.getElementById('modelText').innerHTML = "---";
        document.getElementById('versionText').innerHTML = "---";

        document.getElementById('LinearInput').value = 0;
        document.getElementById('RotationInput').value = 0;
        document.getElementById('MagInput').value = 0;
        document.getElementById('GyroInput').value = 0;
        document.getElementById('AccelInput').value = 0;
        document.getElementById('MaxGyroInput').value = 0;

        document.getElementById('stepone_plus90').value = "...";   
        document.getElementById('stepone_minus90').value = "...";   
        document.getElementById('steptwo_plus90').value = "...";   
        document.getElementById('steptwo_minus90').value = "...";   
        document.getElementById('stepthree_plus90').value = "...";   
        document.getElementById('stepthree_minus90').value = "...";   
        document.getElementById('stepfour_plus90').value = "...";   
        document.getElementById('stepfour_minus90').value = "...";   
        document.getElementById('stepfive_plus90').value = "...";   
        document.getElementById('stepfive_minus90').value = "...";   

        uiTabVisible.classList.remove('visible');
        firmwareTabVisible.classList.remove('visible');
        deviceTabVisible.classList.remove('visible');
        magTabVisible.classList.remove('visible');
        deviceInfoVisible.classList.remove('visible');
        dashboardVisible.classList.add('visible');

        document.getElementById('yawValue').innerHTML = "---";
        document.getElementById('yawValue2').innerHTML = "---";
        document.getElementById('yawValue3').innerHTML = "---";
        document.getElementById('yawValue4').innerHTML = "---";
        document.getElementById('yawValue5').innerHTML = "---";
        rotateImage(0);

        document.getElementById('accelCalQuality').src = "./img/waiting.gif";
        document.getElementById('accelCalState').src = "./img/waiting.gif";
        document.getElementById('accelCalStateLabel').innerHTML = "";
        document.getElementById('accelCalQualityLabel').innerHTML = "";

        document.getElementById('M11').value = 0;
        document.getElementById('M12').value = 0;
        document.getElementById('M13').value = 0;
        document.getElementById('M21').value = 0;
        document.getElementById('M22').value = 0;
        document.getElementById('M23').value = 0;
        document.getElementById('M31').value = 0;
        document.getElementById('M32').value = 0;
        document.getElementById('M33').value = 0;
        document.getElementById('bias1').value = 0;
        document.getElementById('bias2').value = 0;
        document.getElementById('bias3').value = 0

        document.getElementById('xplus_0x').value = "...";
        document.getElementById('xplus_0y').value = "...";
        document.getElementById('xplus_0z').value = "...";
        document.getElementById('xplus_180x').value = "...";
        document.getElementById('xplus_180y').value = "...";
        document.getElementById('xplus_180z').value = "...";
        document.getElementById('xminus_0x').value = "...";
        document.getElementById('xminus_0y').value = "...";
        document.getElementById('xminus_0z').value = "...";
        document.getElementById('xminus_180x').value = "...";
        document.getElementById('xminus_180y').value = "...";
        document.getElementById('xminus_180z').value = "...";
        document.getElementById('yplus_0x').value = "...";
        document.getElementById('yplus_0y').value = "...";
        document.getElementById('yplus_0z').value = "...";
        document.getElementById('yplus_180x').value = "...";
        document.getElementById('yplus_180y').value = "...";
        document.getElementById('yplus_180z').value = "...";
        document.getElementById('yminus_0x').value = "...";
        document.getElementById('yminus_0y').value = "...";
        document.getElementById('yminus_0z').value = "...";
        document.getElementById('yminus_180x').value = "...";
        document.getElementById('yminus_180y').value = "...";
        document.getElementById('yminus_180z').value = "...";
        document.getElementById('zplus_0x').value = "...";
        document.getElementById('zplus_0y').value = "...";
        document.getElementById('zplus_0z').value = "...";
        document.getElementById('zplus_180x').value = "...";
        document.getElementById('zplus_180y').value = "...";
        document.getElementById('zplus_180z').value = "...";
        document.getElementById('zminus_0x').value = "...";
        document.getElementById('zminus_0y').value = "...";
        document.getElementById('zminus_0z').value = "...";
        document.getElementById('zminus_180x').value = "...";
        document.getElementById('zminus_180y').value = "...";
        document.getElementById('zminus_180z').value = "...";

        document.getElementById("deviceDashboard").click();
        
        popupAccelContainer.classList.remove('visible');

        popupSixMagContainer.classList.remove('visible');
        popupFiveMagContainer.classList.remove('visible');
        popupFourMagContainer.classList.remove('visible');
        popupThreeMagContainer.classList.remove('visible');
        popupTwoMagContainer.classList.remove('visible');
        popupMagContainer.classList.remove('visible');

        popupFusionContainerFive.classList.remove('visible');
        popupFusionContainerFour.classList.remove('visible');
        popupFusionContainerThree.classList.remove('visible');
        popupFusionContainerTwo.classList.remove('visible');
        popupFusionContainer.classList.remove('visible');
    });
    
});

//-------------------------------------------Guided Tour--------------------------------------

const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: {
        enabled: true
      },
      classes: 'sheppard-theme-arrows'
    }
  });
  
  tour.addStep({
    title: 'Welcome to Studica Robotics Desktop App',
    text: `We have updated our all apps and combined everything into one app.`,
    attachTo: {
      element: '.homepageHeader',
      on: 'bottom'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.next();
        },
        text: 'Next'
      }
    ],
    id: 'creating',
    // Hide the default overlay
    showOverlay: false
  });
  

  tour.addStep({
    title: 'Click Here to start!',
    text: `To begin, please click scan for available devices and then <b> click the device that pops up </b>.`,
    attachTo: {
      element: '.scanDeviceBtn',
      on: 'right'
    },
    buttons: [
      {
        action() {
          return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Back'
      },
      {
        action() {
          return this.complete();
        },
        text: 'Complete'
      }
    ],
    id: 'creating',
    // Hide the default overlay
    showOverlay: false
  });

  tour.on('show', function() {
    // Add the dark background class to the body element
    document.body.classList.add('shepherd-dark-background');
  });

  tour.on('next', function() {
    // Add the dark background class to the body element
    document.body.classList.add('shepherd-dark-background');
  });
  
  tour.on('hide', function() {
    // Remove the dark background class from the body element
    document.body.classList.remove('shepherd-dark-background');
  });
  
  tour.on('complete', function() {
    // Remove the dark background class from the body element when the tour is complete
    document.body.classList.remove('shepherd-dark-background');
  });
  
  tour.on('cancel', function() {
    // Remove the dark background class from the body element when the tour is cancelled
    document.body.classList.remove('shepherd-dark-background');
  });

 
firmwareTour = document.getElementById('firmwareTab');

firmwareTour.addEventListener('click', () => {


    if (tourEnabled && tour.getCurrentStep()) {
        const tour = new Shepherd.Tour({
            defaultStepOptions: {
                cancelIcon: {
                  enabled: true
                },
                classes: 'sheppard-theme-arrows'
              },
          steps: [
            {
              id: 'FirmwareMain',
              title: 'Welcome to Firmware Updater Tab',
              text: `Here you can update the firmware of your device`,
              attachTo: {
                element: '.firmwareHeader',
                on: 'right'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.next();
                  },
                  text: 'Next'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            },
            {
              id: 'Available Downloads',
              title: 'Available Downloads Directory',
              text: `Click here to load any available downloads for your device and then select the preferrerd downloads from the list`,
              attachTo: {
                element: '.loadFirmwareBtn',
                on: 'left'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.next();
                  },
                  text: 'Next'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            },
            {
                id: 'load manual',
                title: 'Access other firmware here',
                text: `Use this to open your manually saved firmware version`,
                attachTo: {
                  element: '#loadManualFilesBtn',
                  on: 'left'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.next();
                    },
                    text: 'Next'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },
            {
                id: 'open folder',
                title: 'Open Folder',
                text: `Use this to open your personal directory folders to select a different firmware`,
                attachTo: {
                  element: '#openFileExplorer',
                  on: 'top'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.next();
                    },
                    text: 'Next'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },
            {
                id: 'delete',
                title: 'Delete Firmware',
                text: `Use this button to delete a specific firmware for your device`,
                attachTo: {
                  element: '#deleteFileBtn',
                  on: 'top'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.next();
                    },
                    text: 'Next'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },
            {
              id: 'Process Section',
              title: 'Stuck on what to do?',
              text: `Here you can see the steps for this page to download a firmware update for your device`,
              attachTo: {
                element: '.processSection',
                on: 'top'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.complete();
                  },
                  text: 'Complete'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            }
          ],
        });
      
        // Add the dark background class to the body element when the tour is shown
        tour.on('show', function() {
          document.body.classList.add('shepherd-dark-background');
        });
      
        // Remove the dark background class from the body element when the tour is hidden
        tour.on('complete', function() {
          document.body.classList.remove('shepherd-dark-background');
        });
      
        tour.on('cancel', function() {
            // Remove the dark background class from the body element when the tour is cancelled
            document.body.classList.remove('shepherd-dark-background');
          });

        // Start the tour automatically
        tour.start();
      }
      
});

deviceConfigTour = document.getElementById('deviceTab');

deviceConfigTour.addEventListener('click', () => {
    if (tourEnabled && tour.getCurrentStep()) {
        const tour = new Shepherd.Tour({
            defaultStepOptions: {
                cancelIcon: {
                  enabled: true
                },
                classes: 'sheppard-theme-arrows'
              },
          steps: [
            {
              id: 'DeviceMain',
              title: 'Welcome to Device Configuration Tab',
              text: `The navXConfig Tool is used to modify certain navX-sensor settings which impact the behavior of certain navX-sensor algorithms. `,
              attachTo: {
                element: '.deviceConfigMainheader',
                on: 'right'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.next();
                  },
                  text: 'Next'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            },
            {
              id: 'Accelerometer Calibration',
              title: 'Accelerometer Calibration Section',
              text: `Click here to calibrate the accelerometer for your device`,
              attachTo: {
                element: '.accelButton',
                on: 'top'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.next();
                  },
                  text: 'Next'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            },
            {
                id: 'Sensor Calibration',
                title: 'Sensor Fusion Calibration Section',
                text: `Click here to calibrate the sensor fusion tool for your device`,
                attachTo: {
                  element: '.sensorFusionButton',
                  on: 'top'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.complete();
                    },
                    text: 'Complete'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            }
          ],
        });
      
        // Add the dark background class to the body element when the tour is shown
        tour.on('show', function() {
          document.body.classList.add('shepherd-dark-background');
        });
      
        // Remove the dark background class from the body element when the tour is hidden
        tour.on('complete', function() {
          document.body.classList.remove('shepherd-dark-background');
        });
      
        tour.on('cancel', function() {
            // Remove the dark background class from the body element when the tour is cancelled
            document.body.classList.remove('shepherd-dark-background');
          });

        // Start the tour automatically
        tour.start();
      }
      

});


magCalibTour = document.getElementById('magTab');

magCalibTour.addEventListener('click', () => {
    if (tourEnabled && tour.getCurrentStep()) {
        const tour = new Shepherd.Tour({
            defaultStepOptions: {
                cancelIcon: {
                  enabled: true
                },
                classes: 'sheppard-theme-arrows'
              },
          steps: [
            {
              id: 'MagMain',
              title: 'Welcome to Magnetometer Calibration Tab',
              text: `The navXMagCalibrator tool is used to calibrate the navX-Sensor magnetometer. `,
              attachTo: {
                element: '.mag-header-main',
                on: 'right'
              },
              buttons: [
                {
                  action() {
                    return this.back();
                  },
                  classes: 'shepherd-button-secondary',
                  text: 'Back'
                },
                {
                  action() {
                    return this.next();
                  },
                  text: 'Next'
                }
              ],
              // Hide the default overlay
              showOverlay: false
            },
       
            {
                id: 'Matrix save values',
                title: 'Magetometer Save Matrix Values',
                text: `Click here to save the values calculated by the transformation matrix`,
                attachTo: {
                  element: '.saveValuesBtn',
                  on: 'left'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.next();
                    },
                    text: 'Next'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },
            {
                id: 'Matrix retrieve values',
                title: 'Magetometer Matrix Retrieve Values',
                text: `Click here to retrieve previously saved values calculated by the transformation matrix`,
                attachTo: {
                  element: '.retrieveValuesBtn',
                  on: 'bottom'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.next();
                    },
                    text: 'Next'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },           
            {
                id: 'Calculate Matrix Here',
                title: 'Calculate the Magnetometer Here',
                text: `Click here to begin the calibration process`,
                attachTo: {
                  element: '.calculateMatrixBtn',
                  on: 'top'
                },
                buttons: [
                  {
                    action() {
                      return this.back();
                    },
                    classes: 'shepherd-button-secondary',
                    text: 'Back'
                  },
                  {
                    action() {
                      return this.complete();
                    },
                    text: 'Complete'
                  }
                ],
                // Hide the default overlay
                showOverlay: false
            },
          ],
        });
      
        // Add the dark background class to the body element when the tour is shown
        tour.on('show', function() {
          document.body.classList.add('shepherd-dark-background');
        });
      
        // Remove the dark background class from the body element when the tour is hidden
        tour.on('complete', function() {
          document.body.classList.remove('shepherd-dark-background');
        });
      
        tour.on('cancel', function() {
            // Remove the dark background class from the body element when the tour is cancelled
            document.body.classList.remove('shepherd-dark-background');
          });

        // Start the tour automatically
        tour.start();
      }

});

  
//============================================NAVXUI========================================

//Need to add three.js file into project folder for this to work, and need to reference it in HTML

// Define the container for the 3D object
const container = document.getElementById('image-container');

// Define the renderer
const renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
render.alpha = true;
container.appendChild(renderer.domElement);

// Define the camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 25);
camera.rotation.set(0,0,0);

// Define the scene
const scene = new THREE.Scene();
//scene.background = new THREE.Color( 0xEEEEEE );
//scene.add(new THREE.GridHelper(35, 35));

// Define Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10,20,10);
directionalLight.castShadow = true;
scene.add(directionalLight);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight2.position.set(-10,-20,-10);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight3.position.set(-1,5,1);
directionalLight3.castShadow = true;
//scene.add(directionalLight3);

const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight4.position.set(-10,20,10);
directionalLight4.castShadow = true;
scene.add(directionalLight4);

//scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
//scene.add(new THREE.CameraHelper(directionalLight2.shadow.camera));
//scene.add(new THREE.CameraHelper(directionalLight3.shadow.camera));
//scene.add(new THREE.CameraHelper(directionalLight4.shadow.camera));


// const light = new THREE.AmbientLight( 0x404040 ); // soft white light
// scene.add( light );

//----------------------------- Plane Geometry: -------------------------------------

//Body geometry
// const geometry = new THREE.BoxGeometry(1.5, 1.5, 24, 2, 2, 2);
// const material = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true, wireframeLinewidth: 200});
// const object = new THREE.Mesh(geometry, material);
// scene.add(object);// Define the vertices of the airplane shape
// scene.add(object);

// //Wings geometry
// const geometry2 = new THREE.BoxGeometry(18, 3, 3, 2, 2, 2);
// const material2 = new THREE.MeshBasicMaterial({color: 0x0000FF, wireframe: true, wireframeLinewidth: 200}); //wireframe: true, wireframeLinewidth: 200
// const object2 = new THREE.Mesh(geometry2, material2);
// object2.position.set(0,0,-1);
// scene.add(object2);// Define the vertices of the airplane shape

// //Nose geometry
// const geometry3 = new THREE.CylinderGeometry(0, 3, 6, 4, 1);
// const material3 = new THREE.MeshBasicMaterial({color: 0x00FF00, wireframe: true, wireframeLinewidth: 200});
// const object3 = new THREE.Mesh(geometry3, material3);
// object3.position.set(0,0,-15);
// object3.rotation.set(-1.5, -0.80, 0.10);
// scene.add(object3);// Define the vertices of the airplane shape

// //Tail geometry
// const geometry4 = new THREE.CylinderGeometry(0.5, 0.5, 3, 10, 1);
// const material4 = new THREE.MeshBasicMaterial({color: 0x0d0d0d, wireframe: true, wireframeLinewidth: 200});
// const object4 = new THREE.Mesh(geometry4, material4);
// object4.position.set(0,2,11);
// //object4.rotation.set(-1.5, -0.80, 0.10);
// scene.add(object4);// Define the vertices of the airplane shape

//-----------------------------Robot Geometry:--------------------------------

//Robot Body
const geometry = new THREE.BoxGeometry(15, 4, 10, 2, 2, 2);
const material = new THREE.MeshStandardMaterial({color:0x316AC8, wireframe: false,  wireframeLinewidth: 200});

//const texturee = new THREE.MeshBasicMaterial( {map: texture});
const object = new THREE.Mesh(geometry, material);
object.receiveShadow = true;
object.castShadow = true;
object.position.set(0,0,6);
scene.add(object);
scene.add(object);

//Robot Body - Right Arm
const geometry2 = new THREE.BoxGeometry(3, 4, 11, 2, 2, 2);
const material2 = new THREE.MeshStandardMaterial({color:0x316AC8, wireframe: false, wireframeLinewidth: 200});
const object2 = new THREE.Mesh(geometry2, material2);
object2.receiveShadow = true;
object2.castShadow = true;
object2.position.set(6,0,-4.5);
scene.add(object2);
scene.add(object2);

//Robot Body - Left Arm
const geometry3 = new THREE.BoxGeometry(3, 4, 11, 2, 2, 2);
const material3 = new THREE.MeshStandardMaterial({color:0x316AC8, wireframe: false, wireframeLinewidth: 200});
const object3 = new THREE.Mesh(geometry3, material3);
object3.receiveShadow = true;
object3.castShadow = true;
object3.position.set(-6,0,-4.5);
scene.add(object3);
scene.add(object3);

//Rear Right Wheel
const geometry4 = new THREE.CylinderGeometry(3, 3, 2, 30, 1);
const material4 = new THREE.MeshStandardMaterial({color: 0x606060, wireframe: false, wireframeLinewidth: 200});
const object4 = new THREE.Mesh(geometry4, material4);
object4.receiveShadow = true;
object4.castShadow = true;
object4.position.set(8.5,0,8);
object4.rotation.set(0,0,1.55);
scene.add(object4);

//Rear Left Wheel
const geometry5 = new THREE.CylinderGeometry(3, 3, 2, 30, 1);
const material5 = new THREE.MeshStandardMaterial({color: 0x606060, wireframe: false, wireframeLinewidth: 200});
const object5 = new THREE.Mesh(geometry5, material5);
object5.receiveShadow = true;
object5.castShadow = true;
object5.position.set(-8.5,0,8);
object5.rotation.set(0,0,1.55);
scene.add(object5);

//Forward Right Wheel
const geometry6 = new THREE.CylinderGeometry(3, 3, 2, 30, 1);
const material6 = new THREE.MeshStandardMaterial({color: 0x606060, wireframe: false, wireframeLinewidth: 200});
const object6 = new THREE.Mesh(geometry6, material6);
object6.receiveShadow = true;
object6.castShadow = true;
object6.position.set(8.5,0,-7);
object6.rotation.set(0,0,1.55);
scene.add(object6);

//Forward Left Wheel
const geometry7 = new THREE.CylinderGeometry(3, 3, 2, 30, 1);
const material7 = new THREE.MeshStandardMaterial({color: 0x606060, wireframe: false, wireframeLinewidth: 200});
const object7 = new THREE.Mesh(geometry7, material7);
object7.receiveShadow = true;
object7.castShadow = true;
object7.position.set(-8.5,0,-7);
object7.rotation.set(0,0,1.55);
scene.add(object7);

function getUIValues(){
    _connection.send('uivalues', info, result => {});
}

function stopUI(){
    _connection.send('stopui', info, result => {});
}

function resetRender(){
    scene.rotation.set(0,0,0);
}

_connection.on('yawval2', result => {
    yawval = result;
    document.getElementById('liveyawval').innerHTML = parseFloat(yawval).toFixed(2);
});

_connection.on('pitchval', result => {
    pitchval = result;
    if (selected_device_name == "vmxpi"){
        document.getElementById('livepitchval').innerHTML = pitchval;
    }
    else{
        document.getElementById('livepitchval').innerHTML = -(parseFloat(rollval)).toFixed(2);
    }
});

_connection.on('rollval', result =>{
    rollval = result;

    //Adding Device - 18:

    if(selected_device_name == "vmxpi"){
        document.getElementById('liverollval').innerHTML = -rollval;
        scene.rotation.set(pitchval/(3.14*15),-yawval/(3.14*15),rollval/(3.14*15),'YXZ');
    }
    else{
        document.getElementById('liverollval').innerHTML = -pitchval;
        scene.rotation.set(-rollval/(3.14*15),-yawval/(3.14*15),pitchval/(3.14*15),'YXZ');
    }
});

// Add event listeners to the buttons
document.getElementById('start-button').addEventListener('click', getUIValues);
document.getElementById('stop-button').addEventListener('click', stopUI);
document.getElementById('reset-button').addEventListener('click', resetYaw);

// Define the render function
function render() {

requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// Call the render function
render();
