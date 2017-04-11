<%@  Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" EnableViewState="false" %>
<%@ Import Namespace="SenseNet.Portal.Helpers" %>

<%
    var userProfile = this.Content.ContentHandler as SenseNet.ContentRepository.UserProfile;
    var email = userProfile.User.Email;
    var phone = userProfile.User["Phone"] as string;
    var managerRefList = this.Content["Manager"] as IEnumerable<SenseNet.ContentRepository.Storage.Node>;
    var manager = managerRefList == null ? null : managerRefList.FirstOrDefault() as SenseNet.ContentRepository.User;
    var department = userProfile.User["Department"] as string;
    var languages = userProfile.User["Languages"] as string;
    var education = userProfile.User["Education"] as string;
    
    var gender = userProfile.User["Gender"] as string;    
    DateTime dob;
    var dobOkay = DateTime.TryParse(userProfile.User["BirthDate"].ToString(), out dob);
    var ageGender = String.Format("{0}{1}", !dobOkay || dob == DateTime.MinValue ? String.Empty : Convert.ToInt32((DateTime.UtcNow - dob).TotalDays / 365.242199).ToString(), String.IsNullOrEmpty(gender) ? String.Empty : "/" + gender.ToLower()[0]).TrimStart('/');

    var maritialStatus = userProfile.User["MaritalStatus"] as string;

    var twitter = userProfile.User["TwitterAccount"] as string;
    var facebook = userProfile.User["FacebookURL"] as string;
    var linkedin = userProfile.User["LinkedInURL"] as string;
    
    var username = SenseNet.ContentRepository.User.Current.Name;
    var profileUsername = userProfile.User.Username;

    bool showEducationAndWork = !string.IsNullOrEmpty(department) && !string.IsNullOrEmpty(languages) && !SenseNet.Portal.Helpers.UserProfiles.IsEducationEmpty(education);
    bool showSocialNetworks = !string.IsNullOrEmpty(twitter) && !string.IsNullOrEmpty(facebook) && !string.IsNullOrEmpty(linkedin);    
%>
<article class="snm-tile bg-zero" id="reload">
  <a href="javascript:location.reload(true)" class="snm-link-tile bg-zero clr-text">
    <span class="snm-lowertext snm-fontsize3"><%=GetGlobalResourceObject("Content", "Refresh")%></span>
  </a>
</article>
<article class="snm-tile" id="backtile">
  <a href="javascript:window.history.back()" class="snm-link-tile bg-semitransparent clr-text">
    <span class="snm-lowertext snm-fontsize3"><%=GetGlobalResourceObject("Content", "Back")%></span>
  </a>
