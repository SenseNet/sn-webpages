using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using SenseNet.ContentRepository.Fields;
using SenseNet.ContentRepository.Security;
using SenseNet.ContentRepository.Storage;
using SenseNet.Portal.UI;

using SenseNet.ContentRepository;
using System.Globalization;

namespace SenseNet.Portal.UI.Controls
{
    [ToolboxData("<{0}:DatePicker ID=\"DatePicker1\" runat=server></{0}:DatePicker>")]
    public class DatePicker : FieldControl, INamingContainer, ITemplateFieldControl
    {
        public enum DateTimePatternType { Default, ShortDate, ShortTime }

        // Members //////////////////////////////////////////////////////////////////////
        protected static readonly string TimeControlID = "InnerTimeTextBox";
        protected static readonly string TimeZoneOffsetControlID = "InnerTimeZoneOffsetTextBox";
        protected static readonly string TimeHolderControlID = "InnerTimeHolder";

        // language pack path template, for example: $skin/scripts/jqueryui/minified/i18n/jquery.ui.datepicker-{0}.min.js
        private static readonly string JqueryDatePickerScriptTemplate = RepositoryPath.Combine(
            UITools.ClientScriptConfigurations.JQueryUIFolderPath,
            "i18n/jquery.ui.datepicker-{0}" +
            (UITools.ClientScriptConfigurations.JQueryUIFolderPath.Contains("/minified") ? ".min" : string.Empty)
            + ".js");

        private static readonly string ResourceKeyInvalidDate = "InvalidDate";

        public event EventHandler OnDateChanged;

        private object _innerData;
        private string _dateTimeText;
        private string _timeText;

        #region properties

        private string _configuration = @"{{format:'yy.m.d',allowBlank:true,firstDay:{0} }}"; // Default configuration
        [PersistenceMode(PersistenceMode.Attribute)]
        public string Configuration
        {
            get { return string.Format(_configuration, GetCurrentFirstDay()); }
            set { _configuration = value; }
        }

        [PersistenceMode(PersistenceMode.Attribute)]
        public bool AutoPostBack { get; set; }

        #endregion

        public DateTimeMode Mode
        {
            get
            {
                var fieldSetting = Field.FieldSetting as DateTimeFieldSetting;
                if (fieldSetting == null)
                    return DateTimeMode.None;

                return !fieldSetting.DateTimeMode.HasValue ? DateTimeMode.None : fieldSetting.DateTimeMode.Value;
            }
        }

