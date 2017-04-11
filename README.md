# WebPages for sensenet ECM
UI layer for the [sensenet ECM](https://github.com/SenseNet/sensenet) platform built using ASP.NET WebForms **pages**, **portlets** (webparts) and **controls**.

Install this component on top of the main **sensenet ECM Services** layer to get an administrative GUI (called the **Content Explorer**) for managing content items stored in the Content Repository.

> Note that this layer does not contain user-facing interfaces like workspace dashboards and intranet library pages.

You can also build **custom pages** for your solution using our built-in building blocks called [portlets](http://wiki.sensenet.com/Portlet).

![WebPages component](https://raw.githubusercontent.com/SenseNet/sn-resources/master/images/sn-components/sn-components_webforms_gui.png)

## Getting started
### Prerequisites
This components requires [sensenet ECM Services 7.0](https://github.com/SenseNet/sensenet) to be installed in your dev environment and database. Please follow the steps in the link above to complete that before proceeding.

### Installation
You can install the **sensenet ECM WebPages** component from NuGet. Please follow the steps in the *readme.txt* that appears after installing the package in Visual Studio, it involves a few manual steps so that the database contains all the necessary content.

[![NuGet](https://img.shields.io/nuget/v/SenseNet.WebPages.Install.svg)](https://www.nuget.org/packages/SenseNet.WebPages.Install)

#### Dll-only package
If you have **multiple projects** in Visual Studio, you have to install the package above only once of course. If you need to reference **sensenet ECM** libraries in multiple projects, please use this dll-only NuGet package instead:

[![NuGet](https://img.shields.io/nuget/v/SenseNet.WebPages.svg)](https://www.nuget.org/packages/SenseNet.WebPages)

## Log in
After installing this component you will be able to log in to the portal on the **default site's main page**, at this point only accessible through an absolute url (see below the way of removing this limitation):

> http://example.com/Root/Sites/Default_Site

## Content Explorer
Use the default *admin/admin* credentials and enter the admin UI by clicking on the [Portal Remote Control](http://wiki.sensenet.com/Portal_Remote_Control) on the top right corner of the page.

Please follow this link for more details:
- [Content Explorer](http://wiki.sensenet.com/Content_Explorer)

![Content Explorer](https://raw.githubusercontent.com/SenseNet/sn-resources/add-screenshots/images/sn-screenshots/sn-content-explorer.png)

## Site main page
After installing this component and entering Content Explorer, you may notice that there is a single default  site under the /Root/Sites collection. To register your custom url (e.g. *localhost:1234*) with this site, please follow these steps:

- [Set custom url](http://wiki.sensenet.com/How_to_change_url_and_authentication_settings#Steps_for_configuring_URLs_on_the_portal)

After this, you will see the predefined sensenet ECM main page (displaying a simple login portlet) when you visit your custom url; you do not have to use the absolute url mentioned above to access the site main page:

> http://localhost:1234

## MVC views
Note that if you installed sensenet ECM into an ASP.NET application that can may contain MVC views and controllers, you can freely use that technology, you do not have to create sensenset-specific pages. That is only an option, made possible by this WebPages component.

## Custom pages
If you choose to make use of this technology, please take a look at the following articles about building a site using our pages and **smart app model**:

- [How to create a simple Portlet Page](http://wiki.sensenet.com/How_to_create_a_simple_Portlet_Page)
- [How to add a portlet to a page](http://wiki.sensenet.com/How_to_add_a_portlet_to_a_page)
- [How to display a Content Collection on a page](http://wiki.sensenet.com/How_to_display_a_Content_Collection_on_a_page)
- [Smart Pages](http://wiki.sensenet.com/Smart_Pages)
- [Smart Application Model](http://wiki.sensenet.com/Smart_Application_Model)