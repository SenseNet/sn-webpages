<%@ Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
<%@ Register Src="~/Root/System/SystemPlugins/Controls/ContentTypeInstallerControl.ascx" TagName="ContentTypeInstallerControl" TagPrefix="sn" %>

<%=GetGlobalResourceObject("Content", "MoreInformation")%><a href="http://wiki.sensenet.com/index.php?title=Content_Type_Definition">Sense/Net wiki CTD</a> <%=GetGlobalResourceObject("Content", "Or")%> <a href="http://wiki.sensenet.com/index.php?title=Table_of_Contents#Fields">Sense/Net wiki <%=GetGlobalResourceObject("Content", "ListOfFields")%></a>
<br/><br/>

<div class="sn-highlighteditor-container">
	<sn:Binary ID="Binary1" runat="server" FieldName="Binary" FullScreenText="true" FrameMode="NoFrame">
		<EditTemplate>
			 <asp:TextBox ID="BinaryTextBox" runat="server" TextMode="MultiLine" CssClass="sn-highlighteditor" Rows="40" Columns="100" />
		</EditTemplate>
	</sn:Binary>
</div>

<div class="sn-panel sn-buttons">
	<sn:ContentTypeInstallerControl ID="ContentTypeInstaller1" runat="server" />
</div>