using System;
using System.Net;
using System.Text;
using System.Globalization;
using ElectronCgi.DotNet;
using System.IO.Ports;
using System.IO;
using navXComUtilities;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using NetDFULib;

namespace CSHARP
{
    class Program
    {
        static Object bufferLock = new Object();
        static Byte[] bytes_from_usart = null;
        static int num_bytes_from_usart = 0;
        static int bytes_from_usart_offset = 0;
        static Boolean port_close_flag;
        int empty_serial_data_counter;
        string curDir; 
        List<string> navxID = new List<string>();
        List<string> navxID_temp = new List<string>();
        List<string> navxName = new List<string>();
        string[] board_info = new string[4];
        string[] MagCalValues = new string[3];
        string[] navx_port_names = new string[5];
        SerialPort port = new SerialPort();

        int selected_device_index = 0;
        string selected_device_name = "";

        string[] navxui_values = new string[5];

        //Firmware Updater
        string full_path_to_hex_file;
        static string statusText;
        static FirmwareUpdate firmwareUpdate = new FirmwareUpdate();
        static HEX2DFU hex2dfu = new HEX2DFU();

        const UInt16 theVid = 0x0483;
        const UInt16 thePid = 0x5740;
        const UInt16 theBcd = 0x0200;

        bool port_open_in_progress = false;
        bool dialog_in_progress = false;
        bool firmware_update_registered = false;
        static Boolean update_complete = false;
        
        List<string> new_updates = new List<string>();

        //navXConfig
        //Array to store motion processing and full-scale range values

        //Index 0: Linear Motion
        //Index 1: Rotation
        //Index 2: Magnetic Disturbance
        //Index 3: Gyro Range
        //Index 4: Acceleration Range
        //Index 5: Max. Gyro Error
        string[] configValues = new string[6];

        enum CAL_CMD { CAL_CMD_START = 'S', CAL_CMD_STOP = 'P', CAL_CMD_STATUS_REQUEST = 'R', CAL_CMD_NONE = 0 };
        enum CAL_TYPE { CAL_TYPE_ACCEL = 'A', CAL_TYPE_MAGNETOMETER = 'M' };
        enum CAL_STATE { CAL_STATE_NONE = 0, CAL_STATE_INPROGRESS = 1, CAL_STATE_DONE = 2 };
        enum CAL_QUALITY { CAL_QUAL_NONE = 0, CAL_QUAL_POOR = 1, CAL_QUAL_OK = 2, CAL_QUAL_GOOD = 3 };
        enum CAL_PARAMETER { CAL_PARAM_NOTIFY = 0, CAL_PARAM_STATUS_RESPONSE = 1, CAL_PARAM_ACK = 2, CAL_PARAM_NACK = 3 };

        CAL_CMD last_accel_cal_cmd = CAL_CMD.CAL_CMD_NONE;
        CAL_CMD last_mag_cal_cmd = CAL_CMD.CAL_CMD_NONE;
        bool showing_accel_cal_error = false;
        string tuning_msg = "";
        static Boolean done_set = false;
        static Boolean calibration_done = false;
        static Boolean sensor_fusion_cal_done = false;

        string prev_state_description = "";
        string prev_state_quality = "";

        string yaw_value = "";
        StreamWriter datalog_writer = null;
        string entry = "";
        //navMagCal


        double X_serial_value, Y_serial_value, Z_serial_value;
        string symbol_mask = "1234567890.-";

#if DEBUG
        StreamWriter writer;
#endif
        Int16 last_mag_x;
        Int16 last_mag_y;
        Int16 last_mag_z;

        //Arrays to store X Y Z axes data from the 12 different measurements
        //Index 0 corresponds to X
        //Index 1 corresponds to Y
        //Index 2 corresponds to Z
        string[] xplus_0_values = new string[3];
        string[] xplus_180_values = new string[3];
        string[] xminus_0_values = new string[3];
        string[] xminus_180_values = new string[3];
        string[] yplus_0_values = new string[3];
        string[] yplus_180_values = new string[3];
        string[] yminus_0_values = new string[3];
        string[] yminus_180_values = new string[3];
        string[] zplus_0_values = new string[3];
        string[] zplus_180_values = new string[3];
        string[] zminus_0_values = new string[3];
        string[] zminus_180_values = new string[3];

        //Arrays to store transformation matrix values
        //Index 0 corresponds to X
        //Index 1 corresponds to Y
        //Index 2 corresponds to Z        
        string[] xmatrix = new string[3];
        string[] ymatrix = new string[3];
        string[] zmatrix = new string[3];
        //Array to store bias values
        //X Y Z values follow respective index 0 1 2
        string[] biasmatrix = new string[3];

        static Boolean UI_done = false;
        string pitch_value;
        string roll_value;
        
