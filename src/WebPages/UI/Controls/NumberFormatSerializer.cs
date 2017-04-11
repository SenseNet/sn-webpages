using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SenseNet.Portal.UI.Controls
{
    public class NumberFormatSerializer
    {
        public string[] pattern { get; set; }
        public int decimals { get; set; }

        [JsonProperty(PropertyName = ",")]
        public string SeparatorPropertyComma { get; set; }

        [JsonProperty(PropertyName = ".")]
        public string SeparatorPropertyDot { get; set; }
        public int[] groupSize { get; set; }
        public PatternData percent { get; set; }
        public PatternData currency { get; set; }

        public static string GetJson()
        {
            return GetJson(CultureInfo.CurrentUICulture.NumberFormat);
        }

        public static string GetJson(NumberFormatInfo formatInfo)
        {
            var nf = formatInfo;

            var nfs = new NumberFormatSerializer
            {
                pattern = new[] { nf.NumberNegativePattern.ToString() },
                decimals = nf.NumberDecimalDigits,
                SeparatorPropertyComma = nf.NumberDecimalSeparator,
                SeparatorPropertyDot = nf.NumberGroupSeparator,
                groupSize = nf.NumberGroupSizes,
                percent = new PatternData
                {
                    pattern = new[]
                    {
                        nf.PercentNegativePattern.ToString(),
                        nf.PercentPositivePattern.ToString()
                    },
                    decimals = nf.PercentDecimalDigits,
                    SeparatorPropertyComma = nf.PercentGroupSeparator,
                    SeparatorPropertyDot = nf.PercentDecimalSeparator,
                    groupSize = nf.PercentGroupSizes,
                    symbol = nf.PercentSymbol
                },
                currency = new PatternData
                {
                    pattern = new[]
                    {
                        nf.CurrencyNegativePattern.ToString(),
                        nf.CurrencyPositivePattern.ToString()
                    },
                    decimals = nf.CurrencyDecimalDigits,
                    SeparatorPropertyComma = nf.CurrencyGroupSeparator,
                    SeparatorPropertyDot = nf.CurrencyDecimalSeparator,
                    groupSize = nf.CurrencyGroupSizes,
                    symbol = nf.CurrencySymbol
                }
            };

            return JsonConvert.SerializeObject(nfs);
        }
    }

    public class PatternData
    {
        public string[] pattern { get; set; }
        public int decimals { get; set; }

        [JsonProperty(PropertyName = ",")]
        public string SeparatorPropertyComma { get; set; }

        [JsonProperty(PropertyName = ".")]
        public string SeparatorPropertyDot { get; set; }

        public int[] groupSize { get; set; }
        public string symbol { get; set; }
    }

}
