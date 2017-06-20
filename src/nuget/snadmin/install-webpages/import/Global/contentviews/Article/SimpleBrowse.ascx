<%@ Import Namespace="System.Collections.Generic"%>
<%@ Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" EnableViewState="false" %>
<%@ Import namespace="SenseNet.ContentRepository.Storage" %>
<%@ Import Namespace="System.Web.UI.WebControls" %>

<div class="sn-content">
    
    <% if (GetValue("DisplayName") != GetValue("Name")) { %>
        <h1 class="sn-content-title"><%= HttpUtility.HtmlEncode(GetValue("DisplayName")) %></h1>
    <% } %>

	<% if (!String.IsNullOrEmpty((string)base.Content["Subtitle"])) { %>
		<h2 class="sn-content-subtitle"><%= HttpUtility.HtmlEncode(GetValue("Subtitle")) %></h2>   
	<% } %>


    <% if (!String.IsNullOrEmpty(GetValue("ImageRef.Path")) || !String.IsNullOrEmpty(GetValue("Lead"))) { %>
	<div class="sn-content-header ui-helper-clearfix">

        <% if (!String.IsNullOrEmpty(GetValue("ImageRef.Path")))
           { %>
            <img class="sn-pic" src="<%= GetValue("ImageRef.Path") %>" alt="" />
        <% } %>

        <% if (!String.IsNullOrEmpty(GetValue("Lead"))) { %>
    		<%= GetValue("Lead") %>
        <% } %>
 
	</div>
	<% } %>

    <% if (!String.IsNullOrEmpty(GetValue("Body"))) { %>
    <div class="sn-richtext ui-helper-clearfix">
        <%= GetValue("Body") %>      
    </div>
    <% } %>
</div>
