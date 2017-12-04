<%@ Control Language="C#" AutoEventWireup="true" %>
<%@ Import Namespace="SenseNet.Portal.Virtualization" %>
<%@ Import Namespace="SenseNet.BackgroundOperations" %>
<%@ Import Namespace="SenseNet.ContentRepository" %>
<%@ Import Namespace="SenseNet.ContentRepository.Storage.Data" %>
<%@ Import Namespace="SenseNet.ContentRepository.i18n" %>
<sn:scriptrequest id="Scriptrequest1" runat="server" path="$skin/scripts/sn/SN.VersionInfo.js" />
<sn:ScriptRequest ID="Scriptrequest2" runat="server" Path="$skin/scripts/kendoui/kendo.web.min.js" />
<sn:CssRequest ID="kendocss1" runat="server" CSSPath="$skin/styles/kendoui/kendo.common.min.css" />
<sn:CssRequest ID="kendocss2" runat="server" CSSPath="$skin/styles/kendoui/kendo.metro.min.css" />
<sn:cssrequest id="CssRequest0" runat="server" csspath="$skin/styles/SN.VersionInfo.css" />

<div id="versionInfoWrapper">
    <h2><%= SenseNetResourceManager.Current.GetString("$VersionInfo,Components") %></h2>
    <div id="componentsGrid"></div>
    <h2><%= SenseNetResourceManager.Current.GetString("$VersionInfo,InstalledPackages") %></h2>
    <div id="installedPackagesGrid"></div>
    <h2><%= SenseNetResourceManager.Current.GetString("$VersionInfo,Assemblies") %></h2>
    <div id="assembliesGrid"></div>
</div>