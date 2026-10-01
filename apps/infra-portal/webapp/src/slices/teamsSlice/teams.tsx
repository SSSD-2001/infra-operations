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
import axios, { AxiosResponse, HttpStatusCode } from "axios";

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

interface TeamsState {
  state: State;
  teams: string[] | null;
  errorMessage: string | null;
}

const initialState: TeamsState = {
  state: State.idle,
  teams: null,
  errorMessage: null,
};

export const fetchTeams = createAsyncThunk<string[], string, { rejectValue: string }>(
  "teams/fetchTeams",
  async (organization: string, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response: AxiosResponse<string[]> = await APIService.getInstance().get(
        AppConfig.serviceUrls.teams,
        {
          params: { organization },
          cancelToken: newCancelTokenSource.token,
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }

      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.fetchTeamsMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch teams");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

const teamsSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    resetTeamsState(state) {
      state.state = State.idle;
      state.teams = null;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.state = State.loading;
        state.errorMessage = "Fetching teams...";
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.state = State.success;
        state.teams = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchTeams.rejected, (state) => {
        state.state = State.failed;
        state.errorMessage = "Failed to fetch teams";
      });
  },
});

export const { resetTeamsState } = teamsSlice.actions;
export default teamsSlice.reducer;
