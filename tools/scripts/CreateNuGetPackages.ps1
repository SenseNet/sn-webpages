$srcPath = [System.IO.Path]::GetFullPath(($PSScriptRoot + '\..\..\src'))
$installPackagePath = "$srcPath\nuget\content\Admin\tools\install-webpages.zip"

# delete existing packages
Remove-Item $PSScriptRoot\*.nupkg

Compress-Archive -Path "$srcPath\nuget\snadmin\install-webpages\*" -Force -CompressionLevel Optimal -DestinationPath $installPackagePath

nuget pack $srcPath\WebPages\WebPages.nuspec -properties Configuration=Release -OutputDirectory $PSScriptRoot
nuget pack $srcPath\WebPages\WebPages.Install.nuspec -properties Configuration=Release -OutputDirectory $PSScriptRoot