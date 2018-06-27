using System;
using SenseNet.ContentRepository;

namespace SenseNet.WebPages
{
    public class WebPagesComponent : SnComponent
    {
        public override string ComponentId => "SenseNet.WebPages";
        public override Version SupportedVersion { get; } = new Version(7, 1, 0);
    }
}