        // Methods //////////////////////////////////////////////////////////////////////
        public override void SetData(object data)
        {
            // collect controls           
            var dateControl = GetInnerControl() as TextBox;
            var timeControl = GetTimeControl() as TextBox;

            _innerData = data;

            switch (Mode)
            {
                case DateTimeMode.None:
                    // only one textbox appears on page that handles datetime
                    // in this case, no scripts are rendered
                    ProcessNoneMode(data);
                    break;
                case DateTimeMode.Date:
                    // One visible textbox appears on page that handles date. It is possible
                    // that an invisible time textbox also exists. We use it to handle and 
                    // format UTC dates on the client side (otherwise the date control would 
                    // move date values back or forward, depending on the client time zone).
                    ProcessDateTimeMode(data);
                    break;
                case DateTimeMode.DateAndTime:
                    if (timeControl != null)
                    {
                        // two textboxes appear on the page, one for handling date and one for handling time value
                        ProcessDateTimeMode(data);
                    }
                    else
                    {
                        // only one textbox appears on the page that handles date and time
                        ProcessNoneMode(data);
                    }
                    break;
                default:
                    break;
            }

            SetDatePickerTitleAndDescription();

            if (dateControl != null)
                dateControl.Text = _dateTimeText;
            if (timeControl != null)
                timeControl.Text = GetTime(data);

            ResetTimeZoneOffsetControl();
        }
        public override object GetData()
        {         
            var format = new DateTimeFormatInfo { ShortDatePattern = CultureInfo.CurrentUICulture.DateTimeFormat.ShortDatePattern };

            var innerDateTextBox = GetInnerControl() as TextBox;
            var innerTimeTextBox = GetTimeControl() as TextBox;
            var innerTimeZoneOffsetTextBox = GetTimeZoneOffsetControl() as TextBox;

            // in browse mode we don't have fieldcontrols
            if (innerDateTextBox == null)
                return _innerData;

            // two textboxes appear on the page, one for handling date and one for handling time value
            var innerDateValue = innerDateTextBox.Text;
            var innerTimeValue = innerTimeTextBox != null ? innerTimeTextBox.Text : string.Empty;

            // This flag may be switched on by OnLoad, if the user posted a value that is invalid 
            // according to the culture that is currently set.
            if (_invalidPostedDate)
                throw new FieldControlDataException(this, ResourceKeyInvalidDate, "Invalid date or time value: " + innerDateValue + " " + innerTimeValue);

            // We assume that at this point the text in the textboxes are UTC values in the
            // default (en-us) format. OnLoad is responsible for converting posted local values
            // to generic UTC ones.
            DateTime date;

            switch (Mode)
            {
                case DateTimeMode.None:
                    if (string.IsNullOrEmpty(innerDateValue))
                        return null;

                    if (!DateTime.TryParse(innerDateValue, DateTimeField.DefaultUICulture, DateTimeStyles.None, out date))
                        throw new FieldControlDataException(this, ResourceKeyInvalidDate, "Invalid date value: " + innerDateValue);

                    return date;
                case DateTimeMode.Date:
                    // Calculate value the same way as in datetime mode, because
                    // the time control is also present in date mode, only hidden
                    // (dates are converted from UTC to local values on client side).
                case DateTimeMode.DateAndTime:
                    if (string.IsNullOrEmpty(innerDateValue) && string.IsNullOrEmpty(innerTimeValue))
                        return null;
                                        
                    if (string.IsNullOrEmpty(innerDateValue))
                    {
                        date = DateTime.Today;
                    }
                    else
                    {
                        if (!DateTime.TryParse(innerDateValue, DateTimeField.DefaultUICulture, DateTimeStyles.None, out date))
                            throw new FieldControlDataException(this, ResourceKeyInvalidDate, "Invalid date value: " + innerDateValue);
                    }

                    var time = DateTime.Today.TimeOfDay;
                    var checkTime = true;

                    if (string.IsNullOrEmpty(innerTimeValue))
                    {
                        if (innerTimeTextBox != null)
                        {
                            // time textbox is empty, use the current time
                            time = DateTime.Today.TimeOfDay;
                            checkTime = false;
                        }
                        else
                        {
                            // there is no time textbox, use the time from 
                            // the first textbox, same as in None mode
                            time = date.TimeOfDay;
                            date = date.Date;

                            innerTimeValue = time.ToString();
                            checkTime = true;
                        }
                    }

                    if (checkTime)
                    {
                        // check if user did not change time (time string is same as originally generated)
                        // if user did not change we don't update the time (since time displayed is not necessarily the same as in db due to precision hacks)
                        if (innerTimeValue == GetTime(_innerData))
                        {
                            time = ((DateTime)_innerData).TimeOfDay;
                        }
                        else
                        {
                            // parse the provided time text
                            if (!TimeSpan.TryParse(innerTimeValue, out time))
                                throw new FieldControlDataException(this, "InvalidTime", "Invalid time value: " + innerTimeValue);
                        }
                    }

                    return ShiftTimeToUTC(date + time, innerTimeZoneOffsetTextBox == null ? string.Empty : innerTimeZoneOffsetTextBox.Text);
                default:
                    break;
            }
            return null;
        }

        // Events ///////////////////////////////////////////////////////////////////////
        protected override void OnInit(EventArgs e)
        {
            base.OnInit(e);

            if (!AutoPostBack)
                return;

            var ic = GetInnerControl() as TextBox;
            if (ic != null)
                ic.TextChanged += _inputTextBox_TextChanged;
        }

        private bool _invalidPostedDate = false;
        protected override void OnLoad(EventArgs e)
        {
            // Re-format the posted date to the generic default culture. This is necessary because
            // the client gets the date in a generic format but displays a local date using a local 
            // format. The client posts that local value here, so we need to convert it from a local 
            // format (e.g. mm.dd.yyyy or any other) back to the generic format, because that is 
            // what we send back to the client (in case this very same page is displayed again).
            if (this.Page.IsPostBack)
            {
                var dateTimeText = GetDateTimeTextFromControls();
                if (!string.IsNullOrEmpty(dateTimeText))
                {
                    DateTime date;
                    
                    // Even if the appropriate jquery datepicker script (for the currently selected
                    // culture) does not exist in the repository, we have to assume that the client 
                    // will post the value according to the format displayed in the description,
                    // which is the currently selected culture's format.
                    if (DateTime.TryParse(dateTimeText, CultureInfo.CurrentUICulture, DateTimeStyles.AssumeLocal, out date))
                    {
                        // The client sends the local timezone offset separately in a textbox. We have
                        // to take that into account when converting the posted value to a UTC date.
                        date = date.Add(GetTimeZoneOffsetFromControl());

                        try
                        {
                            // This resets control values (including offset textbox).
                            SetData(new DateTime(date.Ticks, DateTimeKind.Utc));
                        }
                        catch
                        {
                            // no need to log this, the user will simply got an invalid field error message
                            _invalidPostedDate = true;
                        }
                    }
                    else
                    {
                        // we have to use a flag to notify GetData of the invalid posted date value
                        _invalidPostedDate = true;
                    }
                }

                // The timezone offset is filled by the client every time, if the server left a value
                // in it (we already used the value to 'UTCfy' the date above), it would be confusing.
                if (_invalidPostedDate)
                    ResetTimeZoneOffsetControl();
            }

            base.OnLoad(e);
        }

