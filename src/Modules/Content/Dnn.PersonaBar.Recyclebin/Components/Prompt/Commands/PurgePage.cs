﻿using System.Collections.Generic;
using System.Text;
using Dnn.PersonaBar.Library.Prompt;
using Dnn.PersonaBar.Library.Prompt.Attributes;
using Dnn.PersonaBar.Library.Prompt.Models;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Entities.Tabs;
using DotNetNuke.Entities.Users;

namespace Dnn.PersonaBar.Recyclebin.Components.Prompt.Commands
{
    [ConsoleCommand("purge-page", Constants.RecylcleBinCategory, "Prompt_PurgePage_Description")]
    public class PurgePage : ConsoleCommandBase
    {
        public override string LocalResourceFile => Constants.LocalResourcesFile;

        [FlagParameter("id", "Prompt_PurgePage_FlagId", "Integer", true)]
        private const string FlagId = "id";

        [FlagParameter("deletechildren", "Prompt_PurgePage_FlagDeleteChildren", "Boolean", "false")]
        private const string FlagDeleteChildren = "deletechildren";

        private int PageId { get; set; }
        private bool DeleteChildren { get; set; }

        public override void Init(string[] args, PortalSettings portalSettings, UserInfo userInfo, int activeTabId)
        {
            
            PageId = GetFlagValue(FlagId, "Page Id", -1, true, true, true);
            DeleteChildren = GetFlagValue(FlagDeleteChildren, "Delete Children", false);
        }

        public override ConsoleResultModel Run()
        {
            var tabInfo = TabController.Instance.GetTab(PageId, PortalSettings.PortalId);
            if (tabInfo == null)
            {
                return new ConsoleErrorResultModel(string.Format(LocalizeString("PageNotFound"), PageId));
            }
            var errors = new StringBuilder();
            RecyclebinController.Instance.DeleteTabs(new List<TabInfo> { tabInfo }, errors, DeleteChildren);
            return errors.Length > 0
                ? new ConsoleErrorResultModel(string.Format(LocalizeString("Service_RemoveTabError"), errors))
                : new ConsoleResultModel(string.Format(LocalizeString("Prompt_PagePurgedSuccessfully"), PageId)) { Records = 1 };
        }
    }
}