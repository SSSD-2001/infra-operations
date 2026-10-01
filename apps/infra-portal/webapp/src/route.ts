// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { GitHub } from "@mui/icons-material";
import {
  BookKey,
  BookMarked,
  ClipboardList,
  Eye,
  HomeIcon,
  Settings,
  Shield,
  ShieldUser,
} from "lucide-react";
import { CircleQuestionMark } from "lucide-react";
import type { RouteObject } from "react-router-dom";

import React from "react";

import { Role } from "@slices/authSlice/auth";
import { isIncludedRole } from "@utils/utils";
import { View } from "@view/index";

import type { RouteDetail, RouteObjectWithRole } from "./types/types";

export const routes: RouteObjectWithRole[] = [
  {
    path: "/",
    text: "Home",
    icon: React.createElement(HomeIcon),
    element: React.createElement(View.home),
    allowRoles: [Role.EMPLOYEE],
  },
  {
    path: "/help",
    text: "Help & Support",
    icon: React.createElement(CircleQuestionMark),
    element: React.createElement(View.help),
    allowRoles: [Role.EMPLOYEE],
    bottomNav: true,
  },
  {
    path: "/security-dashboard",
    text: "Security Dashboard",
    icon: React.createElement(Shield),
    element: React.createElement(View.securityDashboard),
    allowRoles: [Role.ADMIN, Role.EMPLOYEE],
  },

  {
    path: "/github",
    text: "Github",
    icon: React.createElement(GitHub),
    element: React.createElement(View.github),
    allowRoles: [Role.EMPLOYEE],
    children: [
      {
        path: "repository-requests",
        text: "Repository Requests",
        icon: React.createElement(BookMarked),
        element: React.createElement(View.repositoryCreationRequests),
        allowRoles: [Role.EMPLOYEE],
      },
      {
        path: "repository-access-requests",
        text: "Repository Access Requests",
        icon: React.createElement(BookKey),
        element: React.createElement(View.repositoryAccessRequests),
        allowRoles: [Role.EMPLOYEE],
      },
      {
        path: "my-requests",
        text: "My Requests",
        icon: React.createElement(ClipboardList),
        element: React.createElement(View.myRequests),
        allowRoles: [Role.EMPLOYEE],
      },
      {
        path: "review-repository-requests",
        text: "Review Repository Requests",
        icon: React.createElement(Eye),
        element: React.createElement(View.reviewRequests),
        allowRoles: [Role.ADMIN, Role.APPROVER],
      },
    ],
  },
  {
    path: "admin",
    text: "Admin",
    icon: React.createElement(ShieldUser),
    element: React.createElement(View.admin),
    allowRoles: [Role.ADMIN],
    children: [
      {
        path: "github-settings",
        text: "GitHub Settings",
        icon: React.createElement(Settings),
        element: React.createElement(View.githubSettings),
        allowRoles: [Role.ADMIN],
      },
    ],
  },
];

export const getActiveRoutesV2 = (
  routes: RouteObjectWithRole[] | undefined,
  roles: string[],
): RouteObjectWithRole[] => {
  if (!routes) return [];
  const routesObj: RouteObjectWithRole[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        children: getActiveRoutesV2(routeObj.children, roles),
      });
    }
  });

  return routesObj;
};

export const getActiveRoutes = (roles: string[]): RouteObject[] => {
  const routesObj: RouteObject[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
      });
    }
  });
  return routesObj;
};

export const getActiveRouteDetails = (roles: string[]): RouteDetail[] => {
  const routesObj: RouteDetail[] = [];
  routes.forEach((routeObj) => {
    if (isIncludedRole(roles, routeObj.allowRoles)) {
      routesObj.push({
        ...routeObj,
        path: routeObj.path ?? "",
        children: getActiveRoutesV2(routeObj.children, roles),
      });
    }
  });
  return routesObj;
};

interface getActiveParentRoutesProps {
  routes: RouteObjectWithRole[] | undefined;
  roles: string[];
}

export const getActiveParentRoutes = ({ routes, roles }: getActiveParentRoutesProps): string[] => {
  if (!routes) return [];

  const activeParentPaths: string[] = [];

  routes.forEach((routeObj) => {
    if (!routeObj.element) return;

    if (isIncludedRole(roles, routeObj.allowRoles)) {
      if (routeObj.path) {
        activeParentPaths.push(routeObj.path);
      }
    }
  });

  return activeParentPaths;
};