        protected void _inputTextBox_TextChanged(object sender, EventArgs e)
        {
            if (this.OnDateChanged != null)
                this.OnDateChanged(this, e);
        }
        protected override void RenderContents(HtmlTextWriter writer)
        {
            if (UseBrowseTemplate)
            {
                base.RenderContents(writer);
                return;
            }
            if (UseEditTemplate)
            {
                ManipulateTemplateControls();
                base.RenderContents(writer);
                return;
            }
        }

        #region ITemplateFieldControl Members
        public Control GetInnerControl() { return this.FindControlRecursive(InnerControlID); }
        public Control GetLabelForDescription() { return this.FindControlRecursive(DescriptionControlID); }
        public Control GetLabelForTitleControl() { return this.FindControlRecursive(TitleControlID); }
        public Control GetTimeControl()
        {
            return this.FindControlRecursive(TimeControlID);
        }
        public Control GetTimeZoneOffsetControl()
        {
            return this.FindControlRecursive(TimeZoneOffsetControlID);
        }
        #endregion

        // Internals ////////////////////////////////////////////////////////////////////
        private void ManipulateTemplateControls()
        {
            var ic = GetInnerControl() as TextBox;
            var timeControl = GetTimeControl() as TextBox;
            var offsetControl = GetTimeZoneOffsetControl() as TextBox;
            if (ic == null)
                return;

            if (Field.ReadOnly || ReadOnly)
            {
                ic.Enabled = false;
                ic.EnableViewState = true;
                if (timeControl != null) timeControl.Enabled = false;
                if (offsetControl != null) offsetControl.Enabled = false;
            }

            if (timeControl != null && Mode != DateTimeMode.DateAndTime)
            {
                var timeControlPlaceHolder = this.FindControlRecursive(TimeHolderControlID);
                if (timeControlPlaceHolder != null)
                    timeControlPlaceHolder.Visible = false;

                // hide the control from the user, but still send the time value to the client
                timeControl.Style.Add("display", "none"); 
            }
        }

        private static string GetTime(object data)
        {
            if (data == null)
                throw new ArgumentNullException("data");

            if (data is DateTime)
            {
                var dateTimeData = (DateTime)data;
                if (IsEmptyDateTime(dateTimeData))
                    return string.Empty;

                return GetTimeOfDayText(dateTimeData);
            }

            return GetTimeOfDayText(Convert.ToDateTime(data));
        }
        private void ProcessDateTimeMode(object data)
        {
            ProcessDateMode(data);

            _timeText = data == null ? null : GetTime(data);
        }
        private void ProcessDateMode(object data)
        {
            if (data == null)
            {
                _dateTimeText = null;
            }
            else
            {
                if (data is DateTime)
                {
                    var dateTimeValue = Convert.ToDateTime(data);
                    if (IsEmptyDateTime(dateTimeValue))
                        _dateTimeText = string.Empty;
                    else
                        _dateTimeText = GetDateTimeTextForClient(dateTimeValue, DateTimePatternType.ShortDate);
                }
                else
                {
                    _dateTimeText = data.ToString();
                }
            }
        }
        private void ProcessNoneMode(object data)
        {
            _dateTimeText = data == null
                ? null
                : (data is DateTime ? GetDateTimeTextForClient(Convert.ToDateTime(data)) : data.ToString());
        }

        private bool _titleIsAlreadySet = false;

        private void SetDatePickerTitleAndDescription()
        {
            // do not do this twice
            if (_titleIsAlreadySet)
                return;

            _titleIsAlreadySet = true;

            var title = GetLabelForTitleControl() as Label;
            var desc = GetLabelForDescription() as Label;

            if (title != null) 
                title.Text = HttpUtility.HtmlEncode(Field.DisplayName);

            if (desc != null)
            {
                desc.Text = Sanitizer.Sanitize(Field.Description);

                var dateTimeFormat = System.Threading.Thread.CurrentThread.CurrentUICulture.DateTimeFormat;
                var shortDatePattern = dateTimeFormat.ShortDatePattern;
                var timePattern = dateTimeFormat.ShortTimePattern;
                var pattern = string.Empty;

                switch (Mode)
                {
                    case DateTimeMode.None:
                    case DateTimeMode.DateAndTime:
                        var patternWithTime = HttpContext.GetGlobalResourceObject("Portal", "DateFieldDateTimeFormatDescription") as string ?? "{0} - {1}";
                        pattern = String.Format(patternWithTime, shortDatePattern, timePattern);
                        break;
                    case DateTimeMode.Date:
                        var patternWithoutTime = HttpContext.GetGlobalResourceObject("Portal", "DateFieldDateFormatDescription") as string ?? "{0}";
                        pattern = String.Format(patternWithoutTime, shortDatePattern);
                        break;
                    default:
                        break;
                }

                var text = desc.Text.TrimEnd();
                if (!string.IsNullOrEmpty(text))
                    text = string.Concat(text, "<br />");

                desc.Text = string.Concat(text, pattern);
            }
        }

