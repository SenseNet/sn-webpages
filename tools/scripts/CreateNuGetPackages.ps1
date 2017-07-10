Compress-Archive -Path "..\..\src\nuget\snadmin\install-webpages\*" -Force -CompressionLevel Optimal -DestinationPath "..\..\src\nuget\content\Admin\tools\install-webpages.zip"
nuget pack ..\..\src\WebPages\WebPages.nuspec -properties Configuration=Release
nuget pack ..\..\src\WebPages\WebPages.Install.nuspec -properties Configuration=Release

# nuget.exe push -Source "SenseNet" -ApiKey VSTS .\SenseNet.WebPages.7.0.0-beta1.3.nupkg
# nuget.exe push -Source "SenseNet" -ApiKey VSTS .\SenseNet.WebPages.Install.7.0.0-beta1.3.nupkg