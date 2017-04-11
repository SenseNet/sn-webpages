<%@ Control Language="C#" AutoEventWireup="true" Inherits="SenseNet.Portal.UI.SingleContentView" %>
  <sn:ScriptRequest id="jsrequest" runat="server" path="$skin/scripts/sn/SN.QueryBuilder.js" />
  <sn:CssRequest id="cssrequest" runat="server" path="$skin/styles/SN.QueryBuilder.css" />
  <% string user = (SenseNet.ContentRepository.User.Current).ToString(); %>
<%  
    var currentUser = SenseNet.ContentRepository.User.Current;
    SenseNet.ContentRepository.Storage.Security.IGroup adminGroup = null;
    using (new SenseNet.ContentRepository.Storage.Security.SystemAccount())
    {
        adminGroup = SenseNet.ContentRepository.Group.Administrators;
    }

    if (adminGroup != null && currentUser.IsInGroup(adminGroup))
    {
        var allowedchildtypes = (SenseNet.Portal.Virtualization.PortalContext.Current.ContextNode as SenseNet.ContentRepository.GenericContent).GetAllowedChildTypes().ToArray();

        Dictionary<String, String> contentTypes = new Dictionary<String, String>();
        foreach (var ctd in allowedchildtypes.Select(ct => SenseNet.ContentRepository.Content.Create(ct)))
        {
            contentTypes.Add(ctd.Name, ctd.DisplayName);
        }
        var ctds = Newtonsoft.Json.JsonConvert.SerializeObject(contentTypes);

%>
  <div id="queryBuilder" class="sn-querybuilder">
		<textarea id="queryEditortxtarea" spellcheck='false'></textarea>
</div>
  <div class='sn-queryresult-grid' style="display: none"></div>
  <input type="hidden" class="currentparent" value='<%= SenseNet.Portal.Virtualization.PortalContext.Current.ContextNode.ParentPath %>' />
  <input type="hidden" class="currentnode" value='<%= SenseNet.Portal.Virtualization.PortalContext.Current.ContextNode.Name %>' />
  <script>


      var contentPath = odata.getItemUrl('/Root/Sites/Default_Site');
      var query = '', path = '', title = '', type = 'public';

      $('.sn-querybuilder textarea').queryBuilder({
          showQueryEditor: true,
          content: contentPath,
          showQueryBuilder: true,
          postProcess: function (q) {
              //this two row is removed because of the new querytemplates (minus and plus characters were escaped wrongly)
              //q = q.replace(/\\-/g, '-');
              q = q.replace(/\-/g, '-');
              //q = q.replace(/-/g, '\\-');
              return q + '&$expand=ModifiedBy&$select=DisplayName,Path,Icon,ModifiedBy/FullName,ModificationDate,ModifiedBy/Path&metadata=no';
          },
          commandButtons: {
              saveButton: " + ShowSaveButton.ToString().ToLower() + @",
              saveAsButton: " + ShowSaveAsButton.ToString().ToLower() + @",
              clearButton: " + ShowClearButton.ToString().ToLower() + @",
              executeButton: " + ShowExecuteButton.ToString().ToLower() + @"
          },
          events: {
              execute: refreshResultList,
              save: querySave,
              saveas: querySaveAs,
              clear: clearResultList
          },
          templates: templates
      });

      //querybuilder execute/save/saveas

      function querySaveAs(query, title, type, path, content) {
          if (query) {
              var $overlay = overlayManager.showOverlay({
                  text: templates.saveQueryWindowTemplate({}),
                  cssClass: "sn-modify-index-popup",
                  appendCloseButton: true
              });
              
              $overlay.inputMachinator();
              //TODO: saveasoverlay
              $overlay.find('input[type="text"]').val(title);
              if (type === 'public') {
                  $overlay.find('span.machinator-checkbox').addClass('checked');
                  $overlay.find('input[type="checkbox"]').attr('checked');
              }

              $overlay.find('.savedQuerySaveButton').on('click', function () {
                  var queryTitle = $('#sn-savequerywindow-window input[type="text"]').val();
                  var path = $container.parent().find('input.querypath').val();
                  var queryType = "Private";
                  if ($('#sn-savequerywindow-window .sn-checkbox').hasClass('checked')) {
                      queryType = "Public";
                  }
                  saveQuery(queryTitle, queryType, query, content, path);
              });
          }
      }

      function querySave(query, title, type, path, content) {
          $('.sn-savedquery-title').remove();
          if (query) {
              if (path && path.length > 0) {
                  var queryTitle = $('#queryBuilder').find('input.querytitle').val();
                  var queryType = 'NonDefined';
                  content = odata.getItemUrl(path);
                  saveQuery(queryTitle, queryType, query, content, path);
              }
              else {
                  var $overlay = overlayManager.showOverlay({
                      text: templates.saveQueryWindowTemplate({}),
                      cssClass: "sn-modify-index-popup",
                      appendCloseButton: true
                  });
                  $overlay.inputMachinator();

                  $overlay.find('.savedQuerySaveButton').on('click', function () {
                      var queryTitle = $('#sn-savequerywindow-window input[type="text"]').val();
                      var queryType = "Private";
                      if ($('#sn-savequerywindow-window .sn-checkbox').hasClass('checked')) {
                          queryType = "Public";
                      }
                      saveQuery(queryTitle, queryType, query, content, path);
                  });
              }
          }
      }

      function saveQuery(queryTitle, queryType, query, content, path) {

          refreshHiddenTextBoxes(queryTitle, queryType, content, path);


          $.ajax({
              url: '/OData.svc' + content + '/SaveQuery',
              type: 'POST',
              data: JSON.stringify({
                  'query': query,
                  'displayName': queryTitle,
                  'queryType': queryType
              }),
              success: function () {
                  overlayManager.hideOverlay();
                  overlayManager.showOverlay({
                      text: resources.SaveSuccess,
                      appendCloseButton: true
                  });
                  location.reload(true);
              },
              resources: resources
          });
      }

      function refreshHiddenTextBoxes(queryTitle, queryType, content, path) {
          if ($('.sn-query-container').find('input.querytitle')) { $container.find('input.querytitle').val(queryTitle); }
          else { $('.sn-query-container').append('<input type="hidden" class="querytitle" value="' + path + '" />'); }
          if ($('.sn-query-container').find('input.querytype')) { $container.find('input.querytype').val(queryType); }
          else { $('.sn-query-container').append('<input type="hidden" class="querytype" value="' + path + '" />'); }
          if ($('.sn-query-container').find('input.querypath')) { $container.find('input.querypath').val(path); }
          else { $('.sn-query-container').append('<input type="hidden" class="querypath" value="' + path + '" />'); }
          $queryHeadTitle = $('.sn-savedquery-title');
          $queryHeadTitle.html(queryTitle);

      }

      function refreshResultList(query, path) {

          var results = [];
          $.ajax({
              url: "/OData.svc" + path,
              dataType: "json",
              async: false,
              success: function (d) {
                  $.each(d.d.results, function (i, item) {
                      results.push(item);
                  });
              }
          });
          var results = JSON.parse(JSON.stringify(results));


          $(".sn-queryresult-grid").remove();
          $('#queryBuilder').next('div').after('<div class="sn-queryresult-grid" style="display: none"></div>');


          $(".sn-queryresult-grid").kendoGrid({
              dataSource: {
                  data: results,
                  pageSize: 15
              },
              scrollable: false,
              sortable: true,
              filterable: false,
              pageable: {
                  input: true,
                  numeric: true
              },
              columns: [
                            { field: "DisplayName", title: "Title", template: "<div class='title' title='#=DisplayName#'><img src='/Root/Global/images/icons/16/#: Icon #.png' alt='#: Icon #' title='#: Icon #' class='sn-icon sn-icon16'><a href=\"#=Path#\">#=DisplayName#</a></div>" },
                            { field: "ModifiedBy", title: "Modified by", width: "200px", template: "<a title='#=ModifiedBy.FullName#' href=#=ModifiedBy.Path#''>#=ModifiedBy.FullName#</a>" },
                            { field: "ModificationDate", title: "Modification date", width: "200px", format: "{0: yyyy-MM-dd HH:mm:ss}", type: "date" }
                ]
          });
          $(".sn-queryresult-grid .sn-pt-header").remove();
          $(".sn-queryresult-grid").prepend('<div class="sn-pt-header ui-widget-header ui-corner-all ui-helper-clearfix"><div class="sn-pt-header-tl"></div><div class="sn-pt-header-center"><div class="sn-pt-icon"></div><div class="sn-pt-title">Results</div></div><div class="sn-pt-header-tr"></div></div>');
          $(".sn-queryresult-grid").slideDown('slow');
          //                    $('.sn-querybuilder-builderinner').slideUp('slow');
          //                    $('.querybuilder-close').hide();
          //                    $('.querybuilder-open').show();
      }

      function clearResultList() {
        $('.sn-queryresult-grid').remove();
        $('#queryBuilder').next('div').after('<div class="sn-queryresult-grid" style="display: none"></div>');

      }

      var resources = {
          Run: SN.Resources.QueryBuilder["Run"],
          SaveAs: SN.Resources.QueryBuilder["SaveAs"],
          Save: SN.Resources.QueryBuilder["Save"],
          Clear: SN.Resources.QueryBuilder["Clear"],
          SaveSuccess: SN.Resources.QueryBuilder["SaveQuerySuccess"],
          DeleteSuccessfulMessage: SN.Resources.QueryBuilder["DeleteQuerySuccess"],
          SaveQueryTitle: SN.Resources.QueryBuilder["SaveQueryTitle"],
          SavedQueryDelete: SN.Resources.QueryBuilder["SavedQueryDelete"],
          SaveQueryNameLabel: SN.Resources.QueryBuilder["SaveQueryNameLabel"],
          SaveQueryPlaceholder: SN.Resources.QueryBuilder["SaveQueryPlaceholder"],
          SaveQueryShareLabel: SN.Resources.QueryBuilder["SaveQueryShareLabel"],
          SaveQuerySaveButton: SN.Resources.QueryBuilder["SaveQuerySaveButton"],
          SaveQueryCancelButton: SN.Resources.QueryBuilder["SaveQueryCancelButton"],
          No: SN.Resources.QueryBuilder["No"],
          Yes: SN.Resources.QueryBuilder["Yes"],
          AreYouSureToClose: SN.Resources.QueryBuilder["QueryBuilder-AreYouSureToClose"]
      }

      var templates = {
          succesTemplate: kendo.template('<div class="successMesssage"><span>' + resources.SaveSuccess + '</span></div>'),
          deleteSuccessTemplate: kendo.template('<div class="successMesssage"><span>' + resources.DeleteSuccessfulMessage + '</span></div>'),
          saveQueryWindowTemplate: kendo.template('<div class="sn-window" id="sn-savequerywindow-window"><h1>' + resources.SaveQueryTitle + '</h1><div class="savequery-formrow"><label>' + resources.SaveQueryNameLabel + '</label><input type="text" placeHolder="' + resources.SaveQueryPlaceholder + '" /></div><div class="savequery-formrow"><label>' + resources.SaveQueryShareLabel + '</label><input type="checkbox" class="sn-checkbox" /></div><div class="buttonContainer"><button class="okButton savedQuerySaveButton">' + resources.SaveQuerySaveButton + '</button><button class="cancelButton close-overlay">' + resources.SaveQueryCancelButton + '</button></div><span class="modalClose close-overlay" style="cursor:pointer;">&nbsp;</span></div>'),
          savedQueryDelete: kendo.template('<div id="sn-savedquerydelete-window"><div class="successMesssage"><span>' + resources.SavedQueryDelete + '</span></div><div style="display: none" class="savedQueryInfo"></div><div class="buttonContainer"><button class="okButton deleteQueryButton">' + resources.Yes + '</button><button class="cancelButton close-overlay">' + resources.No + '</button></div></div>'),
          areYourSureQueryBuilder: kendo.template('<div><div>' + resources.AreYouSureToClose + '</div><button class="close-overlay">' + resources.Yes + '</button><button class="burn-before-close">' + resources.No + '</button>\</div>')
      }

      

  </script>
  <%}
    else
    {
%>
<p><%=GetGlobalResourceObject("ParametricSearchPortlet", "LoginNotification")%></p>
<%   
    }%>