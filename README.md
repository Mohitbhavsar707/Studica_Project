# Studica App

Demo of the app: https://drive.google.com/file/d/1OBS3okU0siSYTH0IKiy4boLocQ97KGK_/view?usp=drive_link

## Running the App

Download the repository and run the following commands in the windows terminal to start the application.

```
npm install
```

```
npm start
```

If the app does not run due to missing dependencies, try manually installing each as follows:  

```
npm install download
```

```
npm install shepherd.js
```

```
npm install sweetalert2
```

```
npm install mousetrap
```

```
npm install --save-dev @electron-forge/cli
```

```
npm install electron-cgi
```

```
npm start
```

## Packaging the App

Refer to the documentation for detailed instructions on how to package the app, specifically, what lines to comment out/add to the code. The commands used to package the app include the following:

This line packages the app with the target architecture as the default host architecture.  
```
npm run make
```  
  
This line packages the app with the target architecture as ia32. Supported architectures as per electron-forge: "ia32", "x64", "armv7l", "arm64", "universal", or "mips64el". This project has only been tested with "ia32" and "x64" as of v5.6.8.   
```
npm run make -- --arch=ia32
```

# Changelog  
## Version 5.7.5      
Changes:    
-Big fixes for Device Config   
-Added comments   
  
## Version 5.7.4      
Changes:   
-Increased download list capacity  
-Added comments  
   
## Version 5.7.3      
Changes:   
-Connected 'Get' button to backend on MagCal popups   
-Added error handling for device config values and S.F. ratio    
-Fixed issue with files not being displayed in correct order F.U.  
  
## Version 5.7.0     
Changes:   
-Added more comments to rederer.js and program.cs  
-Compiled/published program.cs    
  
## Version 5.6.9    
Changes:   
-Added auto-close pop-up functionality on tab click  
-Added dark mode  
  
## Version 5.6.8    
Changes:   
-Added comments to renderer.js, index.html, and index.css outlining steps to add a new device   
-Fixed minor styling issues  
  
## Version 5.6.7    
Changes:   
-Adding comments to renderer.js  
   
## Version 5.6.6  
Changes:   
-Added close tabs functionality on device change button press    
-Bug fix for S.F. reset yaw functionality  
  
## Version 5.6.5  
Changes:   
-Merge fixes  
-Fixed styling issues with navxui page on different screen resolutions  
-Added N,E,S,W, etc. labels for heading card  
  
## Version 5.6.2  
Changes:   
-Bug fixes for F.U. release build     
-Added new data for navxui page, connected backend with frontend  

  
## Version 5.6.1  
Changes:   
-Merge bug fixes  
  
## Version 5.6.0  
Changes:   
-Bugs fixed for tour and the dfu mode     
  
## Version 5.5.4  
Changes:  
-Fixed tour popup and added toggle functionality  
-Redeveloped the ui page section  
  
## Version 5.5.3  
Changes:  
-Minor bug fixes with F.U. and Device Config  
  
## Version 5.5.2      
Changes:   
-Added automatic DFU device detection  
&emsp;-Added pop-up to select device  
-Added manually load update file through directory functionality  
-Fixed bug with pop-up in F.U.  
-Fixed bug with S.F. icons  
-Added more error handling around landing page  
   
## Version 5.5.1      
Changes:   
-Added error handling around landing page  
-Fixed lighting issue with 3D render   
  
## Version 5.5.0 (commit name: 5.3.0)     
Changes:   
-Added capability to record sensor fusion calibration data and export it to an excel file  
-Writing to excel file can be toggled on/off by a key shortcut: __Ctrl+Shift+e__    
   
## Version 5.4.2     
Changes:  
-Merging changes  
-Added improvements to frontend   
-Fixed bugs with F.U.   
   
## Version 5.4.1   
Changes:  
-Added minor improvements to 'Change Device' functionality  
-Fixed inconsistency issue with 'Next' button in S.F. page  
-Minor styling changes for live value displays  
  
