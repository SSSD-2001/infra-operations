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

export interface DefaultTeam {
  teamId: number;
  teamName: string;
  permissionLevel: string;
}

interface DefaultTeamsState {
  state: State;
  functionType?: string;
  defaultTeams: DefaultTeam[] | undefined;
  errorMessage: string | null;
}

const initialState: DefaultTeamsState = {
  state: State.idle,
  defaultTeams: undefined,
  errorMessage: null,
};

export interface AddDefaultTeamPayload {
  teamName: string;
  permissionLevel: string;
}

type CancellationStatus = { canceled: boolean };

export const fetchDefaultTeams = createAsyncThunk<
  DefaultTeam[],
  void,
  { rejectValue: CancellationStatus | string | unknown }
>("defaultTeams/fetchDefaultTeams", async (_, { dispatch, rejectWithValue }) => {
  APIService.getCancelToken().cancel();
  const newCancelTokenSource = APIService.updateCancelToken();
  try {
    const response: AxiosResponse<DefaultTeam[]> = await APIService.getInstance().get(
      AppConfig.serviceUrls.defaultTeams,
      {
        cancelToken: newCancelTokenSource.token,
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      return rejectWithValue({ canceled: true });
    }
    if (axios.isAxiosError(error)) {
      dispatch(
        enqueueSnackbarMessage({
          message:
            error.response?.status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.fetchDefaultTeamsMessage
              : String(error.response?.data?.message || "Unknown error"),
          type: "error",
        }),
      );
      return rejectWithValue(error.response?.data || "Failed to fetch default teams");
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

export const addDefaultTeam = createAsyncThunk<
  void,
  AddDefaultTeamPayload,
  { rejectValue: string }
>(
  "defaultTeams/addDefaultTeam",
  async (payload: AddDefaultTeamPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.defaultTeams,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.addDefaultTeamMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.addDefaultTeamMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const updateDefaultTeam = createAsyncThunk<void, DefaultTeam, { rejectValue: string }>(
  "defaultTeams/updateTeam",
  async (payload: DefaultTeam, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().put(
        `${AppConfig.serviceUrls.defaultTeams}/${payload.teamId}`,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.updateDefaultTeamMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.updateDefaultTeamMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const deleteDefaultTeam = createAsyncThunk<number, number, { rejectValue: string }>(
  "defaultTeams/deleteDefaultTeam",
  async (teamId: number, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    try {
      await APIService.getInstance().delete(`${AppConfig.serviceUrls.defaultTeams}/${teamId}`);
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.deleteDefaultTeamMessage,
          type: "success",
        }),
      );
      return teamId;
    } catch (error) {
      let errorMessage = "Failed to delete default team";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.deleteDefaultTeamMessage
            : String(error.response?.data?.message || errorMessage);
      }
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

const isCancellation = (payload: unknown): payload is CancellationStatus => {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "canceled" in payload &&
    typeof payload.canceled === "boolean"
  );
};

const defaultTeamsSlice = createSlice({
  name: "defaultTeams",
  initialState,
  reducers: {
    resetDefaultTeamsState(state) {
      state.state = State.idle;
      state.defaultTeams = undefined;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDefaultTeams.pending, (state) => {
        state.state = State.loading;
        state.functionType = "fetch";
        state.errorMessage = "Loading default teams...";
      })
      .addCase(fetchDefaultTeams.fulfilled, (state, action) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
        state.defaultTeams = action.payload;
      })
      .addCase(fetchDefaultTeams.rejected, (state, action) => {
        if (isCancellation(action.payload) && action.payload.canceled) {
          if (!state.defaultTeams) {
            state.state = State.idle;
            state.errorMessage = null;
          }
          return;
        }
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to load default teams";
      })
      .addCase(addDefaultTeam.pending, (state) => {
        state.state = State.loading;
        state.functionType = "create";
        state.errorMessage = "Adding default team...";
      })
      .addCase(addDefaultTeam.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(addDefaultTeam.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to add default team";
      })
      .addCase(updateDefaultTeam.pending, (state) => {
        state.state = State.loading;
        state.functionType = "update";
        state.errorMessage = "Updating default team...";
      })
      .addCase(updateDefaultTeam.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(updateDefaultTeam.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to update default team";
      })
      .addCase(deleteDefaultTeam.pending, (state) => {
        state.state = State.loading;
        state.functionType = "delete";
        state.errorMessage = "Deleting default team...";
      })
      .addCase(deleteDefaultTeam.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(deleteDefaultTeam.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to delete default team";
      });
  },
});

export const { resetDefaultTeamsState } = defaultTeamsSlice.actions;
export default defaultTeamsSlice.reducer;
