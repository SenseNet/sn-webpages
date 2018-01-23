# Install sensenet WebPages from NuGet
This article is **for developers** about installing the ASP.NET WebForms-based UI layer of [sensenet ECM](https://github.com/SenseNet) from *NuGet*. Before you can do that, please install the core layer, [sensenet Services](https://github.com/SenseNet/sensenet/tree/master/docs/install-sn-from-nuget.md), which is a prerequisite of this component.

>About choosing the components you need, take look at [this article](https://github.com/SenseNet/sensenet/tree/master/docs/sensenet-components.md) that describes the main components briefly.

![sensenet WebPages](https://github.com/SenseNet/sn-resources/raw/master/images/sn-components/sn-components_webforms.png "sensenet WebPages")


### Web project: pull in the packages

1. Open your web application that already contains the *Services* component installed.
2. Install the following NuGet packages (either in the Package Manager console or the Manage NuGet Packages window)

#### In the web app
Contains installation artifacts (content files, content types, etc).

[![NuGet](https://img.shields.io/nuget/v/SenseNet.WebPages.Install.svg)](https://www.nuget.org/packages/SenseNet.WebPages.Install)

> `Install-Package SenseNet.WebPages.Install`

(this will install the other, dll-only package too, no need to pull that in manually)

#### In other projects
A dll-only package.

[![NuGet](https://img.shields.io/nuget/v/SenseNet.WebPages.svg)](https://www.nuget.org/packages/SenseNet.WebPages)

> `Install-Package SenseNet.WebPages`

### Web app changes
1. Change the Global.asax.cs codebehind: the application class should inherit from the following class: 

   SenseNet.**Portal**.SenseNetGlobal

>Please note that this is a different base class from the one in the Services layer!      

````csharp
    public class MvcApplication : SenseNet.Portal.SenseNetGlobal    
````

2. Configure **SignalR**

In your Startup class, please add the **app.MapSignalR()** call to the *Configuration* method so that SignalR hubs are configured correctly when the application starts.

For example:

```csharp
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);

            // this is necessary for sensenet
            app.MapSignalR();
        }
    }
```

3. **Build your solution**, make sure that there are no build errors.

### Install the sensenet ECM WebPages component
Before installing the component, please make sure that you have access to the Content Repository *SQL database* where you want to install it. The SnAdmin tool will use the connection string in the *[web]\Tools\SnAdminRuntime.exe.config* file to access the db, please check that it contains the appropriate user credentials and server/database name.

Open a **command line** and go to the *[web]\Admin\bin* folder.

Execute the **install-webpages** command with the [SnAdmin](https://github.com/SenseNet/sn-admin) tool.

````text
.\snadmin install-webpages
````

If there were no errors, you are good to go! Hit F5 in Visual Studio and start experimenting with sensenet ECM WebPages!

## After installing sensenet WebPages
After you installed this component, you will be able to log in on the main page and browse, edit or create content on the admin UI ([Content Explorer](http://wiki.sensenet.com/Content_Explorer)).

About how to log in and enter Content Explorer, follow [this URL](https://github.com/SenseNet/sn-webpages#LogIn).