## Version 5.4.0   
Changes:  
-Changed navXUI frontend appearence  
-Added loading screen on app startup   
-Added auto toggle tab functionality:   
&emsp;-Device Dashboard tab dissapears upon device selection   
&emsp;-User is automatically directed to the navXUI tab upon device selection  
&emsp;-User is automatically directed to the Device Dashboard tab upon clicking 'Change Device'   
&emsp;-Other tabs dissapear and Device Dashboard re-appears  
  
## Version 5.3.1   
Changes:  
-Fixed movement calculations to correctly represent pitch when yaw is at ~ +/-80    
-Added a timeout to handle errors with gathering information on connected devices  

## Version 5.3.0   
Changes:  
-Fixed minor bug with F.U. regarding array indices  
-Added error handling for F.U. when device if offline  
-Modified navXUI model axes according to each device  
-Changed the 3D model to appear as a Studica Robot  
  
Issues:   
-Model movement calculations need to be fixed for certain movements  
    
## Version 5.2.1   
Changes:  
-Fixed issue with .JSON not being read upon app startup  
-Added compatability for more than one board of the same type connected  
-Added live display for yaw, pitch, and roll values in navXUI  
  
## Version 5.2.0   
Changes:  
-Added 'Save to Device' functionality for MagCal matrix calculation  
-Added 'Retrieve from Device' functionality for MagCal matrix    
   
## Version 5.1.2    
Changes:  
-Improved 3D model to resemble an airplane   
   
## Version 5.1.1    
Changes:  
-Attempted to implement a 3D Model using different approaches (Three.JS, P5.JS, Babylon.JS)  
-Current working model is implemented through Three.JS      
  
Issues:  
-Need to improve 3D render appearence  
  
## Version 5.1.0    
Changes:  
-Implemented functional 3D model that visualizes live pitch, roll, and yaw changes  
  
Issues:  
-Need to fix rotation calculations to make them match device more accurately   
  
## Version 5.0.0    
Changes:  
-Added 3D visualization for navXUI (currently only works with live yaw value)  
-Minor styling improvements, added more cursor feedback throughout different application processes  
  
## Version 4.1.0    
Changes:  
-Extend device compatability for F.U.  
-Added functionality to only enable pop-up when there two or more updates available    
-Added 2D visualization for live yaw value in S.F.  
-Automated the 'Reset Yaw' functionality to run when the forward arrow is clicked  
## Version 4.0.0    
Changes:  
-Added matrix calculation functionality  
-Completed functional MagCal implementation  
  
Issues:  
-Need to add another button to record the value to allow for user input changes  
## Version 3.7.2  
Changes:  
-Implemented functionality to get X, Y, Z axes data from backend and display it on frontend  
## Version 3.7.1   
Changes:   
-Established a backend and frontend connection for the MagCal implementation  
  
## Version 3.7.0   
Changes:   
-Added multi-select download functionality  
-Added 'Reset Yaw' functionality  
-Minor bug fixes with merge  
  
Issues:   
-Need to extend F.U. features to other devices  
  
## Version 3.6.4  
Changes:   
-Added update names to the pop-up in firmwware update page 
-Added ability to select/deselect from the list   
  
## Version 3.6.3  
Changes:  
-Fixed major bugs to sensor fusion and tab 4 section  
  
## Version 3.6.2  
Changes:   
-Added firmware updater popup  
-Fixed board info popup functionality  
-Fixed Mag page popups  
-Created sensor fusion popups  
-Note(caused lots of bugs after push due to merge error)  
    
## Version 3.6.1   
Changes:  
-Started implementation for multi-select update download  
-Added functionality in backend to check and compare local directory with all files in C.D.N. directory  
  
## Version 3.6.0  
Changes:   
-Implemented and connected 5-step process frontend with backend   
-Added gyro scale factor ratio calculation functionality  
  
Issues:  
-Currently no way to reset yaw through application  
  
## Version 3.5.4  
Changes:  
-Minor styling changes  
-Implemented hidden board info functionality  
  
## Version 3.5.3  
Changes:  
-Added a functional multi-page frontend for sensor fusion calibration  
-Implemented functionality to store +/- values for sensor fusion  
  
## Version 3.5.2  
Changes:  
-Added delete update file functionality for firmware update page  
-Downloads are now listed in reverse chronological order  
  
