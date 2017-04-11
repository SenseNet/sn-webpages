<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:msxsl="urn:schemas-microsoft-com:xslt"
                xmlns:snl="sn://SenseNet.Portal.UI.ContentListViews.ListHelper"
                exclude-result-prefixes="msxsl"
                xmlns:snf="sn://SenseNet.Portal.UI.XmlFormatTools">

  <xsl:param name="listPath"/>
  <xsl:param name="groupBy"/>
  <xsl:output method="text" />

  <!--<xsl:variable name="eval_open"><![CDATA[<%# Eval("]]></xsl:variable>
  <xsl:variable name="eval_close"><![CDATA[") %>]]></xsl:variable>
  <xsl:variable name="eval_line" select="concat($eval_open, @bindingName, $eval_close)" />
  <xsl:value-of select="$eval_line" disable-output-escaping="yes"/>-->

  
  <xsl:template match="/">
    <![CDATA[<%@ Control Language="C#" AutoEventWireup="false" Inherits="SenseNet.Portal.UI.ContentListViews.ListView" %>
    <%@ Import Namespace="SNCR=SenseNet.ContentRepository" %>
    <%@ Import Namespace="SenseNet.Portal.UI.ContentListViews" %>
    <%@ Import Namespace="System.Linq" %>
    <%@ Import Namespace="SCR=SenseNet.ContentRepository.Fields" %>
    
    <sn:CssRequest ID="gallerycss" runat="server" CSSPath="$skin/styles/sn-gallery.css" />
    <sn:CssRequest ID="gallerycss2" runat="server" CSSPath="/Root/Global/styles/prettyPhoto.css" />
    <sn:ScriptRequest runat="server" Path="$skin/scripts/jquery/plugins/jquery.prettyPhoto.js" />
    
    <script runat="server">
        string[] extensions = new string[] { ".jpg", ".jpeg", ".png", ".gif" };
    </script>
    
    <div class="galleryContainer">
    <sn:ListGrid ID="ViewBody"
                  DataSourceID="ViewDatasource"
                  runat="server">
      <LayoutTemplate>
        <table class="sn-datagrid sn-gallery-table">
          <tbody>
          <tr>
            <asp:TableCell runat="server" id="itemPlaceHolder" />
            
            </tr>
          </tbody>
        </table>
      </LayoutTemplate>
      <ItemTemplate>
        <asp:TableCell runat="server" class="sn-gallery-cell">]]><xsl:apply-templates mode="Item" /><![CDATA[</asp:TableCell>
      </ItemTemplate>
      <EmptyDataTemplate>
        <table class="sn-listgrid ui-widget-content">
          <thead>
          <asp:TableRow runat="server">]]><xsl:apply-templates mode="Header" /><![CDATA[</asp:TableRow>
          </thead>
        </table>
        <div class="sn-warning-msg ui-widget-content ui-state-default"><%=GetGlobalResourceObject("List", "EmptyList")%></div>
      </EmptyDataTemplate>
    </sn:ListGrid>
    </div>
    <asp:Literal runat="server" id="ViewScript" />
    <sn:SenseNetDataSource ID="ViewDatasource" runat="server" />
     <script>
      $(function ()
      {
          var items = $(".galleryContainer td");
          var newlist = '';
          var actlist = '<tr>';
          var size = 5;
          var currentsize = 1;
          var endclosed = false;
          for (var i = 0; i < items.length; i++)
          {
              actlist += items[i].outerHTML;
              endclosed = false;
              if (++currentsize > size)
              {
                  currentsize = 1;
                  newlist += actlist + '</tr>';
                  actlist = '<tr>';
                  endclosed = true;
              }
          }
          if (!endclosed)
              newlist += actlist + '</tr>';

          $(".galleryContainer tbody").html(newlist);
      });
      $(document).ready(function ()
      {
          $(".sn-gallery-table a[rel^='prettyPhoto']").prettyPhoto({
              theme: 'facebook',
              deeplinking: false,
              overlay_gallery: false
          });
      });
    </script>
    ]]>
    
  </xsl:template>


  <xsl:template mode="Item" match="/Columns">
    <xsl:for-each select="Column">

      <xsl:choose>
        <xsl:when test="contains(@fullName,GenericContent.Binary)">
          <xsl:call-template name="ColumnValue" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="contains(@modifiers,'main')">
              <xsl:call-template name="ColumnValue"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="ColumnValue" />
            </xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="ColumnValue">
    <xsl:choose>
      <xsl:when test="@fullName = 'File.Binary'">
        <div class="sn-image">
          <![CDATA[<a 
              href="<%# (((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder"))? Eval("Path") : Eval("Path") %>" 
              rel="<%# !(((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder")) && extensions.Contains(System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower())) || !(((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder")) && System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower()) == ".svg"? "prettyphoto[pp_gal]" : " " %>" 
              class="<%# (((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder"))? "sn-folder-img" : "sn-gallery-img" %>" 
              title="<%# (((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder"))? Eval("DisplayName") : Eval("DisplayName") %>">              
                <asp:Image ID="Folder" Visible='<%# (((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder"))%>' runat="server" ImageUrl="/Root/Global/images/icons/folder-icon-125.jpg" AlternateText='<%# Eval("DisplayName") %>' ToolTip='<%# Eval("DisplayName") %>'/>
                <asp:Image ID="RegularImage" Visible='<%# !(((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder")) && extensions.Contains(System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower())) %>' runat="server" ImageUrl='<%# Eval("Path") + "?action=Thumbnail" %>' AlternateText='<%# Eval("DisplayName") %>' ToolTip='<%# Eval("DisplayName") %>'/>
                <asp:Image ID="SvgImage" Visible='<%# !(((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder")) && System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower()) == ".svg" %>' runat="server" ImageUrl='<%# Eval("Path") %>' AlternateText='<%# Eval("DisplayName") %>' CssClass="svgimage" ToolTip='<%# Eval("DisplayName") %>'/>
              
              <asp:Image ID="OtherImage" 
              Visible='<%# !(((SNCR.Content)Container.DataItem).ContentHandler.NodeType.IsInstaceOfOrDerivedFrom("Folder")) && !extensions.Contains(System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower())) && System.IO.Path.GetExtension(((SNCR.Content)Container.DataItem).Name.ToLower()) != ".svg" %>' runat="server" 
              ImageUrl="/Root/Global/images/icons/image-icon-125.jpg" AlternateText='<%# Eval("DisplayName") %>' 
              ToolTip='<%# Eval("DisplayName") %>'/>

          </a>]]>
        </div>
      </xsl:when>
      <xsl:when test="@fullName = 'GenericContent.DisplayName'">
        
          <![CDATA[<div class="sn-title"><%# Eval("DisplayName") %></div>]]>
        
      </xsl:when>
      <xsl:when test="@fullName = 'GenericContent.ModifiedBy'">

        <![CDATA[<div class="sn-modifiedby"><span>Uploaded by:</span><sn:ActionLinkButton ID="ModifiedBy" runat='server' NodePath='<%# ((SNCR.Content)Container.DataItem).ContentHandler.ModifiedBy.Path%>' ActionName='Profile' IconVisible="false"
    Text='<%# ((SNCR.User)((SNCR.Content)Container.DataItem).ContentHandler.ModifiedBy).FullName %>'
ToolTip='<%# ((SNCR.User)((SNCR.Content)Container.DataItem).ContentHandler.ModifiedBy).Domain + "/" + ((SNCR.Content)Container.DataItem).ContentHandler.ModifiedBy.Name %>'  />​</div>]]>

      </xsl:when>
      <xsl:otherwise>
        <!--<![CDATA[<%# Eval("]]><xsl:value-of select="@bindingName"/><![CDATA[") %>]]>-->
          <xsl:variable name="fName" select="@fullName" />
          <xsl:value-of select="snl:RenderCell($fName, $listPath)" disable-output-escaping="yes" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template mode="Columns" match="/Columns">
    
    <xsl:for-each select="Column">
      <xsl:value-of select="@bindingName"/>
      <xsl:text> </xsl:text>
    </xsl:for-each>
  </xsl:template>

</xsl:stylesheet>