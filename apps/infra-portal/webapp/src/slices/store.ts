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
import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import authReducer from "@slices/authSlice/auth";
import commentsReducer from "@slices/commentSlice/comment";
import commonReducer from "@slices/commonSlice/common";
import defaultTeamsReducer from "@slices/defaultTeamSlice/defaultTeams";
import employeeReducer from "@slices/employeeSlice/employee";
import githubConnectReducer from "@slices/githubOauthAppSlice/githubOauth";
import leadsReducer from "@slices/leadsSlice/leads";
import organizationsReducer from "@slices/organizationsSlice/organizations";
import repositoryRequestReducer from "@slices/repositoryRequestSlice/repositoryRequest";
import securityDashboardLinksReducer from "@slices/securityDashboardLinksSlice/securityDashboardLinks";
import teamsReducer from "@slices/teamsSlice/teams";
import topicsReducer from "@slices/topicsSlice/topics";
import userReducer from "@slices/userSlice/user";

enableMapSet();

export const store = configureStore({
  reducer: {
    repositoryRequest: repositoryRequestReducer,
    auth: authReducer,
    user: userReducer,
    common: commonReducer,
    employee: employeeReducer,
    teams: teamsReducer,
    topics: topicsReducer,
    leads: leadsReducer,
    organizations: organizationsReducer,
    comments: commentsReducer,
    defaultTeams: defaultTeamsReducer,
    githubConnect: githubConnectReducer,
    securityDashboardLinks: securityDashboardLinksReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
