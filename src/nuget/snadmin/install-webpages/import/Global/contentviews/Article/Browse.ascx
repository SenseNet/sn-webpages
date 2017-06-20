<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" EnableViewState="false" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>

<sn:ContextInfo runat="server" Selector="CurrentContext" UsePortletContext="true" ID="myContext" />

<style>
.sn-pt-body.ui-corner-all {overflow: visible !important;}
.sn-pt-header, .sn-pt-header-tl {z-index:0;}
</style>

<div class="sn-article-content">

    <div class="sn-content-actions">
        <sn:ActionLinkButton ID="ActionLinkButton1" runat="server" IconUrl="/Root/Global/images/icons/16/edit.png" ActionName="Edit" Text="<%$ Resources:Content,Edit %>" ContextInfoID="myContext" /> 
        <img src="/Root/Global/images/icons/16/document.png" class="sn-icon sn-icon16" style="margin-right:-2px;"/><a id="article-menu-item-print"   class="sn-actionlinkbutton popup" href="?action=Print" onclick="return false;" title="<%=GetGlobalResourceObject("Content", "Print")%>"><%=GetGlobalResourceObject("Content", "Print")%></a>
   </div>
    
    <% if (!String.IsNullOrEmpty(GetValue("DisplayName"))) { %><h1 class="sn-content-title sn-article-title"><%= HttpUtility.HtmlEncode(GetValue("DisplayName")) %></h1><% } %>
    <% if (!String.IsNullOrEmpty(GetValue("Subtitle"))) { %><h3 class="sn-content-subtitle sn-article-subtitle"><%=GetValue("Subtitle") %></h3><% } %>
    
    <div class="sn-article-info">
        <% if (!String.IsNullOrEmpty(GetValue("Author")))
           { %>
        <span><%=GetGlobalResourceObject("Content", "Author")%> <strong><%=GetValue("Author") %></strong></span>
        <span class="sn-article-info-separator">|</span>
        <% } %>
        <span><%=GetGlobalResourceObject("Content", "Published")%> <strong><span class='sn-date'><%=GetValue("CreationDate") %></span></strong></span>
    </div>

    <% if (!String.IsNullOrEmpty(this.Image.ImageUrl)) { %>
    <div class="sn-article-img">
        <sn:Image ID="Image" runat="server" FieldName="Image" RenderMode="Browse" Width="510" Height="290">
            <BrowseTemplate>
                <asp:Image ImageUrl="/Root/Global/images/missingphoto.png" ID="ImageControl" runat="server" alt=""/>
            </BrowseTemplate>
        </sn:Image>
    </div>
    <% } %>
    
    <div class="sn-article-lead sn-richtext">
        <sn:RichText ID="RichText1" FieldName="Lead" runat="server"/>
    </div>
    <div class="sn-article-body sn-richtext">
        <sn:RichText ID="RichText2" FieldName="Body" runat="server"/>
    </div>
</div>
<!-- Go to www.addthis.com/dashboard to customize your tools -->
<div style="margin-top: 30px" class="addthis_native_toolbox"></div><div class="addthis_sharing_toolbox"></div>

<script>
    $(function () {
        SN.Util.setFullLocalDate('span.sn-date', '<%= System.Globalization.CultureInfo.CurrentUICulture%>',
            '<%=GetValue("CreationDate") %>',
            '<%= System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern %>',
            '<%= System.Globalization.CultureInfo.CurrentUICulture.DateTimeFormat.ShortTimePattern %>');
    });
</script>
    

<script>
    $('.popup').click(function () {
        pWidth = 740;
        pHeight = 600;
        leftVal = (screen.width / 2) - (pWidth / 2);
        topVal = (screen.height / 2) - (pHeight / 2);
        newwindow = window.open($(this).attr('href'), 'print', 'height=' + pHeight + ',width=' + pWidth + ',left=' + leftVal + ',top=' + topVal + ',scrollbars=yes');
        if (window.focus) {
            newwindow.focus();
        }
        return false;
    });
    </script>

<!-- Go to www.addthis.com/dashboard to customize your tools -->
<script type="text/javascript" src="//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-55c46aa3a6807aed" async="async"></script>

