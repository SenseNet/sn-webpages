$(function () {
    var treeDataSource = new kendo.data.HierarchicalDataSource({
        type: "odata",
        transport: {
            read: {
                url: function (item) {
                    if (item.Path) {
                        return odata.dataRoot + item.Path;
                    }
                    else {
                        return odata.dataRoot + '/Root/Sites/Default_Site/features';
                    }
                },
                dataType: "json",
                data: {
                    $select: 'Type,Id,Path,DisplayName,Name,IsFolder,Icon',
                    metadata: "no",
                    enableautofilters: true
                }
            }
        },
        schema: {
            model: {
                id: 'Path',
                hasChildren: 'IsFolder'
            }
        },
        serverSorting: true,
        sort: [
            { field: "IsFolder", dir: "desc" },
            { field: "DisplayName", dir: "asc" }
        ]
    });

    var treeView = $('#tree').kendoTreeView({
        dataSource: treeDataSource,
        dataTextField: "DisplayName",
        dataUrlField: "Path"
    }).data("kendoTreeView");
});