        static void Main()
        {
            
            var connection = new ConnectionBuilder().Build();

            Program test = new Program();
            
            test.curDir = System.IO.Path.GetDirectoryName(
            System.Reflection.Assembly.GetExecutingAssembly().GetModules()[0].FullyQualifiedName); //Directory
            
            //---------------------Request handlers for requests from JS frontend------------------

            connection.On<dynamic, string>("first", info =>
            {
                Console.Error.WriteLine("established");
                return "established";
            });

            //=================================Landing page requests========================================:

            //Returns board information of selected device
            connection.On<int, string[]>("info", index => 
            {
                test.prev_state_description = "";
                test.prev_state_quality = "";
                test.selected_device_index = index;
                test.selected_device_name = test.navxName[test.selected_device_index];

                var task = Task.Run(() => test.openPort(index));
                if (task.Wait(TimeSpan.FromSeconds(5))){
                    test.send_cal_command(CAL_TYPE.CAL_TYPE_ACCEL, CAL_CMD.CAL_CMD_STATUS_REQUEST);
                    Thread.Sleep(50);
                    test.var_refresh();
                    test.var_refresh();

                    //Sends status info to JS
                    string prev_state = test.prev_state_description;
                    string prev_qual = test.prev_state_quality;

                    connection.Send("calstatusstate", prev_state);    
                    connection.Send("calstatusqual", prev_qual);

                    return test.board_info;
                }
                else{
                    connection.Send("error", "Timed Out 2");
                    throw new Exception("Timed out");
                }

            });
            
            //Returns list of all connected navx devices
            connection.On<dynamic, List<String>>("name", info => 
            {
                bool dfu_device_present = navXComHelper.IsDFUDevicePresent();
                test.navxID.Clear();
                test.navxName.Clear();
                var task = Task.Run(() => test.detectCOMPort());
                if (task.Wait(TimeSpan.FromSeconds(10))){
                    connection.Send("ports", test.navx_port_names);
                    if (dfu_device_present){
                        connection.Send("dfu", true);
                    }
                    return test.navxName;
                }
                else{
                    connection.Send("error", "Timed Out 2");
                    throw new Exception("Timed out");
                }
            });  

            //======================================Firmware Updater requests================================:

            //Returns true or false depending on if new update is found
            connection.On<dynamic, string>("newUpdates", info =>
            {
                test.new_updates.Clear();
                string path = System.IO.Directory.GetCurrentDirectory(); //Directory
                if (test.selected_device_name == "navX2-MXP (Gen 2)"){
                    //path += "\\resources\\app\\Updates\\navx2-mxp"; //Release Path
                    path += "\\Updates\\navx2-mxp"; //Dev Path
                }
                else if (test.selected_device_name == "VMX-pi"){
                    //path += "\\resources\\app\\Updates\\vmx"; //Release Path
                    path += "\\Updates\\vmx"; //Dev Path
                }
                else if (test.selected_device_name == "navX2-Micro (Gen 2)"){
                    //path += "\\resources\\app\\Updates\\navx2-Micro"; //Release Path
                    path += "\\Updates\\navx2-micro"; //Dev Path
                }

                //add new device code above this line

                //Adding Device 19:

                //Template:
                // else if (test.selected_device_name == "[deviceName (as on board)]"){
                //     path += "\\resources\\app\\Updates\\[folder]"; //release
                //     //path += "\\Updates\\[folder]"; //dev
                // }
                //---------

                string[] updates_file_path = Directory.GetFiles(@path, "*.hex"); //Directory - references path above
                Console.Error.WriteLine(path);
                for (int k = 0; k < info.Count; k++){
                    string v = info[k];
                    test.new_updates.Add(v);

                    for (int i = 0; i < updates_file_path.Length; i++){
                        
                        string versionU = "";
                        KauaiLabsDfuTargetDescriptor dfu_target_desc = test.GetDfuTargetDescriptorFromHexFileName(updates_file_path[i], out versionU);
                        
                        if (info[k] == versionU){
                            
                            Console.Error.WriteLine(test.new_updates.Count);
                            Console.Error.WriteLine(versionU);

                            test.new_updates.Remove(versionU);
                            break;
                            
                        }
                    }
                }
                Console.Error.WriteLine(test.new_updates.Count);
                if (test.new_updates.Count > 0){
                    Console.Error.WriteLine(test.new_updates[0]);
                    connection.Send("newdownloads", test.new_updates);
                    return "false";

                }
                else{
                    return "true";
                }

            });

            //Stores connected device info based on user selection
            connection.On<dynamic, string>("DFUInfo", name => {
                if (name == "navx2_mxp"){
                    test.selected_device_name = "navX2-MXP (Gen 2)";
                }
                else if (name == "navx2micro"){
                    test.selected_device_name = "navX2-Micro (Gen 2)";
                }
                else if (name == "vmxpi"){
                    test.selected_device_name = "VMX-pi";
                }

                //add new device code above this line

                //Adding Device - 20:

                //Template:
                // else if (name == "[deviceName]"){
                //     test.selected_device_name = "[deviceName (as on board)]";
                // }
                //--------

                return "done";
            });

            //Returns array of file paths for available updates
            connection.On<dynamic, string[]>("updatesAvail", device =>
            {
                string path = System.IO.Directory.GetCurrentDirectory(); //Directory
                if (test.selected_device_name == "navX2-MXP (Gen 2)"){
                    //path += "\\resources\\app\\Updates\\navx2-mxp"; //Release Path
                    path += "\\Updates\\navx2-mxp"; //Dev Path
                }
                else if (test.selected_device_name == "VMX-pi"){
                    //path += "\\resources\\app\\Updates\\vmx"; //Release Path
                    path += "\\Updates\\vmx"; //Dev Path
                }
                else if (test.selected_device_name == "navX2-Micro (Gen 2)"){
                    //path += "\\resources\\app\\Updates\\navx2-Micro"; //Release Path
                    path += "\\Updates\\navx2-micro"; //Dev Path
                }

                //add new device code above this line

                //Adding Device 21:

                //Template:
                // else if (test.selected_device_name == "[deviceName (as on board)]"){
                //     path += "\\resources\\app\\Updates\\[folder]"; //release
                //     //path += "\\Updates\\[folder]"; //dev
                // }
                //---------

                connection.Send("pathlength", path.Length);
                string[] updates_file_path = Directory.GetFiles(@path, "*.hex"); //Directory - references path above
                Array.Sort(updates_file_path);
                Array.Reverse(updates_file_path);

                return updates_file_path;
            });

            //Returns array of available filepaths from manually loaded files folder
            connection.On<dynamic, string[]>("manualUpdates", device =>
            {
                string path = System.IO.Directory.GetCurrentDirectory(); //Directory
                path += "\\Updates\\manually_loaded_files"; //Dev Path
                //path += "\\resources\\app\\Updates\\manually_loaded_files"; //Release Path

                connection.Send("pathlength", path.Length);

                string[] updates_file_path = Directory.GetFiles(@path, "*.hex"); //Directory - references path above
                Array.Sort(updates_file_path);
                Array.Reverse(updates_file_path);

                return updates_file_path;
            });

            //Deletes selected file from local directory
            connection.On<dynamic, string>("deletefile", path => {
                File.Delete(path);
                Thread.Sleep(25);
                return "done";
            });

            //Returns array of information for a specific update file
            connection.On<dynamic, string[]>("updateInfo", path => {
                string manufacturer_name = test.GetHexFileManufacturer(path);
                string versionU = "";
                string model = "";

                string[] info = new string [3];

                KauaiLabsDfuTargetDescriptor dfu_target_desc = test.GetDfuTargetDescriptorFromHexFileName(path, out versionU);
                if (dfu_target_desc == null)
                {
                    ;
                }
                else
                {
                    model = dfu_target_desc.ProductId();
                }

                info[0] = manufacturer_name;
                info[1] = versionU;
                info[2] = model;
                
                return info;
            });

            //Calls the update function to the requested version, returns
            connection.On<dynamic, string>("updateDevice", path => 
            {
                test.full_path_to_hex_file = path;
                string message = test.update();
                return message;
            });  

            //=================================Device Configuration=============================:

            //Sets the values entered by the user and returns a status message
            connection.On<dynamic, string>("configure", data =>
            {
                
                if (data.command == "maxgyroerror"){
                    float val = Convert.ToSingle(data.value);
                    test.set_tuning_variable(tuning_var_id_max_gyro_error, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_max_gyro_error);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false;                     
                }

                else if (data.command == "gyroscalefactor"){
                    float val = Convert.ToSingle(data.value);
                    test.set_tuning_variable(tuning_var_id_gyro_scale_factor_ratio, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_gyro_scale_factor_ratio);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (data.command == "linearmotion"){
                    float val = Convert.ToSingle(data.value);
                    test.set_tuning_variable(tuning_var_id_motion_threshold, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_motion_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (data.command == "rotation"){
                    float val = Convert.ToSingle(data.value);
                    test.set_tuning_variable(tuning_var_id_yaw_stable_threshold, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_yaw_stable_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }
                
                else if (data.command == "magneticdisturbance"){
                    float val = Convert.ToSingle(data.value);
                    val /= 100; /* Convert from percentage to ratio */
                    test.set_tuning_variable(tuning_var_id_mag_distrubance_threshold, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_mag_distrubance_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (data.command == "gyrorange"){
                    float val = Convert.ToSingle(Convert.ToUInt32(data.value));
                    test.set_tuning_variable(tuning_var_id_gyro_fsr_dps, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_gyro_fsr_dps);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (data.command == "accelrange"){
                    float val = Convert.ToSingle(Convert.ToUInt32(data.value));
                    test.set_tuning_variable(tuning_var_id_accel_fsr_g, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_accel_fsr_g);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (data.command == "maxgyrorange"){
                    float val = Convert.ToSingle(data.value);
                    test.set_tuning_variable(tuning_var_id_max_gyro_error, val, false);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_max_gyro_error);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false;       
                }

                return test.tuning_msg;
            });
            
            //Resets the value to default and returns status message
            connection.On<dynamic, string>("reset", command => {
                if (command == "linearmotionReset"){
                    test.set_tuning_variable(tuning_var_id_motion_threshold, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_motion_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (command == "rotationReset"){
                    test.set_tuning_variable(tuning_var_id_yaw_stable_threshold, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_yaw_stable_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }
                
                else if (command == "magneticdisturbanceReset"){
                    test.set_tuning_variable(tuning_var_id_mag_distrubance_threshold, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_mag_distrubance_threshold);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (command == "gyrorangeReset"){
                    test.set_tuning_variable(tuning_var_id_gyro_fsr_dps, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_gyro_fsr_dps);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (command == "accelrangeReset"){
                    test.set_tuning_variable(tuning_var_id_accel_fsr_g, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_accel_fsr_g);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }

                else if (command == "maxgyrorangeReset"){
                    test.set_tuning_variable(tuning_var_id_max_gyro_error, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_max_gyro_error);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false;       
                }

                else if (command == "gyroscalefactorReset"){
                    test.set_tuning_variable(tuning_var_id_gyro_scale_factor_ratio, 0.0f, true);
                    Thread.Sleep(1000);
                    test.request_tuning_variable(tuning_var_id_gyro_scale_factor_ratio);
                    test.DelayMilliseconds(35);
                    test.var_refresh();
                    while(done_set != true){;}
                    done_set = false; 
                }
                return test.tuning_msg;
            });

            //Returns all the stored values to be displayed on the frontend
            connection.On<dynamic, string[]>("getConfigValues", data => {
                return test.configValues;
            });
            
            //Starts accelerometer calibration process
            connection.On<dynamic, string>("accelcalibration", data => {
                test.send_cal_command(CAL_TYPE.CAL_TYPE_ACCEL, CAL_CMD.CAL_CMD_START);
                Thread.Sleep(50);
                test.var_refresh();
                return "done";
            });

            //Records and returns status of the calibration throughout the process
            connection.On<dynamic, string[]>("calibrationstatus", data => {
                string prev_state = "";
                string prev_qual = "";
                calibration_done = false;
                while(calibration_done != true){
                    test.var_refresh();
                    if (prev_state != test.prev_state_description || prev_qual != test.prev_state_quality){
                        Console.Error.WriteLine(test.prev_state_description);
                        prev_state = test.prev_state_description;
                        Console.Error.WriteLine(test.prev_state_quality);
                        prev_qual = test.prev_state_quality;

                        //Sends status info to JS
                        connection.Send("calstatusstate", prev_state);
                        connection.Send("calstatusqual", prev_qual);

                    }

                    Thread.Sleep(1000);
                }


                calibration_done = false;
                string[] status = new string [2];
                status[0] = prev_state;
                status[1] = prev_qual;

                return status;
            });

            //Stop accelerometer calibration process
            connection.On<dynamic, string>("stopcalibration", data => {
                test.send_cal_command(CAL_TYPE.CAL_TYPE_ACCEL, CAL_CMD.CAL_CMD_STOP);
                Thread.Sleep(50);
                test.var_refresh();
                string prev_state = test.prev_state_description;
                string prev_qual = test.prev_state_quality;

                connection.Send("calstatusstate", prev_state);   
                connection.Send("calstatusqual", prev_qual);

                return "stopped";
            }); 

            //Starts sensor fusion calibration, returns live yaw value
            connection.On<dynamic, string[]>("startsensorcal", info => {
                
                //Set GyroScaleFactor to 1:
                test.set_tuning_variable(tuning_var_id_gyro_scale_factor_ratio, 1, false);
                test.DelayMilliseconds(50);
                test.refresh_setting(tuning_var_id_gyro_scale_factor_ratio);

                //Get Live Yaw Value:
                sensor_fusion_cal_done = false;
                while(sensor_fusion_cal_done != true){
                    test.var_refresh_mag();
                    Thread.Sleep(50);
                    connection.Send("yawval", test.yaw_value);
                };              

                return test.MagCalValues;
            });

            //Stops sensor fusion calibration
            connection.On<dynamic, string>("stopsensorcal", info => {
                sensor_fusion_cal_done = true;
                return "done";
            });

            //Stops sensor fusion calibration, sets calculated gyro scale factor ratio
            connection.On<dynamic, string>("gyroscale", ratio => {
                sensor_fusion_cal_done = true;
                float val = Convert.ToSingle(ratio);
                test.set_tuning_variable(tuning_var_id_gyro_scale_factor_ratio, val, false);
                test.DelayMilliseconds(50);
                test.refresh_setting(tuning_var_id_gyro_scale_factor_ratio);
                //Console.Error.WriteLine(ratio);

                test.entry += ratio + "," + test.board_info[2] + "," + test.board_info[3];
                test.datalog_writer.WriteLine(test.entry);
                
                return "done";
            });

            //Creates .csv file on desktop and starts recording sensor fusion calibration data
            connection.On<dynamic, string>("exportdata", data =>{
                test.sensor_fusion_data();
                return "done";
            });
            
            //Adds recorded values to the entry variable to be saved on the .csv file
            connection.On<dynamic, string>("sensorfusiondata", data => {
                test.entry = "";

                for (int i = 0; i < 5; i++){
                    test.entry += (data.plus90values[i] + "," + data.minus90values[i] + ",");
                }
                return "done";
            });

            //Resets yaw value
            connection.On<dynamic, string>("resetyaw", data => {
                byte[] stream_command = new byte[] {33, 35, 11, 73, 128, 0, 0, 0, 0, 49, 56, 13, 10};
                test.port.Write(stream_command, 0, stream_command.Length);
                return "done write";
            });

            //==========================================MagCal========================================

            //Saves user inputted MagCal values to backend
            connection.On<dynamic, string[]>("magcalsave", data => {
                
                test.MagCalValues[0] = data.x;
                test.MagCalValues[1] = data.y;
                test.MagCalValues[2] = data.z;

                if (data.command == "xplus0"){
                    test.xplus_0_values[0] = test.MagCalValues[0];
                    test.xplus_0_values[1] = test.MagCalValues[1];
                    test.xplus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "xplus180"){                    
                    test.xplus_180_values[0] = test.MagCalValues[0];
                    test.xplus_180_values[1] = test.MagCalValues[1];
                    test.xplus_180_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "xminus0"){
                    test.xminus_0_values[0] = test.MagCalValues[0];
                    test.xminus_0_values[1] = test.MagCalValues[1];
                    test.xminus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "xminus180"){
                    test.xminus_180_values[0] = test.MagCalValues[0];
                    test.xminus_180_values[1] = test.MagCalValues[1];
                    test.xminus_180_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "yplus0"){
                    test.yplus_0_values[0] = test.MagCalValues[0];
                    test.yplus_0_values[1] = test.MagCalValues[1];
                    test.yplus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "yplus180"){
                    test.yplus_180_values[0] = test.MagCalValues[0];
                    test.yplus_180_values[1] = test.MagCalValues[1];
                    test.yplus_180_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "yminus0"){
                    test.yminus_0_values[0] = test.MagCalValues[0];
                    test.yminus_0_values[1] = test.MagCalValues[1];
                    test.yminus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "yminus180"){
                    test.yminus_180_values[0] = test.MagCalValues[0];
                    test.yminus_180_values[1] = test.MagCalValues[1];
                    test.yminus_180_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "zplus0"){
                    test.zplus_0_values[0] = test.MagCalValues[0];
                    test.zplus_0_values[1] = test.MagCalValues[1];
                    test.zplus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "zplus180"){
                    test.zplus_180_values[0] = test.MagCalValues[0];
                    test.zplus_180_values[1] = test.MagCalValues[1];
                    test.zplus_180_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "zminus0"){
                    test.zminus_0_values[0] = test.MagCalValues[0];
                    test.zminus_0_values[1] = test.MagCalValues[1];
                    test.zminus_0_values[2] = test.MagCalValues[2];
                }
                else if (data.command == "zminus180"){
                    test.zminus_180_values[0] = test.MagCalValues[0];
                    test.zminus_180_values[1] = test.MagCalValues[1];
                    test.zminus_180_values[2] = test.MagCalValues[2];
                }

                return test.MagCalValues;
            });

            //Returns X, Y, Z axes values to frontend and stores them into arrays in backend
            connection.On<dynamic, string[]>("magcalopen", command => {
                
                test.var_refresh_mag();

                if (command == "xplus0"){
                    Console.Error.WriteLine("yes");
                    
                    test.xplus_0_values[0] = test.MagCalValues[0];
                    test.xplus_0_values[1] = test.MagCalValues[1];
                    test.xplus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "xplus180"){
                    Console.Error.WriteLine("yes");
                    
                    test.xplus_180_values[0] = test.MagCalValues[0];
                    test.xplus_180_values[1] = test.MagCalValues[1];
                    test.xplus_180_values[2] = test.MagCalValues[2];
                }
                else if (command == "xminus0"){
                    test.xminus_0_values[0] = test.MagCalValues[0];
                    test.xminus_0_values[1] = test.MagCalValues[1];
                    test.xminus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "xminus180"){
                    test.xminus_180_values[0] = test.MagCalValues[0];
                    test.xminus_180_values[1] = test.MagCalValues[1];
                    test.xminus_180_values[2] = test.MagCalValues[2];
                }
                else if (command == "yplus0"){
                    test.yplus_0_values[0] = test.MagCalValues[0];
                    test.yplus_0_values[1] = test.MagCalValues[1];
                    test.yplus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "yplus180"){
                    test.yplus_180_values[0] = test.MagCalValues[0];
                    test.yplus_180_values[1] = test.MagCalValues[1];
                    test.yplus_180_values[2] = test.MagCalValues[2];
                }
                else if (command == "yminus0"){
                    test.yminus_0_values[0] = test.MagCalValues[0];
                    test.yminus_0_values[1] = test.MagCalValues[1];
                    test.yminus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "yminus180"){
                    test.yminus_180_values[0] = test.MagCalValues[0];
                    test.yminus_180_values[1] = test.MagCalValues[1];
                    test.yminus_180_values[2] = test.MagCalValues[2];
                }
                else if (command == "zplus0"){
                    test.zplus_0_values[0] = test.MagCalValues[0];
                    test.zplus_0_values[1] = test.MagCalValues[1];
                    test.zplus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "zplus180"){
                    test.zplus_180_values[0] = test.MagCalValues[0];
                    test.zplus_180_values[1] = test.MagCalValues[1];
                    test.zplus_180_values[2] = test.MagCalValues[2];
                }
                else if (command == "zminus0"){
                    test.zminus_0_values[0] = test.MagCalValues[0];
                    test.zminus_0_values[1] = test.MagCalValues[1];
                    test.zminus_0_values[2] = test.MagCalValues[2];
                }
                else if (command == "zminus180"){
                    test.zminus_180_values[0] = test.MagCalValues[0];
                    test.zminus_180_values[1] = test.MagCalValues[1];
                    test.zminus_180_values[2] = test.MagCalValues[2];
                }

                return test.MagCalValues;
            });

            //Calculates matrix using stored axes values
            connection.On<dynamic, string>("calculatematrix", info =>{
                test.calculate_transformation_matrix();
                Thread.Sleep(50);

                //Send calculated matrix data to frontend:
                connection.Send("xmatrix", test.xmatrix);
                connection.Send("ymatrix", test.ymatrix);
                connection.Send("zmatrix", test.zmatrix);
                connection.Send("biasmatrix", test.biasmatrix);

                return "send";
            });
            
            //Save to device
            connection.On<dynamic, string>("savetodevice", data => {
                test.savetodevice();
                return "sent";
            });

            //Retrieve saved matrix information from device
            connection.On<dynamic, string>("retrievevalues", data => {
                test.send_magcal_data_request();
                Thread.Sleep(59);
                test.var_refresh_mag();

                connection.Send("xmatrix", test.xmatrix);
                connection.Send("ymatrix", test.ymatrix);
                connection.Send("zmatrix", test.zmatrix);
                connection.Send("biasmatrix", test.biasmatrix);

                return "done";
            });

            //======================================navXUI=================================: 

            //Stops the GUI render
            connection.On<dynamic, string>("stopui", info =>{
                UI_done = true;
                return "done";
            });

            //Retrieve values for the GUI, pitch, roll, yaw
            connection.On<dynamic, string>("uivalues", info => {

                //Get Live Yaw Value:
                UI_done = false;
                while(UI_done != true){
                    test.var_refresh_mag();
                    Thread.Sleep(50);
                    connection.Send("pitchval", test.pitch_value);
                    connection.Send("yawval2", test.yaw_value);
                    connection.Send("rollval", test.roll_value);
                    connection.Send("othernavxuivalues", test.navxui_values);
                };
                return "done";
                
            });

            //=====================================Other==============================:

            //Closes current open port
            connection.On<dynamic, string>("disconnect", info => {
                test.closePort();
                return "done";
            });

            connection.Listen();
        }

        public void openPort(int index){
            port.PortName = navx_port_names[index];

            Console.Error.WriteLine(port.PortName);
            port_close_flag = false;
            port.ReadTimeout = 1000;
            port.WriteTimeout = 1000;
            port.Open();
            port.DiscardInBuffer();
            port.DiscardOutBuffer();
            port.DataReceived += new SerialDataReceivedEventHandler(DataReceivedHandler);
            send_board_identity_request();
            Thread.Sleep(100);
            send_ahrs_stream_request();
            var_refresh();
            refresh_settings();
            refresh_settings();

        }

        public void closePort(){
            port_close_flag = true;
            Thread.Sleep(500);
            try{
                port.Close();
            }
            catch (Exception){

            }
            port.Dispose();
            port.DataReceived -= new SerialDataReceivedEventHandler(DataReceivedHandler);
            empty_serial_data_counter = 0;
            bytes_from_usart = null;
            num_bytes_from_usart = 0;
            bytes_from_usart_offset = 0;
        }

        //Scans device for any connected boards and saves them to an array 
        public void detectCOMPort()
        {

            SerialPort detectPort = new SerialPort();
            navx_port_names = navXComHelper.GetnavXSerialPortNames();
            

            // Display each port name 
            foreach (string portName in navx_port_names)
            {
                
                Console.Error.WriteLine(portName);
                try{
                    port.PortName = portName;

                    port_close_flag = false;
                    port.ReadTimeout = 1000;
                    port.WriteTimeout = 1000;
                    port.Open();
                    port.DiscardInBuffer();
                    port.DiscardOutBuffer();
                    port.DataReceived += new SerialDataReceivedEventHandler(DataReceivedHandler);
                    send_board_identity_request();
                    Thread.Sleep(100);
                    var_refresh();
                    refresh_settings();
                    refresh_settings();
                    //send_cal_command(CAL_TYPE.CAL_TYPE_ACCEL, CAL_CMD.CAL_CMD_STATUS_REQUEST);

                    port_close_flag = true;
                    Thread.Sleep(500);
                    try{
                        port.Close();
                    }
                    catch (Exception ex){
                        
                    }
                    port.Dispose();
                    port.DataReceived -= new SerialDataReceivedEventHandler(DataReceivedHandler);
                    empty_serial_data_counter = 0;
                    bytes_from_usart = null;
                    num_bytes_from_usart = 0;
                    bytes_from_usart_offset = 0;
                    
                }
                catch (Exception ex) {
                    port.Close();
                    Console.Error.WriteLine("Empty Port Name");
                }
                
            }
        }      

        public void send_board_identity_request()
        {
            send_board_data_request(2);
        }

        private static void DataReceivedHandler(object sender, SerialDataReceivedEventArgs e)
        {
            if (!port_close_flag)
            {
                SerialPort sp = (SerialPort)sender;
                try
                {
                    lock (bufferLock)
                    {
                        int bytes_available = sp.BytesToRead;
                        Byte[] buf = new Byte[bytes_available];
                        sp.Read(buf, 0, bytes_available);
                        if (bytes_from_usart != null)
                        {
                            /* older, unprocessed data still exists. Append new data */
                            Byte[] bufexpanded = new Byte[num_bytes_from_usart + bytes_available];
                            System.Buffer.BlockCopy(bytes_from_usart, 0, bufexpanded, 0, num_bytes_from_usart);
                            System.Buffer.BlockCopy(buf, 0, bufexpanded, num_bytes_from_usart, bytes_available);
                            bytes_available = num_bytes_from_usart + bytes_available;
                            buf = bufexpanded;
                        }
                        for (int i = 0; i < bytes_available; i++)
                        {
                            if (buf[i] == Convert.ToByte('!'))
                            {
                                bytes_from_usart = buf;
                                num_bytes_from_usart = bytes_available;
                                bytes_from_usart_offset = i;
                                break;
                            }
                        }
                    }
                }
                catch (Exception) //ex
                {
                    //MessageBox.Show("DataReceivedHandler error.", "Exception:  " + ex.Message);
                }
            }
        }
        public  void send_board_data_request(int datatype)
        {
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[10]; /* HACK:  Must be 9 bytes to register to the navX MXP */

                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('#');
                buf[2] = (byte)(buf.Length - 2);
                buf[3] = Convert.ToByte('D');
                // Data
                buf[4] = (byte)datatype;
                buf[5] = 0; /* Subtype = 0 (not used) */
                // Footer
                // Checksum is at 4;
                byte checksum = (byte)0;
                for (int i = 0; i < 6; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 6);

                // Terminator begins at 8;
                buf[8] = Convert.ToByte('\r');
                buf[9] = Convert.ToByte('\n');

                try
                {
                    port.Write(buf, 0, buf.Length);
                }
                catch (Exception)
                {
                }
            }
        }

        public void CharToHex(byte b, byte[] buf, int index)
        {
            String hex = b.ToString("X2");
            byte[] b2 = System.Text.Encoding.ASCII.GetBytes(hex);
            buf[index] = b2[0];
            buf[index + 1] = b2[1];
        }

        const char navx_msg_start_char = '!';
        const char navx_binary_msg_indicator = '#';
        const int navx_tuning_get_request_msg_len = 10;
        const char navx_tuning_get_request_msg_id = 'D';    /* [type],[varid] */
        const int navx_tuning_getset_msg_len = 14;
        const char navx_tuning_getset_msg_id = 'T';        /* [type],[varid],[value (16:16)]*/
        const int navx_tuning_set_response_msg_len = 11;
        const char navx_tuning_set_response_msg_id = 'v';   /* [type],[varid],[status] */
        const char navx_board_id_msg_type = 'i';
        const int navx_board_id_msg_length = 26;
        const int navx_accel_cal_status_msg_len = 15;
        const char navx_accel_cal_status_msg_type = 'c';
        
        const int tuning_var_id_unspecified = 0;
        const int tuning_var_id_motion_threshold = 1;
        const int tuning_var_id_yaw_stable_threshold = 2;
        const int tuning_var_id_mag_distrubance_threshold = 3;
        const int tuning_var_id_sea_level_pressure = 4;
        const int tuning_var_id_gyro_scale_factor_ratio = 7;
        const int tuning_var_id_max_gyro_error = 8;
        const int tuning_var_id_gyro_fsr_dps = 9;
        const int tuning_var_id_accel_fsr_g = 10;

        readonly string[] tuning_var_names = new string[]
        {
            "Linear Motion Threshold",
            "Rotation Threshold",
            "Magnetic Disturbance Threshold",
            "Sea Level Barometric Pressure",
            "Static Motion Delay",
            "Dynamic Motion Delay",
            "Gyro Scale Factor Ratio",
            "Max Gyro Error",
            "Gyro Full-scale Range",
            "Accel Full-scale Range"
        };

        readonly string[] tuning_var_recommendations = new string[]
        {
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "Consider updating the Gyro Scale Factor Ratio (on Sensor Fusion Tab)",
            "Consider re-running the Accelerometer Calibratoion (on Accelerometer Calibration Tab)"
        };


        private void floatTextToint16_buf(string float_text, Byte[] buf, int index)
        {
            short int16_val = (short)Convert.ToSingle(float_text);
            buf[index + 0] = (byte)int16_val;
            buf[index + 1] = (byte)(int16_val >> 8);
        }

        private float unsignedHudredthsToFloat(Byte[] buf, int index)
        {
            UInt16 integer = BitConverter.ToUInt16(buf, index);
            float val = integer;
            val /= 100.0f;
            return val;
        }

        private float signedHundredthsToFloat(Byte[] buf, int index)
        {
            Int16 integer = BitConverter.ToInt16(buf, index);
            float val = integer;
            val /= 100.0f;
            return val;
        }

        private float signedThousandthsToFloat(Byte[] buf, int index)
        {
            Int16 integer = BitConverter.ToInt16(buf, index);
            float val = integer;
            val /= 1000.0f;
            return val;
        }

        private float text1616FloatToFloat(Byte[] buf, int index)
        {
            Int32 integer = BitConverter.ToInt32(buf, index);
            float val = (float)integer;
            val /= 65536.0f;
            return val;
        }

        private void floatTextTo1616Float(string float_text, Byte[] buf, int index)
        {
            float x_d = Convert.ToSingle(float_text);
            x_d *= 65536.0f;
            int decimal_as_int = (int)x_d;
            if (BitConverter.IsLittleEndian)
            {
                buf[index + 3] = (byte)(decimal_as_int >> 24);
                buf[index + 2] = (byte)(decimal_as_int >> 16);
                buf[index + 1] = (byte)(decimal_as_int >> 8);
                buf[index + 0] = (byte)(decimal_as_int >> 0);
            }
            else
            {
                buf[index + 0] = (byte)(decimal_as_int >> 24);
                buf[index + 1] = (byte)(decimal_as_int >> 16);
                buf[index + 2] = (byte)(decimal_as_int >> 8);
                buf[index + 3] = (byte)(decimal_as_int >> 0);
            }
        }

        private void var_refresh()
        {
            byte[] usart_bytes;
            int usart_data_offset;
            int n_bytes_from_usart;
            /* Critical section, to prohibit reception of new bytes during the following section. */
            /* See DataReceivedHandler(). */
            lock (bufferLock)
            {
                if (bytes_from_usart == null) return;
                if (num_bytes_from_usart == 0) return;
                n_bytes_from_usart = num_bytes_from_usart;
                usart_data_offset = bytes_from_usart_offset;
                usart_bytes = new byte[n_bytes_from_usart];
                System.Buffer.BlockCopy(bytes_from_usart, 0, usart_bytes, 0, n_bytes_from_usart);
                bytes_from_usart = null;
                num_bytes_from_usart = 0;
            }
            /* End of critical section */
            try
            {
                bool device_id_msg_shown = false;
                int valid_bytes_available = n_bytes_from_usart - usart_data_offset;
                bool end_of_data = false;
                while (!end_of_data)
                {
                    if ((usart_bytes != null) && (valid_bytes_available >= 2))
                    {
                        if ((usart_bytes[usart_data_offset] == Convert.ToByte(navx_msg_start_char)) &&
                             (usart_bytes[usart_data_offset + 1] == Convert.ToByte(navx_binary_msg_indicator)))
                        {
                            /* Valid packet start found */
                            if ((usart_bytes[usart_data_offset + 2] == navx_tuning_getset_msg_len - 2) &&
                                 (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_tuning_getset_msg_id)))
                            {
                                /* AHRS Update packet received */
                                byte[] bytes = new byte[navx_tuning_getset_msg_len];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_tuning_getset_msg_len);
                                valid_bytes_available -= navx_tuning_getset_msg_len;
                                usart_data_offset += navx_tuning_getset_msg_len;

                                byte type = bytes[4];
                                byte varid = bytes[5];
                                float value = text1616FloatToFloat(bytes, 6);
                                
                                if (varid == tuning_var_id_motion_threshold)
                                {
                                    configValues[0] = String.Format("{0:##0.####}", value);
                                }
                                if (varid == tuning_var_id_yaw_stable_threshold)
                                {
                                    configValues[1] = String.Format("{0:##0.####}", value);
                                }
                                if (varid == tuning_var_id_mag_distrubance_threshold)
                                {
                                    value *= 100; // Convert from ratio to percentage
                                    configValues[2] = String.Format("{0:##0.#}", value);
                                }
                                // if (varid == tuning_var_id_sea_level_pressure)
                                // {                                    
                                // }
                                if (varid == tuning_var_id_max_gyro_error)
                                {
                                    configValues[5] = String.Format("{0:##0.####}", value);
                                }
                                // if (varid == tuning_var_id_gyro_scale_factor_ratio)
                                // {
                                // }
                                if (varid == tuning_var_id_gyro_fsr_dps)
                                {
                                    configValues[3] = String.Format("{0}", value);
                                }
                                if (varid == tuning_var_id_accel_fsr_g)
                                {
                                    configValues[4] = String.Format("{0}", value);
                                }
                                
                            }
                            else if ((usart_bytes[usart_data_offset + 2] == navx_tuning_set_response_msg_len - 2) &&
                                     (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_tuning_set_response_msg_id)))
                            {
                                Console.Error.WriteLine("here");
                                byte[] bytes = new byte[navx_tuning_set_response_msg_len];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_tuning_set_response_msg_len);
                                valid_bytes_available -= navx_tuning_set_response_msg_len;
                                usart_data_offset += navx_tuning_set_response_msg_len;

                                byte type = bytes[4];
                                byte varid = bytes[5];
                                byte status = bytes[6];
                                if ((varid > 0) && (varid <= tuning_var_names.Length))
                                {
                                    string msg = tuning_var_names[varid - 1] + " - " + ((status == 0) ? "Success" : "Failed");
                                    /*if (tuning_var_recommendations[varid - 1].Length > 0)
                                    {
                                        msg += Environment.NewLine;
                                        msg += Environment.NewLine;
                                        msg += tuning_var_recommendations[varid - 1];
                                    }*/
                                    //Console.Error.WriteLine("made it here");
                                    done_set = true;
                                    tuning_msg = msg;
                                }
                            }
                            else if ((usart_bytes[usart_data_offset + 2] == navx_board_id_msg_length - 2) &&
                                     (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_board_id_msg_type)))
                            {
                                /* Mag Cal Data Response received */
                                byte[] bytes = new byte[navx_board_id_msg_length];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_board_id_msg_length);
                                valid_bytes_available -= navx_board_id_msg_length;
                                usart_data_offset += navx_board_id_msg_length;
                                byte boardtype = bytes[4];
                                byte hwrev = bytes[5];
                                byte fw_major = bytes[6];
                                byte fw_minor = bytes[7];
                                UInt16 fw_revision = BitConverter.ToUInt16(bytes, 8);
                                byte[] unique_id = new byte[12];
                                for (int i = 0; i < 12; i++)
                                {
                                    unique_id[i] = bytes[10 + i];
                                }
                                bool show_accel_cal_and_sensor_fusion_settings = false;
                                string boardtype_string = "unknown";
                                if (hwrev == 33)
                                {
                                    boardtype_string = "navX-MXP (Classic)";
                                }
                                else if (hwrev == 34)
                                {
                                    boardtype_string = "navX2-MXP (Gen 2)";
                                    show_accel_cal_and_sensor_fusion_settings = true;
                                }
                                else if (hwrev == 40) 
                                {
                                    boardtype_string = "navX-Micro (Classic)";
                                }
                                else if (hwrev == 41)
                                {
                                    boardtype_string = "navX2-Micro (Gen 2)";
                                    show_accel_cal_and_sensor_fusion_settings = true;
                                }
                                else if ((hwrev >= 60) && (hwrev <= 69)) {
                                    if (hwrev < 62)
                                    {
                                        boardtype_string = "VMX-pi";
                                    }
                                    else
                                    {
                                        boardtype_string = "VMX2-pi";
                                        show_accel_cal_and_sensor_fusion_settings = true;
                                    }
								}
                                navxName.Add(boardtype_string);
                                Console.Error.WriteLine(boardtype_string);
                                string msg = "Board type:  " + boardtype_string + " (" + boardtype + ")\r\n" +
                                                 "H/W Rev:  " + hwrev + "\r\n" +
                                                 "F/W Rev:  " + fw_major + "." + fw_minor + "." + fw_revision + "\r\n" +
                                                 "Unique ID:  ";
                                
                                msg += BitConverter.ToString(unique_id);
                                navxID.Add(msg);

                                board_info[0] = boardtype_string + " (" + boardtype + ")";
                                board_info[1] = "" + hwrev;
                                board_info[2] = "" + fw_major + "." + fw_minor + "." + fw_revision;
                                board_info[3] = BitConverter.ToString(unique_id);

                                if (!device_id_msg_shown)
                                {
                                    device_id_msg_shown = true;
                                }
                            }
                            else if ((usart_bytes[usart_data_offset + 2] == navx_accel_cal_status_msg_len - 2) &&
                                     (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_accel_cal_status_msg_type)))
                            {
                                
                                byte[] bytes = new byte[navx_accel_cal_status_msg_len];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_accel_cal_status_msg_len);
                                valid_bytes_available -= navx_accel_cal_status_msg_len;
                                usart_data_offset += navx_accel_cal_status_msg_len;
                                
                                CAL_TYPE cal_type = (CAL_TYPE)bytes[4];
                                CAL_STATE cal_state = (CAL_STATE)bytes[5];
                                CAL_QUALITY cal_qual = (CAL_QUALITY)bytes[6];
                                CAL_PARAMETER cal_param = (CAL_PARAMETER)BitConverter.ToInt32(bytes, 7);

                                //add variable to store prev state and only print if new state is different
                                if (prev_state_description != GetCalStateDescription(cal_state) || prev_state_quality != GetCalQualityDescription(cal_qual)){
                                    //Console.Error.WriteLine(GetCalStateDescription(cal_state));
                                    //Console.Error.WriteLine(GetCalQualityDescription(cal_qual));

                                    prev_state_description = GetCalStateDescription(cal_state);
                                    prev_state_quality = GetCalQualityDescription(cal_qual);
                                }

                                if (cal_type == CAL_TYPE.CAL_TYPE_ACCEL)
                                {
                                    if (last_accel_cal_cmd == CAL_CMD.CAL_CMD_START)
                                    {
                                        if (cal_param == CAL_PARAMETER.CAL_PARAM_NACK)
                                        {
                                            if (!showing_accel_cal_error)
                                            {
                                                showing_accel_cal_error = true;
                                                showing_accel_cal_error = false;
                                            }
                                        }
                                        else if (cal_param == CAL_PARAMETER.CAL_PARAM_ACK)
                                        {
                                        }
                                    }
                                    if ((cal_state == CAL_STATE.CAL_STATE_DONE) ||
                                        (cal_state == CAL_STATE.CAL_STATE_NONE))
                                    {
                                        calibration_done = true;
                                        //Console.Error.WriteLine("cali. done");
                                    }
                                }
                                
                            }
                            else
                            {
                                // Start of packet found, but not wanted
                                valid_bytes_available -= 1;
                                usart_data_offset += 1;
                                // Keep scanning through the remainder of the buffer
                            }
                        }
                        else
                        {
                            // Data available, but first char is not a valid start of message.
                            // Keep scanning through the remainder of the buffer
                            valid_bytes_available -= 1;
                            usart_data_offset += 1;
                        }
                    }
                    else
                    {
                        // At end of buffer, stop scanning
                        end_of_data = true;
                    }
                }
            }
            catch (Exception ex)
            {
                //close_port();
            }
        }

        private void refresh_settings()
        {
            request_tuning_variable(tuning_var_id_motion_threshold);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_yaw_stable_threshold);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_mag_distrubance_threshold);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_sea_level_pressure);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_gyro_scale_factor_ratio);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_max_gyro_error);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_gyro_fsr_dps);
            DelayMilliseconds(25);
            var_refresh();
            request_tuning_variable(tuning_var_id_accel_fsr_g);
            DelayMilliseconds(25);
            var_refresh();
        }

        private void request_tuning_variable(int var_id)
        {
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[navx_tuning_get_request_msg_len]; /* HACK:  Must be 9 bytes to register to the navX MXP */

                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('#');
                buf[2] = (byte)(buf.Length - 2);
                buf[3] = Convert.ToByte(navx_tuning_get_request_msg_id);
                // Data
                buf[4] = (byte)0; /* Tuning Variable data type */
                buf[5] = (byte)var_id;
                // Footer
                // Checksum is at 6;
                byte checksum = (byte)0;
                for (int i = 0; i < 6; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 6);

                // Terminator begins at 8;
                buf[8] = Convert.ToByte('\r');
                buf[9] = Convert.ToByte('\n');

                try
                {
                    port.Write(buf, 0, buf.Length);
                }
                catch (Exception)
                {
                }
            }
        }

        private void DelayMilliseconds(int milliseconds)
        {
            double end_ms = DateTime.Now.TimeOfDay.TotalMilliseconds + milliseconds;
            while (DateTime.Now.TimeOfDay.TotalMilliseconds < end_ms)
            {
                Thread.Sleep(1);
            }
        }

        //Firmware Updater

        private string StringToHex(string hexstring)
        {
            StringBuilder sb = new StringBuilder();
            foreach (char t in hexstring)
            {
                //Note: X for upper, x for lower case letters
                sb.Append(Convert.ToInt32(t).ToString("x"));
            }
            return sb.ToString();
        }

        private string GetHexFileManufacturer(string full_path_to_hex_file)
        {
            string manufacturer_kauailabs_hex_uc = StringToHex("(Kauai Labs)").ToUpperInvariant();

            using (StreamReader sr = new StreamReader(full_path_to_hex_file))
            {
                string line;
                // Read and display lines from the file until the end of
                // the file is reached.
                string last_line_data_bytes_hex = "";
                while ((line = sr.ReadLine()) != null)
                {
                    if (line.StartsWith(":"))
                    {
                        // 2 bytes: (hex) data len
                        // 4 bytes: (hex, big-endian) address
                        // 2 bytes: (hex) type code
                        // 2*datalen bytes: (hex) data
                        // 2 bytes:  crc
                        line = line.Substring(1);
                        if (line.Length >= 4)
                        {
                            string num_bytes_hex = line.Substring(0, 2);
                            byte data_len = byte.Parse(num_bytes_hex, NumberStyles.HexNumber, CultureInfo.InvariantCulture);
                            string remainder = line.Substring(2);
                            string address_hex_string = remainder.Substring(0,4);
                            ushort address = ushort.Parse(address_hex_string, NumberStyles.HexNumber, CultureInfo.InvariantCulture);
                            remainder = remainder.Substring(4);
                            string code_hex_string = remainder.Substring(0, 2);
                            byte code = byte.Parse(code_hex_string, NumberStyles.HexNumber, CultureInfo.InvariantCulture);
                            if ((code == 0 /* Data */) && (data_len > 0))
                            {
                                remainder = remainder.Substring(2);
                                string data_bytes_hex = remainder.Substring(0, data_len * 2);
                                if (last_line_data_bytes_hex.Length > 0)
                                {
                                    string combined_last_two_line_data_bytes_hex =
                                        last_line_data_bytes_hex + data_bytes_hex;
                                    string uc = combined_last_two_line_data_bytes_hex.ToUpper();
                                    if (uc.Contains(manufacturer_kauailabs_hex_uc))
                                    {
                                        return "Kauai Labs";
                                    }
                                }
                                last_line_data_bytes_hex = data_bytes_hex;
                            } else
                            {
                                last_line_data_bytes_hex = "";
                            }
                        }
                    }
                }
            }
            return "Unknown";
        }

        static void firmwareUpdate_OnFirmwareUpdateProgress(object sender, FirmwareUpdateProgressEventArgs e)
        {

            if (e.Percentage == 100)
            {
                //Console.Error.WriteLine("UPDATE COMPLETE");
                update_complete = true;
            }
        }

        private string update(){
        {
            if (!firmware_update_registered)
            {
                firmwareUpdate.OnFirmwareUpdateProgress += new FirmwareUpdateProgressEventHandler(firmwareUpdate_OnFirmwareUpdateProgress);
                firmware_update_registered = true;
            }
            FirmwareUpdateProgressEventArgs fupea;

            statusText = "";

            fupea = new FirmwareUpdateProgressEventArgs(0, "Detecting DFU Interface...", false);
            firmwareUpdate_OnFirmwareUpdateProgress(this, fupea);

            if (port.IsOpen)
            {
                //close_port();
            }

            bool is_dfu_available = false;

            try
            {
                byte bootloader_id = 0;
                short flash_size_k = 0;
                is_dfu_available = firmwareUpdate.IsDFUDeviceFound(out bootloader_id, out flash_size_k);
                
                if (is_dfu_available)
                {
                    string version;
                    KauaiLabsDfuTargetDescriptor dfu_target_desc =
                        GetDfuTargetDescriptorFromHexFileName(full_path_to_hex_file, out version);
                    bool skip_dfu_target_descriptor_match = false;
                    if (dfu_target_desc == null)
                    {

                        dialog_in_progress = true; 
                        string error = "Selected Firmware File:" + Environment.NewLine + Environment.NewLine;
                        error += "\t" + Path.GetFileName(full_path_to_hex_file) + Environment.NewLine + Environment.NewLine;
                        error += "does not match any known Kauai Labs product." + Environment.NewLine + Environment.NewLine;
                        error += "Downloading firmware to a mismatching product will likely cause unexpected behavior." + Environment.NewLine + Environment.NewLine;
                        error += "Do you want to continue downloading this foreign firmware file to the DFU Device?";
                        Console.Error.WriteLine("Firmware Validation Error");
                        dialog_in_progress = false;
                        
                       
                        return "Firmware Validation Error";

                    }
                    string error_string;
                    if (!skip_dfu_target_descriptor_match && !dfu_target_desc.Match(full_path_to_hex_file, bootloader_id, flash_size_k, out error_string))
                    {

                        dialog_in_progress = true;
                        Console.Error.WriteLine("Firmware Mismatch Error");
                        dialog_in_progress = false;
                        return "Firmware Mismatch Error";
                    }
                }
            }
            catch (Exception ex)
            {
                fupea = new FirmwareUpdateProgressEventArgs(0, ex.Message, true);
                firmwareUpdate_OnFirmwareUpdateProgress(this, fupea);
            }
            if (!is_dfu_available)
            {

                dialog_in_progress = true;

                Console.Error.WriteLine("DFU Mode Error");
                
                var connection = new ConnectionBuilder().Build();
     
                connection.Send("update", "DFU MODE ERROR");
                
                dialog_in_progress = false;
                return "DFU Mode Error";
            }
            String dfu_file_name = Path.GetTempPath() + "navx.dfu";
            bool converted = hex2dfu.ConvertHexToDFU(full_path_to_hex_file,
                                    dfu_file_name,
                                    theVid,
                                    thePid,
                                    theBcd);
            if (!converted)
            {

                dialog_in_progress = true;

                Console.Error.WriteLine("Converting Error");
                dialog_in_progress = false;
                return "Converting Error";
            }

            UInt16 VID;
            UInt16 PID;
            UInt16 Version;
 
            try
            {
                firmwareUpdate.ParseDFU_File(dfu_file_name, out VID, out PID, out Version);
            }
            catch (Exception ex)
            {

                fupea = new FirmwareUpdateProgressEventArgs(0, "Error parsing DFU file. " + ex.Message, false);
                firmwareUpdate_OnFirmwareUpdateProgress(this, fupea);
                dialog_in_progress = true;

                dialog_in_progress = false;
                return "Parsing Error";
            }

            fupea = new FirmwareUpdateProgressEventArgs(0, ("Found VID: " + VID.ToString("X4") + " PID: " + PID.ToString("X4") + " Version: " + Version.ToString("X4")), false);
            firmwareUpdate_OnFirmwareUpdateProgress(this, fupea);

            try
            {
                bool eraseEveything = false;
                bool exitDFUMode = true;

                firmwareUpdate.UpdateFirmware(dfu_file_name, eraseEveything, exitDFUMode);
            }
            catch (Exception ex)
            {

                fupea = new FirmwareUpdateProgressEventArgs(0, "Error deploying DFU file. " + ex.Message, true);
                firmwareUpdate_OnFirmwareUpdateProgress(this,fupea);
                dialog_in_progress = true;

                //Console.Error.WriteLine("Deploying Error");
                dialog_in_progress = false;
                return "Deploying Error";
            }

            while(update_complete != true){;}
            update_complete = false;
            return "Done";
        }
    }
        //navXconfig

        private bool send_cal_command(CAL_TYPE cal_type, CAL_CMD cal_cmd)
        {
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[14];
                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('#');
                buf[2] = (byte)(buf.Length - 2);
                buf[3] = Convert.ToByte('C'); // CAL Status Request command
                // Data
                buf[4] = (byte)cal_type;
                buf[5] = (byte)cal_cmd;
                Int32 unused_param = 0;
                var int_buf = BitConverter.GetBytes(unused_param);
                for (int i = 0; i < 4; i++)
                {
                    buf[6 + i] = int_buf[i];
                }
                // Footer
                // Checksum is at 10;
                byte checksum = (byte)0;
                for (int i = 0; i < 10; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 10);

                // Terminator begins at 12;
                buf[12] = Convert.ToByte('\r');
                buf[13] = Convert.ToByte('\n');

                try
                {
                    port.Write(buf, 0, buf.Length);
                    if (cal_type == CAL_TYPE.CAL_TYPE_ACCEL)
                    {
                        last_accel_cal_cmd = cal_cmd;
                    }
                    else if (cal_type == CAL_TYPE.CAL_TYPE_MAGNETOMETER)
                    {
                        last_mag_cal_cmd = cal_cmd;
                    }
                    return true;
                }
                catch (Exception)
                {
                }
            }
            return false;
        }

        string GetCalStateDescription(CAL_STATE cal_state)
        {
            switch (cal_state)
            {
                case CAL_STATE.CAL_STATE_DONE: return "Done";
                case CAL_STATE.CAL_STATE_INPROGRESS: return "In Progress";
                default:
                case CAL_STATE.CAL_STATE_NONE: return "Uncalibrated";
            }
        }

        string GetCalQualityDescription(CAL_QUALITY cal_qual)
        {
            switch (cal_qual)
            {
                case CAL_QUALITY.CAL_QUAL_GOOD: return "Good";
                default:
                case CAL_QUALITY.CAL_QUAL_NONE: return "Uncalibrated";
                case CAL_QUALITY.CAL_QUAL_OK: return "OK";
                case CAL_QUALITY.CAL_QUAL_POOR: return "Poor";
            }
        }

        private void set_tuning_variable(int var_id, float val, bool restore_to_defaults)
        {
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[navx_tuning_getset_msg_len]; /* HACK:  Must be 9 bytes to register to the navX MXP */

                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('#');
                buf[2] = (byte)(buf.Length - 2);
                buf[3] = Convert.ToByte(navx_tuning_getset_msg_id);
                // Data
                buf[4] = (byte)(restore_to_defaults ? 2 : 1); /* DATA_SET_TO_DEFAULT : DATA_SET */
                buf[5] = (byte)var_id;
                floatTextTo1616Float(val.ToString(), buf, 6);
                // Footer
                // Checksum is at 10;
                byte checksum = (byte)0;
                for (int i = 0; i < 10; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 10);

                // Terminator begins at 12;
                buf[12] = Convert.ToByte('\r');
                buf[13] = Convert.ToByte('\n');

                try
                {
                    port.Write(buf, 0, buf.Length);
                }
                catch (Exception)
                {
                }
            }
        }
        private void refresh_setting(int var_id)
        {
            request_tuning_variable(var_id);
            DelayMilliseconds(35);
            var_refresh();
        }


        private class KauaiLabsDfuTargetDescriptor
        {
            string hex_file_prefix;
            string product_id;
            int product_generation;
            byte required_bootloader_id;
            int required_flash_size_k;

            public KauaiLabsDfuTargetDescriptor(string hex_file_prefix, string product_id, int product_generation, byte required_bootloader_id, int required_flash_size_k)
            {
                this.hex_file_prefix = hex_file_prefix;
                this.product_id = product_id;
                this.product_generation = product_generation;
                this.required_bootloader_id = required_bootloader_id;
                this.required_flash_size_k = required_flash_size_k;
            }

            public bool MatchHexFileName(string hex_file_path)
            {
                string filename = Path.GetFileName(hex_file_path);

                if (!filename.Contains('_')) return false;

                string[] parts = filename.Split(new char[] { '_' });
                if (parts.Length != 2) return false;

                return (filename.ToUpper().StartsWith(hex_file_prefix));
            }
            public string ProductId() { return this.product_id; }
            public int ProductGeneration() { return this.product_generation; }

            public byte RequiredBootloaderID() { return this.required_bootloader_id; }

            public int RequiredFlashSizeK() { return this.required_flash_size_k; }

            public bool Match(string firmware_path, byte bootloader_id, int flash_size_k, out string error_string)
            {
                bool match = true;
                error_string = "";
                string error_desc = "";
                if (this.required_bootloader_id != bootloader_id)
                {
                    match = false;
                    error_desc += "- Mismatched DFU Bootloader ID (requires 0x" + required_bootloader_id.ToString("X2") + ", is 0x" + bootloader_id.ToString("X2") + ").";
                }
                if (this.required_flash_size_k > flash_size_k)
                {
                    match = false;
                    error_desc += "- Insufficient Target Flash Memory (requires " + required_flash_size_k.ToString("N") + ", is " + flash_size_k.ToString("N") + ").";
                }
                if (!match)
                {
                    string firmware_file_name = Path.GetFileName(firmware_path);
                    error_string = "The selected navX-Model firmware:" + Environment.NewLine + Environment.NewLine;
                    error_string += "\t" + firmware_file_name + Environment.NewLine + Environment.NewLine;
                    error_string += "does not match the currently-connected DFU Device:" + Environment.NewLine + Environment.NewLine;
                    error_string += error_desc;
                } 
                return match;
            }


        }
        // NOTE:  BootloaderID 0x90 is used on STM32F446, Bootloader ID 0xD0 is used on STM32F411
        // NOTE:  KauaiLabs Hex File Name format:  <product>_<version>.<extension>
        // Currently, only the .hex file extension is valid

        KauaiLabsDfuTargetDescriptor[] product_dfu_target_map = new KauaiLabsDfuTargetDescriptor[]
        {
            new KauaiLabsDfuTargetDescriptor( "NAVX-MXP",       "navX-MXP (Classic)",   1, 0xD0, 256 ),
            new KauaiLabsDfuTargetDescriptor( "NAVX2-MXP",      "navX2-MXP (Gen 2)",    2, 0x90, 512 ),
            new KauaiLabsDfuTargetDescriptor( "NAVX-MICRO",     "navX-Micro (Classic)", 1, 0xD0, 256 ),
            new KauaiLabsDfuTargetDescriptor( "NAVX2-MICRO",    "navX2-Micro (Gen 2)",  2, 0x90, 512 ),
            new KauaiLabsDfuTargetDescriptor( "VMX-PI",         "VMX-pi (Classic)",     1, 0xD0, 512 ),
            new KauaiLabsDfuTargetDescriptor( "VMX2-PI",        "VMX2-pi (Gen 2)",      2, 0x90, 512 )
        };

        private KauaiLabsDfuTargetDescriptor GetDfuTargetDescriptorFromHexFileName(string path, out string version)
        {
            version = "";

            string filename = Path.GetFileName(path);

            if (!filename.Contains('_')) return null;

            string[] parts = filename.Split(new char[] { '_' });
            if (parts.Length != 2) return null;          

            foreach (KauaiLabsDfuTargetDescriptor desc in product_dfu_target_map)
            {
                if (desc.MatchHexFileName(filename))
                {
                    version = parts[1];
                    string hex_extension_uc = ".HEX";
                    if (version.ToUpperInvariant().EndsWith(hex_extension_uc))
                    {
                        version = version.Substring(0, version.Length - hex_extension_uc.Length);
                    }
                    return desc;
                }
            }

            return null;
        }

        private void sensor_fusion_data(){
        if (datalog_writer == null){
            var homedrive = System.Environment.GetEnvironmentVariable("HOMEDRIVE"); //Directory
            var homepath = System.Environment.GetEnvironmentVariable("HOMEPATH"); //Directory
            var formattedDate = DateTime.Now.ToString("MM_dd_yyyy_HH_mm_ss");
            var datafile_name = homedrive + homepath + "\\Desktop" + "\\" + "navXSensorFusionData_" + formattedDate + ".csv";
            Console.Error.WriteLine(datafile_name);
            try
            {
                datalog_writer = new System.IO.StreamWriter(datafile_name);
                var header = "1_+90,1_-90,2_+90,2_-90,3_+90,3_-90,4_+90,4_-90,5_+90,5_-90,ratio,f/w,id";
                datalog_writer.WriteLine(header);
                
            } catch(Exception ex)
            {
                Console.Error.WriteLine(ex.Message);
            }
        }
        else{
            if (datalog_writer != null){
                datalog_writer.Close();
                datalog_writer = null;
            }
        }

        }

        //navMagCal

        //This function closes the already open port
        // private void close_port_mag(){
        //     port_close_flag = true;
        //     Thread.Sleep(500);
        //     port.Close();
        //     empty_serial_data_counter = 0;
        //     bytes_from_usart = null;
        //     num_bytes_from_usart = 0;
        //     X_serial_value = 0;
        //     Y_serial_value = 0;
        //     Z_serial_value = 0;
        // }

        const int navx_ahrs_update_length = 66;
        const char navx_ahrs_update_msg_type = 'a';
        const char navx_mag_cal_data_msg_type = 'M';
        const int navx_mag_cal_data_msg_length = 55;
        const char navx_tuning_var_msg_type = 'T';
        const int navx_tuning_var_msg_length = 14;
        

        private void var_refresh_mag()
        {
            /* TODO:  This portion should be a critical section, to ensure */
            /* receival of new bytes during the following block is prohibited */
            byte[] usart_bytes;
            int usart_data_offset;
            int n_bytes_from_usart;
            lock (bufferLock)
            {
                if (bytes_from_usart == null) return;
                if (num_bytes_from_usart == 0) return;
                n_bytes_from_usart = num_bytes_from_usart;
                usart_data_offset = bytes_from_usart_offset;
                usart_bytes = new byte[n_bytes_from_usart];
                System.Buffer.BlockCopy(bytes_from_usart, 0, usart_bytes, 0, n_bytes_from_usart);
                bytes_from_usart = null;
            }
            /* End of proposed critical section */
            num_bytes_from_usart = 0;
            try
            {
                int valid_bytes_available = n_bytes_from_usart - bytes_from_usart_offset;
                bool end_of_data = false;
                while ( !end_of_data ) 
                {
                    if ((usart_bytes != null) && (valid_bytes_available >= 2))
                    {
                        if ( (usart_bytes[usart_data_offset] == Convert.ToByte(navx_msg_start_char) ) &&
                             (usart_bytes[usart_data_offset+1] == Convert.ToByte(navx_binary_msg_indicator) ) )
                        {
                            /* Valid packet start found */
                            if ( (usart_bytes[usart_data_offset + 2] == navx_ahrs_update_length-2) &&
                                 (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_ahrs_update_msg_type)))
                            {
                                /* AHRS Update packet received */
                                byte[] bytes = new byte[navx_ahrs_update_length];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_ahrs_update_length);
                                valid_bytes_available -= navx_ahrs_update_length;
                                usart_data_offset += navx_ahrs_update_length;

                                float yawval            = signedHundredthsToFloat(bytes, 4);
                                float rollval           = signedHundredthsToFloat(bytes, 6);
                                float pitchval          = signedHundredthsToFloat(bytes, 8);
                                float heading           = unsignedHudredthsToFloat(bytes, 10);
                                float altitude          = text1616FloatToFloat(bytes, 12);
                                float fused_heading     = unsignedHudredthsToFloat(bytes, 16);
                                float linear_accel_x    = signedThousandthsToFloat(bytes, 18);
                                float linear_accel_y    = signedThousandthsToFloat(bytes, 20);
                                float linear_accel_z    = signedThousandthsToFloat(bytes, 22);
                                Int16 cal_mag_x         = BitConverter.ToInt16(bytes, 24);
                                Int16 cal_mag_y         = BitConverter.ToInt16(bytes, 26);
                                Int16 cal_mag_z         = BitConverter.ToInt16(bytes, 28);
                                float mag_norm_ratio    = unsignedHudredthsToFloat(bytes, 30);
                                float mag_norm_scalar   = text1616FloatToFloat(bytes, 32);
                                float mpu_temp          = signedHundredthsToFloat(bytes, 36);
                                Int16 raw_mag_x         = BitConverter.ToInt16(bytes, 38);
                                Int16 raw_mag_y         = BitConverter.ToInt16(bytes, 40);
                                Int16 raw_mag_z         = BitConverter.ToInt16(bytes, 42);
                                Int16 quat_w            = BitConverter.ToInt16(bytes, 44);
                                Int16 quat_x            = BitConverter.ToInt16(bytes, 46);
                                Int16 quat_y            = BitConverter.ToInt16(bytes, 48);
                                Int16 quat_z            = BitConverter.ToInt16(bytes, 50);
                                float baro_pressure     = text1616FloatToFloat(bytes, 52);
                                float baro_temp         = signedHundredthsToFloat(bytes, 56);
                                byte op_status          = bytes[58];
                                byte sensor_status      = bytes[59];
                                byte cal_status         = bytes[60];
                                byte selftest_status    = bytes[61];

                                X_serial_value = (double)raw_mag_x;
                                Y_serial_value = (double)raw_mag_y;
                                Z_serial_value = (double)raw_mag_z;

                                MagCalValues[0] = X_serial_value.ToString();
                                MagCalValues[1] = Y_serial_value.ToString();
                                MagCalValues[2] = Z_serial_value.ToString();
                                
                                navxui_values[0] =linear_accel_x.ToString();
                                navxui_values[1] = linear_accel_y.ToString();
                                navxui_values[2] = linear_accel_z.ToString();
                                navxui_values[3] = heading.ToString();
                                navxui_values[4] = mpu_temp.ToString();

                                yaw_value = yawval.ToString();
                                pitch_value = pitchval.ToString();
                                roll_value = rollval.ToString();
                                

                                if ((last_mag_x != raw_mag_x) ||
                                     (last_mag_y != raw_mag_y) ||
                                     (last_mag_z != raw_mag_z))
                                {
                                    String row = raw_mag_x + "," + raw_mag_y + "," + raw_mag_z;

                                    last_mag_x = raw_mag_x;
                                    last_mag_y = raw_mag_y;
                                    last_mag_z = raw_mag_z;
                                }
                                if (datalog_writer != null)
                                {
                                    bool magnetic_disturbance = ((sensor_status & 0x04) != 0);
                                }
                            }
                            else if ((usart_bytes[usart_data_offset + 2] == navx_mag_cal_data_msg_length - 2) &&
                                     (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_mag_cal_data_msg_type)))
                                {
                                /* Mag Cal Data Response received */
                                byte[] bytes = new byte[navx_mag_cal_data_msg_length];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_mag_cal_data_msg_length);
                                valid_bytes_available -= navx_mag_cal_data_msg_length;
                                usart_data_offset += navx_mag_cal_data_msg_length;

                                Int16 bias_x = BitConverter.ToInt16(bytes, 5);
                                Int16 bias_y = BitConverter.ToInt16(bytes, 7);
                                Int16 bias_z = BitConverter.ToInt16(bytes, 9);
                                float xform_x_x = text1616FloatToFloat(bytes, 11);
                                float xform_x_y = text1616FloatToFloat(bytes, 15);
                                float xform_x_z = text1616FloatToFloat(bytes, 19);
                                float xform_y_x = text1616FloatToFloat(bytes, 23);
                                float xform_y_y = text1616FloatToFloat(bytes, 27);
                                float xform_y_z = text1616FloatToFloat(bytes, 31);
                                float xform_z_x = text1616FloatToFloat(bytes, 35);
                                float xform_z_y = text1616FloatToFloat(bytes, 39);
                                float xform_z_z = text1616FloatToFloat(bytes, 43);

                                biasmatrix[0] = bias_x.ToString();
                                biasmatrix[1] = bias_y.ToString();
                                biasmatrix[2] = bias_z.ToString();
                                xmatrix[0] = xform_x_x.ToString();
                                xmatrix[1] = xform_x_y.ToString();
                                xmatrix[2] = xform_x_z.ToString();
                                ymatrix[0] = xform_y_x.ToString();
                                ymatrix[1] = xform_y_y.ToString();
                                ymatrix[2] = xform_y_z.ToString();
                                zmatrix[0] = xform_z_x.ToString();
                                zmatrix[1] = xform_z_y.ToString();
                                zmatrix[2] = xform_z_z.ToString();
                            }
                            else if ((usart_bytes[usart_data_offset + 2] == navx_board_id_msg_length - 2) &&
                                     (usart_bytes[usart_data_offset + 3] == Convert.ToByte(navx_board_id_msg_type)))
                            {
                                /* Mag Cal Data Response received */
                                byte[] bytes = new byte[navx_board_id_msg_length];
                                System.Buffer.BlockCopy(usart_bytes, usart_data_offset, bytes, 0, navx_board_id_msg_length);
                                valid_bytes_available -= navx_board_id_msg_length;
                                usart_data_offset += navx_board_id_msg_length;
                                byte boardtype = bytes[4];
                                byte hwrev = bytes[5];
                                byte fw_major = bytes[6];
                                byte fw_minor = bytes[7];
                                UInt16 fw_revision = BitConverter.ToUInt16(bytes, 8);
                                byte[] unique_id = new byte[12];
                                for (int i = 0; i < 12; i++)
                                {
                                    unique_id[i] = bytes[10 + i];
                                }
                                string boardtype_string = "unknown";
                                if (hwrev == 33)
                                {
                                    boardtype_string = "navX-MXP (Classic)";
                                }
                                else if (hwrev == 34)
                                {
                                    boardtype_string = "navX2-MXP (Gen 2)";
                                }
                                else if (hwrev == 40) 
                                {
                                    boardtype_string = "navX-Micro (Classic)";
                                }
                                else if (hwrev == 41)
                                {
                                    boardtype_string = "navX2-Micro (Gen 2)";
                                }
                                else if ((hwrev >= 60) && (hwrev <= 69)) 
                                {
									boardtype_string = "VMX-pi";
								}
                                string msg = "Board type:  " + boardtype_string + " (" + boardtype + ")\n" +
                                                 "H/W Rev:  " + hwrev + "\n" +
                                                 "F/W Rev:  " + fw_major + "." + fw_minor + "." + fw_revision + "\n" +
                                                 "Unique ID:  ";
                                msg += BitConverter.ToString(unique_id);
                             }
                            else
                            {
                                // Start of packet found, but not wanted
                                valid_bytes_available -= 1;
                                usart_data_offset += 1;
                                // Keep scanning through the remainder of the buffer
                            }
                        }
                        else 
                        {
                            // Data available, but first char is not a valid start of message.
                            // Keep scanning through the remainder of the buffer
                            valid_bytes_available -= 1;
                            usart_data_offset += 1;
                        }
                    }
                    else 
                    {
                        // At end of buffer, stop scanning
                        end_of_data = true;
                    }
                    /*
                    string[] serial_values = string_from_usart.Split(',');
                    if (serial_values[0] != "" && serial_values[1] != "" && serial_values[2] != "")
                    {
                        X_serial_value = double.Parse(serial_values[0]);
                        Y_serial_value = double.Parse(serial_values[1]);
                        Z_serial_value = double.Parse(serial_values[2]);
                    }*/
                }
                //empty_serial_data_counter++;
                if (empty_serial_data_counter >= 10)
                {
                    //close_port_mag();
                }
            }
            catch ( Exception )
            {
                //close_port_mag();
            }
        }

        // private void indication() //fix here
        // {
        //     //Xlabel.Text = "X = " + X_serial_value.ToString("0.###");
        //     //Ylabel.Text = "Y = " + Y_serial_value.ToString("0.###");
        //     //Zlabel.Text = "Z = " + Z_serial_value.ToString("0.###");
        // }

        // private void timer1_Tick(object sender, EventArgs e)
        // {
        //     var_refresh_mag();
        //     indication();
        // }
        
         private void send_ahrs_stream_request()
        {
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[10];

                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('S');
                // Data
                buf[2] = Convert.ToByte('a');
                byte update_rate_hz = 50;
                CharToHex(update_rate_hz, buf, 3);
                // Footer
                // Checksum is at 5;
                byte checksum = (byte)0;
                for (int i = 0; i < 5; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 5);

                // Terminator begins at 7;
                buf[7] = Convert.ToByte('\r');
                buf[8] = Convert.ToByte('\n');
                try
                {
                    port.Write(buf, 0, buf.Length);
                }
                catch (Exception)
                {
                }
            }
        }

        private void calculate_transformation_matrix(){
            //Axis X--------------------------------------------------------------------------------------------------
            double[] Xplus_center = new double[3];
            //Centers of the circles
            Xplus_center[0] = (double.Parse(xplus_0_values[0]) + double.Parse(xplus_180_values[0])) / 2;
            Xplus_center[1] = (double.Parse(xplus_0_values[1]) + double.Parse(xplus_180_values[1])) / 2;
            Xplus_center[2] = (double.Parse(xplus_0_values[2]) + double.Parse(xplus_180_values[2])) / 2;
            //Centers of the circles
            double[] Xminus_center = new double[3];
            Xminus_center[0] = (double.Parse(xminus_0_values[0]) + double.Parse(xminus_180_values[0])) / 2;
            Xminus_center[1] = (double.Parse(xminus_0_values[1]) + double.Parse(xminus_180_values[1])) / 2;
            Xminus_center[2] = (double.Parse(xminus_0_values[2]) + double.Parse(xminus_180_values[2])) / 2;
            //Vector from the center of minus circle to the center of plus circle
            double[] Xvector = new double[3];
            Xvector[0] = Xplus_center[0] - Xminus_center[0];
            Xvector[1] = Xplus_center[1] - Xminus_center[1];
            Xvector[2] = Xplus_center[2] - Xminus_center[2];

            //Axis Y--------------------------------------------------------------------------------------------------
            double[] Yplus_center = new double[3];
            //Centers of the circles
            Yplus_center[0] = (double.Parse(yplus_0_values[0]) + double.Parse(yplus_180_values[0])) / 2;
            Yplus_center[1] = (double.Parse(yplus_0_values[1]) + double.Parse(yplus_180_values[1])) / 2;
            Yplus_center[2] = (double.Parse(yplus_0_values[2]) + double.Parse(yplus_180_values[2])) / 2;
            //Centers of the circles
            double[] Yminus_center = new double[3];
            Yminus_center[0] = (double.Parse(yminus_0_values[0]) + double.Parse(yminus_180_values[0])) / 2;
            Yminus_center[1] = (double.Parse(yminus_0_values[1]) + double.Parse(yminus_180_values[1])) / 2;
            Yminus_center[2] = (double.Parse(yminus_0_values[2]) + double.Parse(yminus_180_values[2])) / 2;
            //Vector from the center of minus circle to the center of plus circle
            double[] Yvector = new double[3];
            Yvector[0] = Yplus_center[0] - Yminus_center[0];
            Yvector[1] = Yplus_center[1] - Yminus_center[1];
            Yvector[2] = Yplus_center[2] - Yminus_center[2];

            //Axis Z--------------------------------------------------------------------------------------------------
            double[] Zplus_center = new double[3];
            //Centers of the circles
            Zplus_center[0] = (double.Parse(zplus_0_values[0]) + double.Parse(zplus_180_values[0])) / 2;
            Zplus_center[1] = (double.Parse(zplus_0_values[1]) + double.Parse(zplus_180_values[1])) / 2;
            Zplus_center[2] = (double.Parse(zplus_0_values[2]) + double.Parse(zplus_180_values[2])) / 2;
            //Centers of the circles
            double[] Zminus_center = new double[3];
            Zminus_center[0] = (double.Parse(zminus_0_values[0]) + double.Parse(zminus_180_values[0])) / 2;
            Zminus_center[1] = (double.Parse(zminus_0_values[1]) + double.Parse(zminus_180_values[1])) / 2;
            Zminus_center[2] = (double.Parse(zminus_0_values[2]) + double.Parse(zminus_180_values[2])) / 2;
            //Vector from the center of minus circle to the center of plus circle
            double[] Zvector = new double[3];
            Zvector[0] = Zplus_center[0] - Zminus_center[0];
            Zvector[1] = Zplus_center[1] - Zminus_center[1];
            Zvector[2] = Zplus_center[2] - Zminus_center[2];

            // Rotation matrix--------------------------------------------------------------------------------------
            // rotation_matrix[a][b], a - number of the rows, b - number of the columbs
            double[][] rotation_matrix = new double[3][];
            rotation_matrix[0] = new double[3];
            rotation_matrix[1] = new double[3];
            rotation_matrix[2] = new double[3];
            //Deviding by main value, for example for X axis - deviding by X coordinate, for Y axis by Y coordinate, for Z axis by Z cordinate
            rotation_matrix[0][0] = Xvector[0] / Xvector[0]; rotation_matrix[0][1] = Yvector[0] / Yvector[1]; rotation_matrix[0][2] = Zvector[0] / Zvector[2];
            rotation_matrix[1][0] = Xvector[1] / Xvector[0]; rotation_matrix[1][1] = Yvector[1] / Yvector[1]; rotation_matrix[1][2] = Zvector[1] / Zvector[2];
            rotation_matrix[2][0] = Xvector[2] / Xvector[0]; rotation_matrix[2][1] = Yvector[2] / Yvector[1]; rotation_matrix[2][2] = Zvector[2] / Zvector[2];
            //Matrix inversion
            rotation_matrix = InvertMatrix(rotation_matrix);

            //Determinating of the corrected by ratation matrix centers of the circles 
            Xplus_center = MatrixVectorMultiply(rotation_matrix, Xplus_center);
            Xminus_center = MatrixVectorMultiply(rotation_matrix, Xminus_center);
            Yplus_center = MatrixVectorMultiply(rotation_matrix, Yplus_center);
            Yminus_center = MatrixVectorMultiply(rotation_matrix, Yminus_center);
            Zplus_center = MatrixVectorMultiply(rotation_matrix, Zplus_center);
            Zminus_center = MatrixVectorMultiply(rotation_matrix, Zminus_center);

            //Determinating of the elipsoid center---------------------------------------------------------------------------
            double[] center = new double[3];
            center[0] = (Xplus_center[0] + Xminus_center[0] + Yplus_center[0] + Yminus_center[0] + Zplus_center[0] + Zminus_center[0]) / 6;
            center[1] = (Xplus_center[1] + Xminus_center[1] + Yplus_center[1] + Yminus_center[1] + Zplus_center[1] + Zminus_center[1]) / 6;
            center[2] = (Xplus_center[2] + Xminus_center[2] + Yplus_center[2] + Yminus_center[2] + Zplus_center[2] + Zminus_center[2]) / 6;

            //Determinating of the radius of the future sphere-----------------------------------------------------------------------
            double x_length = Math.Abs(Xplus_center[0] - Xminus_center[0])/2;
            double y_length = Math.Abs(Yplus_center[1] - Yminus_center[1])/2;
            double z_length = Math.Abs(Zplus_center[2] - Zminus_center[2])/2;
            double[] Xplus_0 = new double[3];
            Xplus_0[0] = double.Parse(xplus_0_values[0]); 
            Xplus_0[1] = double.Parse(xplus_0_values[1]); 
            Xplus_0[2] = double.Parse(xplus_0_values[2]);
            Xplus_0 = MatrixVectorMultiply(rotation_matrix, Xplus_0);
            double[] Yplus_0 = new double[3];
            Yplus_0[0] = double.Parse(yplus_0_values[0]);
            Yplus_0[1] = double.Parse(yplus_0_values[1]);
            Yplus_0[2] = double.Parse(yplus_0_values[2]);
            Yplus_0 = MatrixVectorMultiply(rotation_matrix, Yplus_0);
            double[] Zplus_0 = new double[3];
            Zplus_0[0] = double.Parse(zplus_0_values[0]);
            Zplus_0[1] = double.Parse(zplus_0_values[1]);
            Zplus_0[2] = double.Parse(zplus_0_values[2]);
            Zplus_0 = MatrixVectorMultiply(rotation_matrix, Zplus_0);
            double x_abs = Math.Sqrt(x_length * x_length + Xplus_0[1] * Xplus_0[1] + Xplus_0[2] * Xplus_0[2]);
            double y_abs = Math.Sqrt(Yplus_0[0] * Yplus_0[0] + y_length * y_length + Yplus_0[2] * Yplus_0[2]);
            double z_abs = Math.Sqrt(Zplus_0[0] * Zplus_0[0] + Zplus_0[1] * Zplus_0[1] + z_length * z_length);
            //sphere radius
            double sphere_radius = (x_abs + y_abs + z_abs) / 3;

            //Scales for the each axis------------------------------------------------
            //Diameter of the sphere
            double diameter = sphere_radius * 2;
            double kx = Math.Abs(diameter / (Xplus_center[0] - Xminus_center[0]));
            double ky = Math.Abs(diameter / (Yplus_center[1] - Yminus_center[1]));
            double kz = Math.Abs(diameter / (Zplus_center[2] - Zminus_center[2]));

            //Multiplying elements of matrix by scales
            rotation_matrix[0][0] = rotation_matrix[0][0] * kx; rotation_matrix[0][1] = rotation_matrix[0][1] * ky; rotation_matrix[0][2] = rotation_matrix[0][2] * kz;
            rotation_matrix[1][0] = rotation_matrix[1][0] * kx; rotation_matrix[1][1] = rotation_matrix[1][1] * ky; rotation_matrix[1][2] = rotation_matrix[1][2] * kz;
            rotation_matrix[2][0] = rotation_matrix[2][0] * kx; rotation_matrix[2][1] = rotation_matrix[2][1] * ky; rotation_matrix[2][2] = rotation_matrix[2][2] * kz;
            
            //Bias
            double[] bias = new double[3];
            bias[0] = center[0];
            bias[1] = center[1];
            bias[2] = center[2];

            //Indication
            //Transformation matrix
            xmatrix[0] = rotation_matrix[0][0].ToString("0.###"); ymatrix[0] = rotation_matrix[0][1].ToString("0.###"); zmatrix[0] = rotation_matrix[0][2].ToString("0.###");
            xmatrix[1] = rotation_matrix[1][0].ToString("0.###"); ymatrix[1] = rotation_matrix[1][1].ToString("0.###"); zmatrix[1] = rotation_matrix[1][2].ToString("0.###");
            xmatrix[2] = rotation_matrix[2][0].ToString("0.###"); ymatrix[2] = rotation_matrix[2][1].ToString("0.###"); zmatrix[2] = rotation_matrix[2][2].ToString("0.###");
            //Bias
            biasmatrix[0] = bias[0].ToString("0.###");
            biasmatrix[1] = bias[1].ToString("0.###");
            biasmatrix[2] = bias[2].ToString("0.###");
        }
        
        public static double[] MatrixVectorMultiply(double[][] matrixA, double[] vectorB)
        {
            int aRows = matrixA.Length; int aCols = matrixA[0].Length;
            int bRows = vectorB.Length;
            if (aCols != bRows)
                throw new Exception("Non-conformable matrices in MatrixProduct");
            double[] result = new double[aRows];
            for (int i = 0; i < aRows; ++i) // each row of A
                for (int k = 0; k < aCols; ++k)
                    result[i] += matrixA[i][k] * vectorB[k];
            return result;
        }

        public static double[][] InvertMatrix(double[][] A)
        {
            int n = A.Length;
            //e will represent each column in the identity matrix
            double[] e;
            //x will hold the inverse matrix to be returned
            double[][] x = new double[n][];
            for (int i = 0; i < n; i++)
            {
                x[i] = new double[A[i].Length];
            }
            /*
            * solve will contain the vector solution for the LUP decomposition as we solve
            * for each vector of x.  We will combine the solutions into the double[][] array x.
            * */
            double[] solve;

            //Get the LU matrix and P matrix (as an array)
            Tuple<double[][], int[]> results = LUPDecomposition(A);

            double[][] LU = results.Item1;
            int[] P = results.Item2;

            /*
            * Solve AX = e for each column ei of the identity matrix using LUP decomposition
            * */
            for (int i = 0; i < n; i++)
            {
                e = new double[A[i].Length];
                e[i] = 1;
                solve = LUPSolve(LU, P, e);
                for (int j = 0; j < solve.Length; j++)
                {
                    x[j][i] = solve[j];
                }
            }
            return x;
        }

        public static double[] LUPSolve(double[][] LU, int[] pi, double[] b)
        {
            int n = LU.Length - 1;
            double[] x = new double[n + 1];
            double[] y = new double[n + 1];
            double suml = 0;
            double sumu = 0;
            double lij = 0;

            /*
            * Solve for y using formward substitution
            * */
            for (int i = 0; i <= n; i++)
            {
                suml = 0;
                for (int j = 0; j <= i - 1; j++)
                {
                    /*
                    * Since we've taken L and U as a singular matrix as an input
                    * the value for L at index i and j will be 1 when i equals j, not LU[i][j], since
                    * the diagonal values are all 1 for L.
                    * */
                    if (i == j)
                    {
                        lij = 1;
                    }
                    else
                    {
                        lij = LU[i][j];
                    }
                    suml = suml + (lij * y[j]);
                }
                y[i] = b[pi[i]] - suml;
            }
            //Solve for x by using back substitution
            for (int i = n; i >= 0; i--)
            {
                sumu = 0;
                for (int j = i + 1; j <= n; j++)
                {
                    sumu = sumu + (LU[i][j] * x[j]);
                }
                x[i] = (y[i] - sumu) / LU[i][i];
            }
            return x;
        }

        public static Tuple<double[][], int[]> LUPDecomposition(double[][] A)
        {
            int n = A.Length - 1;
            /*
            * pi represents the permutation matrix.  We implement it as an array
            * whose value indicates which column the 1 would appear.  We use it to avoid 
            * dividing by zero or small numbers.
            * */
            int[] pi = new int[n + 1];
            double p = 0;
            int kp = 0;
            int pik = 0;
            int pikp = 0;
            double aki = 0;
            double akpi = 0;

            //Initialize the permutation matrix, will be the identity matrix
            for (int j = 0; j <= n; j++)
            {
                pi[j] = j;
            }

            for (int k = 0; k <= n; k++)
            {
                /*
                * In finding the permutation matrix p that avoids dividing by zero
                * we take a slightly different approach.  For numerical stability
                * We find the element with the largest 
                * absolute value of those in the current first column (column k).  If all elements in
                * the current first column are zero then the matrix is singluar and throw an
                * error.
                * */
                p = 0; 
                for (int i = k; i <= n; i++)
                {
                    if (Math.Abs(A[i][k]) > p)
                    {
                        p = Math.Abs(A[i][k]);
                        kp = i;
                    }
                }
                if (p == 0)
                {
                    throw new Exception("singular matrix");
                }
                /*
                * These lines update the pivot array (which represents the pivot matrix)
                * by exchanging pi[k] and pi[kp].
                * */
                pik = pi[k];
                pikp = pi[kp];
                pi[k] = pikp;
                pi[kp] = pik;

                /*
                * Exchange rows k and kpi as determined by the pivot
                * */
                for (int i = 0; i <= n; i++)
                {
                    aki = A[k][i];
                    akpi = A[kp][i];
                    A[k][i] = akpi;
                    A[kp][i] = aki;
                }

                /*
                    * Compute the Schur complement
                    * */
                for (int i = k + 1; i <= n; i++)
                {
                    A[i][k] = A[i][k] / A[k][k];
                    for (int j = k + 1; j <= n; j++)
                    {
                        A[i][j] = A[i][j] - (A[i][k] * A[k][j]);
                    }
                }
            }
            return Tuple.Create(A, pi);
        }

        private void savetodevice(){
            if (port.IsOpen)
            {
                Byte[] buf = new Byte[55];

                // Header
                buf[0] = Convert.ToByte('!');
                buf[1] = Convert.ToByte('#');
                buf[2] = (byte)(buf.Length - 2);
                buf[3] = Convert.ToByte('M');
                buf[3] = Convert.ToByte('M');

                // Data
                buf[4] = 1; /* 1 = Set */
                floatTextToint16_buf(biasmatrix[0], buf,5);
                floatTextToint16_buf(biasmatrix[1], buf, 7);
                floatTextToint16_buf(biasmatrix[2], buf, 9);
                floatTextTo1616Float(xmatrix[0], buf, 11);
                floatTextTo1616Float(xmatrix[1], buf, 15);
                floatTextTo1616Float(xmatrix[2], buf, 19);
                floatTextTo1616Float(ymatrix[0], buf, 23);
                floatTextTo1616Float(ymatrix[1], buf, 27);
                floatTextTo1616Float(ymatrix[2], buf, 31);
                floatTextTo1616Float(zmatrix[0], buf, 35);
                floatTextTo1616Float(zmatrix[1], buf, 39);
                floatTextTo1616Float(zmatrix[2], buf, 43);

                float x, y, z;
                float bias_x, bias_y, bias_z;
                float mag_field_norm_total = 0;
                bias_x = Convert.ToSingle(biasmatrix[0]);
                bias_y = Convert.ToSingle(biasmatrix[1]);
                bias_z = Convert.ToSingle(biasmatrix[2]);
                x = Convert.ToSingle(xplus_0_values[0]) - bias_x;
                y = Convert.ToSingle(xplus_0_values[1]) - bias_y;
                z = Convert.ToSingle(xplus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(xminus_0_values[0]) - bias_x;
                y = Convert.ToSingle(xminus_0_values[1]) - bias_y;
                z = Convert.ToSingle(xminus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(yplus_0_values[0]) - bias_x;
                y = Convert.ToSingle(yplus_0_values[1]) - bias_y;
                z = Convert.ToSingle(yplus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(yminus_0_values[0]) - bias_x;
                y = Convert.ToSingle(yminus_0_values[1]) - bias_y;
                z = Convert.ToSingle(yminus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(zplus_0_values[0]) - bias_x;
                y = Convert.ToSingle(zplus_0_values[1]) - bias_y;
                z = Convert.ToSingle(zplus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(zminus_0_values[0]) - bias_x;
                y = Convert.ToSingle(zminus_0_values[1]) - bias_y;
                z = Convert.ToSingle(zminus_0_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(xplus_180_values[0]) - bias_x;
                y = Convert.ToSingle(xplus_180_values[1]) - bias_y;
                z = Convert.ToSingle(xplus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(xminus_180_values[0]) - bias_x;
                y = Convert.ToSingle(xminus_180_values[1]) - bias_y;
                z = Convert.ToSingle(xminus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(yplus_180_values[0]) - bias_x;
                y = Convert.ToSingle(yplus_180_values[1]) - bias_y;
                z = Convert.ToSingle(yplus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(yminus_180_values[0]) - bias_x;
                y = Convert.ToSingle(yminus_180_values[1]) - bias_y;
                z = Convert.ToSingle(yminus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(zplus_180_values[0]) - bias_x;
                y = Convert.ToSingle(zplus_180_values[1]) - bias_y;
                z = Convert.ToSingle(zplus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                x = Convert.ToSingle(zminus_180_values[0]) - bias_x;
                y = Convert.ToSingle(zminus_180_values[1]) - bias_y;
                z = Convert.ToSingle(zminus_180_values[2]) - bias_z;
                mag_field_norm_total += (float)Math.Sqrt((x * x) + (y * y) + (z * z));
                float mag_field_norm_avg = mag_field_norm_total / 12.0f;
                string earth_mag_field_norm = Convert.ToString(mag_field_norm_avg);

                floatTextTo1616Float(earth_mag_field_norm, buf, 47);

                // Footer
                // Checksum is at 51;
                byte checksum = (byte)0;
                for (int i = 0; i < 51; i++)
                {
                    checksum += (byte)buf[i];
                }
                CharToHex(checksum, buf, 51);

                // Terminator begins at 53;
                buf[53] = Convert.ToByte('\r');
                buf[54] = Convert.ToByte('\n');

                try
                {
                    port.Write(buf, 0, buf.Length);
                }
                catch(Exception)
                {

                }
            }
        }

        private void send_magcal_data_request()
        {
            send_board_data_request(1);
        }
        
    }   
}
