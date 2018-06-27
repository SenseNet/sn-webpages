************************************************************************************
                                  sensenet platform
                                       WebPages
************************************************************************************

To finalize the installation and get started with sensenet WebPages, please follow these steps:

1. Please make sure that you have the SenseNet.Services base component installed.

2. Change the Global.asax.cs codebehind: the application class should inherit from SenseNet.Portal.SenseNetGlobal
   Please note that this is a different base class from the one in the Services layer!

3. OPTIONAL: Configure SignalR
   If you want to use SignalR features in your solution (for example the Task Monitor page in the Task Management 
   component) then please add the app.MapSignalR() call in your Startup class to the Configuration method so that 
   SignalR hubs are configured correctly when the application starts.

   For example:

   public partial class Startup
   {
       public void Configuration(IAppBuilder app)
       {
           ConfigureAuth(app);

           // this is necessary for sensenet
           app.MapSignalR();
       }
   }

4. Build your solution, make sure that there are no build errors.

5. Install the sensenet WebPages component
    - open a command line and go to the \Admin\bin folder in your web folder
    - execute the install-webpages command with the SnAdmin tool

    .\snadmin install-webpages


You are good to go! Hit F5 and start experimenting with sensenet WebPages!
About how to log in and enter Content Explorer, follow this URL:

    https://github.com/SenseNet/sn-webpages#LogIn

For more information and support, please visit http://sensenet.com