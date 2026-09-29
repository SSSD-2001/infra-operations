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

import { useEffect } from "react";

import GroupsIcon from "@mui/icons-material/Groups";
import GroupIcon from "@mui/icons-material/Group";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";

import TabsPage from "@layout/pages/TabsPage";
import AllGroups from "./panel/AllGroups";
import DefaultGroups from "./panel/DefaultGroups";
import PublicGroups from "./panel/PublicGroups";
import PrivateGroups from "./panel/PrivateGroups";
import { useAppDispatch } from "@root/src/slices/store";
import { getUserGroups } from "@slices/userGroupsSlice/userGroups";

export default function EmailGroups() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getUserGroups());
  }, [dispatch]);

  return (
    <TabsPage
      title="Email Groups"
      tabsPage={[
        {
          tabTitle: "All Groups",
          tabPath: "tab-one",
          icon: <GroupsIcon />,
          page: <AllGroups />,
        },
        {
          tabTitle: "Default Groups",
          tabPath: "tab-two",
          icon: <GroupIcon />,
          page: <DefaultGroups />,
        },
        {
          tabTitle: "Public Groups",
          tabPath: "tab-three",
          icon: <PublicIcon />,
          page: <PublicGroups />,
        },
        {
          tabTitle: "Private Groups",
          tabPath: "tab-four",
          icon: <LockIcon />,
          page: <PrivateGroups />,
        },
      ]}
    />
  );
}
