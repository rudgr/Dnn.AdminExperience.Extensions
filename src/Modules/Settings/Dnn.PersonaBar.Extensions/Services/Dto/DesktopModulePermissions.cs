﻿#region Copyright
// DotNetNuke® - http://www.dotnetnuke.com
// Copyright (c) 2002-2016
// by DotNetNuke Corporation
// All Rights Reserved
#endregion

using System.Runtime.Serialization;
using Dnn.PersonaBar.Library.DTO;
using Dnn.PersonaBar.Library.Helper;
using DotNetNuke.Entities.Portals;
using DotNetNuke.Security.Permissions;

namespace Dnn.PersonaBar.Extensions.Services.DTO
{
    public class DesktopModulePermissions : Permissions
    {
        public DesktopModulePermissions(bool needDefinitions) : base(needDefinitions)
        {
            foreach (var role in PermissionProvider.Instance().ImplicitRolesForPages(PortalSettings.Current.PortalId))
            {
                this.EnsureRole(role, true, true);
            }
        }

        [DataMember(Name = "desktopModuleId")]
        public int DesktopModuleId { get; set; }

        protected override void LoadPermissionDefinitions()
        {
            foreach (PermissionInfo permission in PermissionController.GetPermissionsByPortalDesktopModule())
            {
                PermissionDefinitions.Add(new Permission()
                {
                    PermissionId = permission.PermissionID,
                    PermissionName = permission.PermissionName,
                    FullControl = PermissionHelper.IsFullControl(permission),
                    View = PermissionHelper.IsViewPermisison(permission)
                });
            }
        }
    }
}