## Version 3.5.1  
Changes:  
-Started sensor fusion calibration implementation  
-Set up frontend and backend connections    
-Implemented dynamic yaw value display  
  
## Version 3.5.0  
Changes:  
-Fixed minor bugs with from merging branches  
-Improved Accelerometer Calibration page  
-Implemented accelerometer calibration functionality  
  
## Version 3.4.0  
Changes:
-Fixed Mag page and added sliding tabs transformation/animations  
-Added About Page  
-Added JS code to disable/enable tabs visibility based on device clicked  
## Version 3.3.2   
Changes:  
-Fixed directory issues for update functionality  
-Started accelerometer calibration implementation  
  
## Version 3.3.1  
Changes:   
-Added 'Reset' functionality in the device configuration page for each card  
-Now upon board selection, configuration values from the board will be automatically displayed in device configuration cards  
  
## Version 3.3.0  
Changes:  
-Merge changes   
-Connected app to Studica C.D.N. to access Available.JSON
-Added automatic new update check functionality    
  
Issues:  
-Directory for new update downloads needs to be fixed  
   
## Version 3.2.1  
Changes:  
-Merge changes   
  
## Version 3.2.0  
Changes:  
-Added offline support for help and support documents  
  
## Version 3.1.0  
Changes:  
-Added error handling for update process  
-Added hover and select functionality for firmware update page  
-Implemented 'set' functionality for max gyro error on device config page  
  
## Version 3.0.0  
Changes:  
-Finished firmware updater implementation    
-Implemented device configuration final frontend design  
-Integrated a functional backend for the 'SET' functionality  
-Added pop-up alerts to inform user of any errors in the process  
   
Issues:   
-Need to implement 'check for new update' functionality   
-'Max Gyro Error' functionality not working   
-Need to implement 'Reset' functionality  
-Need to implement Accelerometer and Sensor Fusion Calibration functionality  
-Frontend pop-up pages are slightly blurry/fuzzy  
## Version 2.1.2  
Changes:  
-Fixed bugs from merging branch  
  
## Version 2.1.1  
Changes:  
-Made improvements to firmware updater page for development purposes  
-Removed progress bar  
  
## Version 2.1.0  
Changes:  
-Implemented firmware updater backend for update functionality   
-Added pop-up alerts throughout the update process to keep user informed    
-Improved downloads list functionality to only show downloads for the selected device  
-Made minor changes to the HTML/CSS design  
  
Issues:   
-Display board information on navigation bar  
  
## Version 2.0.0  
Changes:   
-Completed landing page implementation   
-Started integrating firmware updater backend   
-Implemented display update file functionality, and display update information functionality on-click   
-Added an improved and user-friendly design for pop-up alert messages  
  
Issues:  
-Need to add update functionality  
-Display board information on navigation bar  
-Dynamically update progress bar while updating  


## Version 1.3.1  
Changes:  
-Added code for Electron-CGI to make the program compatible with the release build  
-Added minor changes to landing page labels to improve user-friendliness  
   
Issues:   
-Need to increase font size in certain sections  
-Help and support docs need to cover all the space on the page  
  
## Version 1.3.0  
Changes:  
-Improved button functionality by making buttons appear/disappear when connected/disconnected   

## Version 1.2.1  
Changes:  
-Added design changes to landing page, making sidebar non-collapsible  
-Added studica help docs in the help and support page  
-Started design implementation for firmware updater  

## Version 1.2.0  
Changes:   
-Connected frontend with backend  
-Added 'scan for devices' functionality  
-Added button toggle functionality depending on which devices are connected  
-Device buttons now obtain device information from backend (if device is connected)  
  
Issues:  
-Need to display board information on the frontend  
-Board information section in the sidebar might need to be enlarged  

## Version 1.0.1  
Changes:  
-Added device info section into sidebar   

## Version 1.0.0
Changes:  
-Set up the project  
-Implemented the landing page  
-Connected frontend components  
  
Issues:  
-Logo is covered when sidebar is collapsed  
-Landing page needs to be connected to backend  
