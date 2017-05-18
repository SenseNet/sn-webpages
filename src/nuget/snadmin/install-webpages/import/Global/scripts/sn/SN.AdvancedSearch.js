// using $skin/scripts/jquery/jquery.js
// using $skin/scripts/kendoui/kendo.web.min.js
// resource ParametricSearchPortlet

$(function () {

        document.forms[0].action = document.location.protocol + "//" + document.location.hostname + document.location.pathname;

        var ctds = [
            {
                name: 'Article',
                displayName: 'Article'
            },
            {
                name: 'BlogPost',
                displayName: 'Post'
            },
            {
                name: 'ForumTopic',
                displayName: 'Topic'
            },
            {
                name: 'CalendarEvent',
                displayName: 'Event'
            },
            {
                name: 'File',
                displayName: 'Document'
            },
            {
                name: 'Folder',
                displayName: 'Folder'
            },
            {
                name: 'ImageLibrary',
                displayName: 'Gallery'
            },
            {
                name: 'Memo',
                displayName: 'Memo'
            },
            {
                name: 'Page',
                displayName: 'Page'
            },
            {
                name: 'Task',
                displayName: 'Task'
            },
            {
                name: 'WebContentDemo',
                displayName: 'WebContentDemo'
            }
        ]

     

     

        $(".text").kendoMaskedTextBox();

        $(".datepicker").kendoDatePicker();

        $(".type").kendoDropDownList({
            dataTextField: "displayName",
            dataValueField: "name",
            dataSource: ctds,
            optionLabel: $('#res1').val()
        });

        var users = [];
        var getUsers = $.ajax({
            url: "/OData.svc/Root/IMS?$select=DisplayName,Id&query=TypeIs:User&metadata=no",
            dataType: "json",
            type: "GET"
        }).done(function (d) {
            $.each(d.d.results, function (i, item) {
                users.push(item);
            });

            $(".user").kendoDropDownList({
                dataTextField: "DisplayName",
                dataValueField: "Id",
                dataSource: users,
                optionLabel: $('#res2').val()
            });
        });

        $('.datepicker').bind("focus", function () {
            $(this).data("kendoDatePicker").open();
        });

        $('.addPath').click(function () {
            if (!resultData) return;
            $('.path.text').val(resultData[0].Path);
            var Input = $('.path');
            var strLength = Input.val().length * 2;
            Input.focus(); Input[0].setSelectionRange(strLength, strLength);
            return false;
        });
});