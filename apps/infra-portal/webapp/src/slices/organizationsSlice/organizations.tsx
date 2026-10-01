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

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

export interface Organization {
  organizationId: number;
  organizationName: string;
  organizationVisibility: string;
  organizationPlan: string;
  enableIssues: boolean | number;
  defaultTeams: string;
  teamIds: string;
}

interface OrganizationsState {
  state: State;
  functionType?: string;
  organizations: Organization[] | null;
  errorMessage: string | null;
}

const initialState: OrganizationsState = {
  state: State.idle,
  organizations: null,
  errorMessage: null,
};

export interface AddOrganizationPayload {
  organizationName: string;
  organizationVisibility: string;
  enableIssues: boolean;
  teamIds: number[];
}

export interface UpdateOrganizationPayload {
  organizationId: number;
  organizationName: string;
  organizationVisibility: string;
  enableIssues: boolean;
  teamIds: number[];
}

export interface SyncOrganizationPayload {
  organizationName: string;
}

export const fetchOrganizations = createAsyncThunk<Organization[], void, { rejectValue: string }>(
  "organizations/fetchOrganizations",
  async (_, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response = await APIService.getInstance().get(AppConfig.serviceUrls.organizations, {
        cancelToken: newCancelTokenSource.token,
      });
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
                ? SnackMessage.error.fetchOrganizationsMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch organizations");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const fetchOrganizationById = createAsyncThunk<
  Organization,
  number,
  { rejectValue: string }
>(
  "organizations/fetchOrganization",
  async (organizationId: number, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.organizations + `/${organizationId}`,
        {
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
                ? SnackMessage.error.fetchOrganizationMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch organization");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const addOrganization = createAsyncThunk<
  void,
  AddOrganizationPayload,
  { rejectValue: string }
>(
  "organizations/addOrganizations",
  async (payload: AddOrganizationPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.organizations,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.addOrganizationMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.addOrganizationMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const updateOrganization = createAsyncThunk<
  void,
  UpdateOrganizationPayload,
  { rejectValue: string }
>(
  "organizations/updateOrganization",
  async (payload: UpdateOrganizationPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().put(
        `${AppConfig.serviceUrls.organizations}/${payload.organizationId}`,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.updateOrganizationMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.updateOrganizationMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const syncOrganization = createAsyncThunk<
  void,
  SyncOrganizationPayload,
  { rejectValue: string }
>(
  "organizations/syncOrganization",
  async (payload: SyncOrganizationPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().patch(
        `${AppConfig.serviceUrls.organizations}/${payload.organizationName}/sync-plan`,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.syncOrganizationMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.syncOrganizationMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const deleteOrganization = createAsyncThunk<void, number, { rejectValue: string }>(
  "organizations/deleteOrganization",
  async (organizationId: number, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    try {
      const response = await APIService.getInstance().delete(
        `${AppConfig.serviceUrls.organizations}/${organizationId}`,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.deleteOrganizationMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      let errorMessage = "Failed to delete repository request";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.deleteOrganizationMessage
            : String(error.response?.data?.message || errorMessage);
      }
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(axios.isAxiosError(error) ? error.response?.data : errorMessage);
    }
  },
);

const organizationsSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    resetTeamsState(state) {
      state.state = State.idle;
      state.organizations = null;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.state = State.loading;
        state.functionType = "fetch";
        state.errorMessage = "Fetching organizations...";
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
        state.organizations = action.payload;
      })
      .addCase(fetchOrganizations.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to fetch organizations";
      })
      .addCase(addOrganization.pending, (state) => {
        state.state = State.loading;
        state.functionType = "create";
        state.errorMessage = "Adding organization...";
      })
      .addCase(addOrganization.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(addOrganization.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to add organization";
      })
      .addCase(updateOrganization.pending, (state) => {
        state.state = State.loading;
        state.functionType = "update";
        state.errorMessage = "Updating organization...";
      })
      .addCase(updateOrganization.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(updateOrganization.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to update organization";
      })
      .addCase(syncOrganization.pending, (state) => {
        state.state = State.loading;
        state.functionType = "sync";
        state.errorMessage = "Syncing organization...";
      })
      .addCase(syncOrganization.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(syncOrganization.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to sync organization";
      })
      .addCase(deleteOrganization.pending, (state) => {
        state.state = State.loading;
        state.functionType = "delete";
        state.errorMessage = "Deleting organization...";
      })
      .addCase(deleteOrganization.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(deleteOrganization.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to delete organization";
      });
  },
});

export const { resetTeamsState } = organizationsSlice.actions;
export default organizationsSlice.reducer;