</article>
<div id="snm-container">
  <div id="page1" class="snm-page">
    <div class="snm-pagecontent">
      <div class="snm-col">
        <h1 class="anim-slidein"><%= String.Format("{0}{1}", userProfile.User.FullName, String.IsNullOrEmpty(ageGender) ? String.Empty : String.Format(" ({0})", ageGender)) %></h1>
        <div id="snm-userprofile-centercol">
          <div id="snm-userprofile-leftcol">
            <a href='<%= userProfile.User.AvatarUrl %>' title='<%= userProfile.User.FullName %>' rel="sexylightbox">
              <img src='<%= SenseNet.Portal.UI.UITools.GetAvatarUrl(userProfile.User, 150, 150) %>' alt='<%=GetGlobalResourceObject("Content", "MissingImage")%>' class="sn-avatar nice_img" />
            </a>
            <div id="snm-userprofile-nav">
              <ul>            
                <li><a id="snm-userprofile-nav-info" class="snm-button clickable-yellowbg snm-item-active" href="javascript:void(0);"><%=GetGlobalResourceObject("Content", "Info")%></a></li>
                <li><a id="snm-userprofile-nav-wall" class="snm-button clickable-yellowbg" href="javascript:void(0);"><%=GetGlobalResourceObject("Content", "Wall")%></a></li>
                <li><a id="snm-userprofile-nav-photos" class="snm-button clickable-yellowbg" href="javascript:void(0);"><%=GetGlobalResourceObject("Content", "Photos")%></a></li>
              </ul>
            </div>
          </div>
          <div id="snm-userprofile-content">
              <div id="snm-userprofile-info" class="snm-tab-active">
                  <h2><%=GetGlobalResourceObject("Content", "Personal")%></h2>
                  <dl class="snm-property-list">                    
                      <dt><%=GetGlobalResourceObject("Content", "UserName")%></dt><dd><%= profileUsername %></dd>
                      <% if (!string.IsNullOrEmpty(email)) { %><dt>e-mail</dt><dd><a href='mailto:<%= email%>'><%= email %></a></dd>  <% } %>
                      <% if (dob != DateTime.MinValue) { %>
                          <dt><%=GetGlobalResourceObject("Content", "DateOfBirth")%></dt><dd><%= dob.ToShortDateString() %></dd>
                      <% } %>
                      <% if (!string.IsNullOrEmpty(maritialStatus)){ %>
                          <dt><%=GetGlobalResourceObject("Content", "MaritialStatus")%></dt><dd><%= maritialStatus  %></dd>
                      <% } %>
                      <% if (!string.IsNullOrEmpty(phone)) { %><dt>phone</dt><dd><%= SenseNet.ContentRepository.i18n.SenseNetResourceManager.Current.GetString("UserBrowse", "PhoneLabel") %>: <%= phone %></dd>  <% } %>
                      <% if (manager != null) { %>
                          <dt><%= SenseNet.ContentRepository.i18n.SenseNetResourceManager.Current.GetString("UserBrowse", "ManagerLabel")%>:</dt>
                          <dd><a href='<%= Actions.ActionUrl(SenseNet.ContentRepository.Content.Create(manager), "Profile") %>' title="[manager]"><%= manager.FullName %></a></dd>
                      <% } %>
                  </dl>
                  <% if(showEducationAndWork){ %>
                      <h2><%=GetGlobalResourceObject("Content", "EducationAndWork")%></h2>
                      <dl class="snm-property-list">
                          <% if (!string.IsNullOrEmpty(department)) { %>
                              <dt><%= SenseNet.ContentRepository.i18n.SenseNetResourceManager.Current.GetString("UserBrowse", "DepartmentLabel") %>:</dt><dd><%= department%></dd>
                          <% } %>
                          <% if (!string.IsNullOrEmpty(languages)) { %>
                              <dt><%= SenseNet.ContentRepository.i18n.SenseNetResourceManager.Current.GetString("UserBrowse", "LanguagesLabel")%>:</dt><dd><%= languages%></dd>
                          <% } %>
                          <% if (!SenseNet.Portal.Helpers.UserProfiles.IsEducationEmpty(education)) { %>
                              <dt><%=GetGlobalResourceObject("Content", "Education")%></dt><dd><%= education %></dd>
                          <% } %>                    
                      </dl>
                  <%} %>
                  <% if(showSocialNetworks){ %>
                      <h2><%=GetGlobalResourceObject("Content", "SocialNetworks")%></h2>
                      <dl class="snm-property-list">
                          <% if (!string.IsNullOrEmpty(twitter)){ %>
                              <dt>Twitter:</dt><dd>@<%= twitter%></dd>
                          <% } %>
                          <% if (!string.IsNullOrEmpty(facebook)){ %>
                              <dt>Facebook:</dt><dd><%= facebook%></dd>
                          <% } %>
                          <% if (!string.IsNullOrEmpty(linkedin)){ %>
                              <dt>LinkedIn:</dt><dd><%= linkedin%></dd>
                          <% } %>
                      </dl>
                  <%} %>
              </div>
              <div id="snm-userprofile-wall" class="snm-tab-hidden">
                <h2><%=GetGlobalResourceObject("Content", "Wall")%></h2>
              </div>
              <div id="snm-userprofile-photos" class="snm-tab-hidden">
                <h2><%=GetGlobalResourceObject("Content", "Photos")%></h2>
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>        
          