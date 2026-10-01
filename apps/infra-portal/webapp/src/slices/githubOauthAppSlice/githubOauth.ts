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

interface GitHubConnectState {
  state: State;
  githubUserId?: string; // stored temporarily until SCIM calls are in place to add the id to the asgardeo claim
  githubUsername?: string;
  errorMessage?: string | null;
}

const initialState: GitHubConnectState = {
  state: State.idle,
};

export const connectGitHub = createAsyncThunk(
  "auth/connectGitHub",
  async ({ code }: GitHubConnectPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.githubVerifyEmail,
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

const githubConnectSlice = createSlice({
  name: "githubConnect",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export default githubConnectSlice.reducer;