        /// <summary>
        /// Returns a composit date and time string from the two visible date and time controls.
        /// </summary>
        /// <returns></returns>
        private string GetDateTimeTextFromControls()
        {
            var innerDateTextBox = GetInnerControl() as TextBox;
            var innerTimeTextBox = GetTimeControl() as TextBox;

            if (innerDateTextBox == null || string.IsNullOrEmpty(innerDateTextBox.Text))
                return string.Empty;
            if (innerTimeTextBox == null || string.IsNullOrEmpty(innerTimeTextBox.Text))
                return innerDateTextBox.Text;

            return innerDateTextBox.Text + " " + innerTimeTextBox.Text;
        }

        private TimeSpan GetTimeZoneOffsetFromControl()
        {
            var tzc = GetTimeZoneOffsetControl() as TextBox;
            if (tzc == null)
                return TimeSpan.Zero;

            int minutes;
            if (string.IsNullOrEmpty(tzc.Text) || !int.TryParse(tzc.Text, out minutes))
                return TimeSpan.Zero;

            return new TimeSpan(0, minutes, 0);
        }

        private void ResetTimeZoneOffsetControl()
        {
            // reset time zone offset, it will be filled by the client
            var offsetControl = GetTimeZoneOffsetControl() as TextBox;
            
            if (offsetControl != null)
                offsetControl.Text = string.Empty;
        }

        private static int GetCurrentFirstDay()
        {
            return (int)CultureInfo.CurrentUICulture.DateTimeFormat.FirstDayOfWeek;
        }

        private static string GetTimeOfDayText(DateTime dateTime)
        {
            // Workaround for not displaying the millisecond part of the time.
            // Unfortunately there is no culture-independent string format option for that.
            var time = dateTime.TimeOfDay;
            return new TimeSpan(time.Hours, time.Minutes, time.Seconds).ToString("t");
        }

        private static DateTime ShiftTimeToUTC(DateTime originalTime, string offsetInMinutes)
        { 
            int minutes;
            if (string.IsNullOrEmpty(offsetInMinutes) || !int.TryParse(offsetInMinutes, out minutes))
                return DateTime.SpecifyKind(originalTime, DateTimeKind.Utc);

            return DateTime.SpecifyKind(originalTime.AddMinutes(minutes), DateTimeKind.Utc);
        }

        private static string GetDateTimeTextForClient(DateTime datetime, DateTimePatternType dateTimePattern = DateTimePatternType.Default)
        {
            // We need to format everything in English for the client, as Javascript in some of 
            // the browsers does not understand datetime values in other language formats.
            var ci = DateTimeField.DefaultUICulture;

            switch (dateTimePattern)
            {
                case DateTimePatternType.ShortDate: 
                    return datetime.ToString(ci.DateTimeFormat.ShortDatePattern, ci);
                case DateTimePatternType.ShortTime: 
                    return datetime.ToString(ci.DateTimeFormat.ShortTimePattern, ci);
                default: 
                    return datetime.ToString(ci);
            }
        }

        private static bool IsEmptyDateTime(DateTime dateTimeValue)
        {
            // We have to compare the value to SqlDateTime.MinValue.Value instead of SqlDateTime.MinValue,
            // because the former is a real datetime and the latter is a SqlDateTime which may throw
            // an overflow exception if the compared datetime value is smaller than the min value of SqlDateTime.
            return dateTimeValue == DateTime.MinValue || dateTimeValue == System.Data.SqlTypes.SqlDateTime.MinValue.Value;
        }

        public string GetjqueryLanguageScriptPath()
        { 
            var culture = CultureInfo.CurrentUICulture;

            if (culture.Name == "en-US" || this.Mode == DateTimeMode.None)
                return string.Empty;

            // insert the current language to the path template
            var langPackPath = string.Format(JqueryDatePickerScriptTemplate, culture.Name);
            string langPackFullPath;

            // try to resolve it as a skin-relative path
            if (!SkinManager.TryResolve(langPackPath, out langPackFullPath) && !culture.IsNeutralCulture && culture.Parent != null)
            { 
                // no language pack for this language, try the neutral one (e.g. 'de' instead of 'de-DE')
                langPackPath = string.Format(JqueryDatePickerScriptTemplate, culture.Parent.Name);
            }

            return langPackPath;
        }
    }
}
