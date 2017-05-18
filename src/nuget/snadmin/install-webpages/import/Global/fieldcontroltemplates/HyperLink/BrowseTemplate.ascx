<%@  Language="C#" EnableViewState="false" %>
<%@ Import Namespace="SNControls=SenseNet.Portal.UI.Controls" %>
<%@ Import Namespace="SNFields=SenseNet.ContentRepository.Fields" %>

<asp:HyperLink ID="HyperLink1" runat="server" 
    ImageUrl ='<%# ((SNFields.HyperLinkFieldSetting)((SNControls.HyperLink)Container).Field.FieldSetting).UrlFormat == SNFields.UrlFormat.Picture 
        ? DataBinder.Eval(Container, "Data.Href") 
        : string.Empty %>'
    NavigateUrl='<%# DataBinder.Eval(Container, "Data.Href") %>'
    Text='<%# DataBinder.Eval(Container, "Data.Text") %>'
    ToolTip='<%# DataBinder.Eval(Container, "Data.Title") %>'
    Target='<%# DataBinder.Eval(Container, "Data.Target") %>'
    CssClass='<%# ((SNFields.HyperLinkFieldSetting)((SNControls.HyperLink)Container).Field.FieldSetting).UrlFormat == SNFields.UrlFormat.Picture ? "sn-listgrid-image" : string.Empty %>' />

