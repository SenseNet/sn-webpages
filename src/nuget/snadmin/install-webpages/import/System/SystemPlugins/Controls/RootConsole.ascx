<%@ Control Language="C#" AutoEventWireup="true" %>
<%@ Import namespace="SenseNet.ContentRepository.Storage" %>

<sn:CssRequest ID="ref1" CSSPath="/Root/Global/styles/widgets.css" Rel="stylesheet" Media="all" Order="20" runat="server" />
<div class="sn-rootc">
    <div class="sn-floatleft">
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/IMS?action=Explore">
                    <sn:SNIcon Icon="rc-security" ID="ImgSecurity" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/IMS?action=Explore"><%=GetGlobalResourceObject("Controls", "Security")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "SecurityOption")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/Global?action=Explore">
                    <sn:SNIcon Icon="rc-global" ID="ImgGlobal" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/Global?action=Explore"><%=GetGlobalResourceObject("Controls", "Global")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "GlobalResources")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/System?action=Explore">
                    <sn:SNIcon Icon="rc-system" ID="ImgSystem" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/System?action=Explore"><%=GetGlobalResourceObject("Controls", "System")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "SystemFiles")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/System/Schema/ContentTypes?action=Explore">
                    <sn:SNIcon Icon="rc-contenttypes" ID="ImgContentTypes" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/System/Schema/ContentTypes?action=Explore"><%=GetGlobalResourceObject("Controls", "ContentTypes")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "AllContentTypes")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <% if (Node.Exists("/Root/ContentTemplates"))
                   { %>
                <a href="/Root/ContentTemplates?action=Explore">
                    <sn:SNIcon Icon="rc-contenttemplates" ID="ImgContentTemplates" Size="64" runat="server" />
                </a>
                <% }
                   else
                   { %>
                <sn:SNIcon Icon="rc-contenttemplates-inactive" ID="ImgContentTemplates2" Size="64" runat="server" />
                <% } %>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <% if (Node.Exists("/Root/ContentTemplates"))
                           { %>
                        <a href="/Root/ContentTemplates?action=Explore"><%= GetGlobalResourceObject("Controls", "ContentTemplates") %></a>
                        <% }
                           else
                           { %>
                        <%= GetGlobalResourceObject("Controls", "ContentTemplates") %>
                        <% } %>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "BasicTemplates")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/Portlets?action=Explore">
                    <sn:SNIcon Icon="rc-portlets" ID="ImgPortlets" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/Portlets?action=Explore"><%=GetGlobalResourceObject("Controls", "Portlets")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "AllPortlets")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/Skins?action=Explore">
                    <sn:SNIcon Icon="rc-skins" ID="ImgSkins" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/Skins?action=Explore"><%=GetGlobalResourceObject("Controls", "Skins")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "SkinList")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <% if (Node.Exists("/Root/System/TaskMonitor"))
                   { %>
                <a href="/Root/System/TaskMonitor">
                    <sn:SNIcon Icon="rc-taskmonitor" ID="SNIconTaskMonitor" Size="64" runat="server" />
                </a>
                <% }
                   else
                   { %>
                    <sn:SNIcon Icon="rc-taskmonitor-inactive" ID="SNIconTaskMonitor2" Size="64" runat="server" />
                <% } %>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <% if (Node.Exists("/Root/System/TaskMonitor"))
                           { %>
                        <a href="/Root/System/TaskMonitor"><%= GetGlobalResourceObject("Controls", "TaskMonitor") %></a>
                        <% }
                           else
                           { %>
                        <%= GetGlobalResourceObject("Controls", "TaskMonitor") %>
                        <% } %>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "TaskMonitorDesc")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/System/PermissionOverview" target="_blank">
                    <sn:SNIcon Icon="rc-permissionoverview" ID="ImgPermissionoverview" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/System/PermissionOverview" target="_blank"><%=GetGlobalResourceObject("Controls", "PermissionOverview")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "PermissionOverviewDesc")%></p>
                </div>
            </div>
        </div>
    </div>
    <div class="sn-rootc-right">
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/Sites?action=Explore">
                    <sn:SNIcon Icon="rc-sites" ID="ImgSites" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/Sites?action=Explore"><%=GetGlobalResourceObject("Controls", "Sites")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "SiteList")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/Trash">
                    <sn:SNIcon Icon="rc-trash" ID="ImgTrash" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/Trash"><%=GetGlobalResourceObject("Controls", "Trash")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "DeletedItems")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/(apps)?action=Explore">
                    <sn:SNIcon Icon="rc-apps" ID="ImgApps" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/(apps)?action=Explore"><%=GetGlobalResourceObject("Controls", "Apps")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "AppList")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="https://github.com/SenseNet/sensenet" target="_blank">
                    <sn:SNIcon Icon="rc-github" ID="SNIconGitHub" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="https://github.com/SenseNet/sensenet" target="_blank"><%=GetGlobalResourceObject("Controls", "SenseNetOnGitHub")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "GitHubInfo")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="http://wiki.sensenet.com" target="_blank">
                    <sn:SNIcon Icon="rc-wiki" ID="ImgWiki" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="http://wiki.sensenet.com" target="_blank"><%=GetGlobalResourceObject("Controls", "Wiki")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "WikiPage")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="http://stackoverflow.com/questions/tagged/sensenet" target="_blank">
                    <sn:SNIcon Icon="rc-forum" ID="ImgForum" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="http://stackoverflow.com/questions/tagged/sensenet" target="_blank"><%=GetGlobalResourceObject("Controls", "Forum")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "ForumTopics")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="http://www.sensenet.com/" target="_blank">
                    <sn:SNIcon Icon="rc-salesinfo" ID="ImgSalesInfo" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="http://www.sensenet.com/" target="_blank"><%=GetGlobalResourceObject("Controls", "SalesInformation")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "Information")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <% if (Node.Exists("/Root/System/Workflows"))
                   { %>
                <a href="/Root/System/Workflows?action=Explore">
                    <sn:SNIcon Icon="rc-workflows" ID="ImgWorkflow" Size="64" runat="server" />
                </a>
                <% }
                   else
                   { %>
                    <sn:SNIcon Icon="rc-workflows-inactive" ID="ImgWorkflow2" Size="64" runat="server" />
                <% } %>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <% if (Node.Exists("/Root/System/Workflows"))
                           { %>
                        <a href="/Root/System/Workflows?action=Explore"><%= GetGlobalResourceObject("Controls", "Workflows") %></a>
                        <% }
                           else
                           { %>
                        <%= GetGlobalResourceObject("Controls", "Workflows") %>
                        <% } %>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "WorkflowList")%></p>
                </div>
            </div>
        </div>
        <div class="sn-content">
            <div class="sn-pic-left">
                <a href="/Root/System/VersionInfo">
                    <sn:SNIcon Icon="rc-info" ID="versionInfo" Size="64" runat="server" />
                </a>
            </div>
            <div class="sn-rootc-text">
                <div class="sn-rootc-header">
                    <h1 class="sn-content-title">
                        <a href="/Root/System/VersionInfo"><%=GetGlobalResourceObject("Controls", "VersionInfo")%></a>
                    </h1>
                </div>
                <div class="sn-rootc-desc">
                    <p><%=GetGlobalResourceObject("Controls", "VersionInfoDesc")%></p>
                </div>
            </div>
        </div>
    </div>
</div>
