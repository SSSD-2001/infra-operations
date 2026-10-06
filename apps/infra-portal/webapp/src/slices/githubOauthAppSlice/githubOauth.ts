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
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";

import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { State } from "@root/src/types/types";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

interface GitHubConnectPayload {
  code: string;
}

export interface GitHubUserVerifyResponse {
  status: string;
  githubUserId?: string;
  githubUsername?: string;
}

export interface SetDefaultRepositoryAccessResponse {
  successfulMemberships: unknown[];
  failedMemberships: unknown[];
}

export type DefaultAccessStatus = "not_granted" | "granting" | "granted";

export interface GitHubConnectState {
  state: State;
  githubUserId?: string;
  githubUsername?: string;
  defaultAccessState: State;
  defaultAccessFetchState: State;
  defaultAccessStatus?: DefaultAccessStatus;
  defaultAccessOrganizations: DefaultAccessOrganization[];
  defaultAccessErrorMessage?: string | null;
  errorMessage?: string | null;
}

const initialState: GitHubConnectState = {
  state: State.idle,
  defaultAccessState: State.idle,
  defaultAccessFetchState: State.idle,
  defaultAccessOrganizations: [],
};

export interface DefaultAccessRepository {
  name: string;
  htmlUrl: string;
}

export interface DefaultAccessOrganization {
  orgName: string;
  avatarUrl: string;
  repositories: DefaultAccessRepository[];
}

export interface DefaultRepositoryAccessResponse {
  status: DefaultAccessStatus;
  organizations: DefaultAccessOrganization[];
}

export const connectGitHub = createAsyncThunk(
  "auth/connectGitHub",
  async ({ code }: GitHubConnectPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.githubVerifyAndPersistUser,
        {
          code,
        },
      );
      return response.data as GitHubUserVerifyResponse;
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.githubConnectMessage
                : String((error.response?.data as { message?: string }).message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to connect GitHub");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const setDefaultRepositoryAccess = createAsyncThunk(
  "auth/setDefaultRepositoryAccess",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().put(
        AppConfig.serviceUrls.setDefaultRepositoryAccess,
      );
      const data = response.data as SetDefaultRepositoryAccessResponse;
      if (data.failedMemberships?.length) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.error.setDefaultRepositoryAccessMessage,
            type: "error",
          }),
        );
        return rejectWithValue(data);
      }
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.setDefaultRepositoryAccessMessage,
          type: "success",
        }),
      );
      return data;
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.setDefaultRepositoryAccessMessage
                : String(
                    (error.response?.data as { message?: string } | undefined)?.message ||
                      "Unknown error",
                  ),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to set default repository access");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const fetchDefaultRepositoryAccess = createAsyncThunk(
  "auth/fetchDefaultRepositoryAccess",
  async (_, { rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.defaultRepositoryAccess,
      );
      return response.data as DefaultRepositoryAccessResponse;
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || "Failed to fetch default repository access");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

const githubConnectSlice = createSlice({
  name: "githubConnect",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDefaultRepositoryAccess.pending, (state) => {
        state.defaultAccessFetchState = State.loading;
      })
      .addCase(fetchDefaultRepositoryAccess.fulfilled, (state, action) => {
        state.defaultAccessFetchState = State.success;
        state.defaultAccessStatus = action.payload.status;
        state.defaultAccessOrganizations = action.payload.organizations;
        state.defaultAccessErrorMessage = null;
      })
      .addCase(fetchDefaultRepositoryAccess.rejected, (state, action) => {
        // Superseded requests are cancelled by the API service, which is not a real failure.
        if (action.payload === "Request canceled") {
          return;
        }
        state.defaultAccessFetchState = State.failed;
        state.defaultAccessErrorMessage =
          typeof action.payload === "string"
            ? action.payload
            : ((action.payload as { message?: string } | undefined)?.message ??
              "Unable to load default repository access.");
      })
      .addCase(connectGitHub.pending, (state) => {
        state.state = State.loading;
        state.errorMessage = null;
      })
      .addCase(connectGitHub.fulfilled, (state, action) => {
        const { status, githubUserId, githubUsername }: GitHubUserVerifyResponse = action.payload;
        if (status === "verified") {
          state.state = State.success;
          state.githubUserId = githubUserId;
          state.githubUsername = githubUsername;
        } else {
          state.state = State.failed;
          state.githubUserId = undefined;
          state.githubUsername = undefined;
          state.errorMessage = SnackMessage.error.githubUnverifiedMessage;
        }
      })
      .addCase(connectGitHub.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
      })
      .addCase(setDefaultRepositoryAccess.pending, (state) => {
        state.defaultAccessState = State.loading;
        state.defaultAccessStatus = "granting";
      })
      .addCase(setDefaultRepositoryAccess.fulfilled, (state) => {
        state.defaultAccessState = State.success;
        state.defaultAccessStatus = "granted";
      })
      .addCase(setDefaultRepositoryAccess.rejected, (state) => {
        state.defaultAccessState = State.failed;
        state.defaultAccessStatus = "not_granted";
      });
  },
});

export default githubConnectSlice.reducer;
