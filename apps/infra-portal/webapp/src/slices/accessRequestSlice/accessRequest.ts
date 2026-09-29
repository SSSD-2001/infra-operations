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

export type AccessPermission = "pull" | "triage" | "push";

export enum AccessRequestState {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface AccessRequest {
  id: number;
  email: string;
  githubUsername: string;
  leadEmail: string;
  ccList: string;
  organizationId: number;
  orgName: string;
  repoName: string;
  permission: AccessPermission;
  justification: string;
  state: AccessRequestState;
  reviewerEmail: string | null;
  reviewComment: string | null;
  timestamp: string;
  updatedAt: string | null;
}

export interface AddAccessRequestPayload {
  leadEmail: string;
  ccList: string;
  organizationId: number;
  orgName: string;
  repoName: string;
  permission: AccessPermission;
  justification: string;
}

interface AccessRequestSliceState {
  state: State;
  submitState: State;
  errorMessage: string | null;
  accessRequests: AccessRequest[];
}

const initialState: AccessRequestSliceState = {
  state: State.idle,
  submitState: State.idle,
  errorMessage: null,
  accessRequests: [],
};

export const approveAccessRequest = createAsyncThunk<void, number, { rejectValue: string }>(
    "accessRequest/approveAccessRequest",
    async (id, { dispatch, rejectWithValue }) => {
      try {
        await APIService.getInstance().patch(
          `${AppConfig.serviceUrls.repositoryAccessRequests}/${id}/approve`,
        );
        dispatch(enqueueSnackbarMessage({
          message: "Access request approved.",
          type: "success",
        }));
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.status === HttpStatusCode.InternalServerError
            ? "Unable to approve the access request."
            : String(error.response?.data?.message || error.message || "Unknown error")
          : "An unexpected error occurred";
        dispatch(enqueueSnackbarMessage({ message, type: "error" }));
        return rejectWithValue(message);
      }
    },
);
  
export const rejectAccessRequest = createAsyncThunk<void, { id: number; comment: string }, { rejectValue: string }>(
    "accessRequest/rejectAccessRequest",
    async ({ id, comment }, { dispatch, rejectWithValue }) => {
      try {
        await APIService.getInstance().patch(
          `${AppConfig.serviceUrls.repositoryAccessRequests}/${id}/reject`,
          { comment },
        );
        dispatch(enqueueSnackbarMessage({
          message: "Access request rejected.",
          type: "success",
        }));
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.status === HttpStatusCode.InternalServerError
            ? "Unable to reject the access request."
            : String(error.response?.data?.message || error.message || "Unknown error")
          : "An unexpected error occurred";
        dispatch(enqueueSnackbarMessage({ message, type: "error" }));
        return rejectWithValue(message);
      }
    },
);

export const fetchAccessRequests = createAsyncThunk<
  AccessRequest[],
  { leadEmail?: string } | void,
  { rejectValue: string }
>("accessRequest/fetchAccessRequests", async (filter, { dispatch, rejectWithValue }) => {
  try {
    const response: AxiosResponse<AccessRequest[]> = await APIService.getInstance().get(
      AppConfig.serviceUrls.repositoryAccessRequests,
      { params: filter ?? {} },
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
              ? SnackMessage.error.fetchAccessRequestsMessage
              : String(error.response?.data?.message || "Unknown error"),
          type: "error",
        }),
      );
      return rejectWithValue(error.response?.data || "Failed to fetch access requests");
    }
    return rejectWithValue("An unexpected error occurred");
  }
});

export const addAccessRequest = createAsyncThunk<
  AccessRequest,
  AddAccessRequestPayload,
  { rejectValue: string }
>("accessRequest/addAccessRequest", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const response = await APIService.getInstance().post(
      AppConfig.serviceUrls.repositoryAccessRequests,
      payload,
    );
    dispatch(
      enqueueSnackbarMessage({
        message: SnackMessage.success.addAccessRequest,
        type: "success",
      }),
    );
    return response.data as AccessRequest;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.status === HttpStatusCode.InternalServerError
        ? SnackMessage.error.addAccessRequest
        : String(error.response?.data?.message || error.message || "Unknown error")
      : "An unexpected error occurred";
    dispatch(enqueueSnackbarMessage({ message, type: "error" }));
    return rejectWithValue(message);
  }
});

const accessRequestSlice = createSlice({
  name: "accessRequest",
  initialState,
  reducers: {
    resetAccessRequestState(state) {
      state.state = State.idle;
      state.submitState = State.idle;
      state.errorMessage = null;
      state.accessRequests = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessRequests.pending, (state) => {
        state.state = State.loading;
        state.errorMessage = null;
      })
      .addCase(fetchAccessRequests.fulfilled, (state, action) => {
        state.state = State.success;
        state.errorMessage = null;
        state.accessRequests = action.payload;
      })
      .addCase(fetchAccessRequests.rejected, (state, action) => {
        if (action.payload === "Request canceled") {
          return;
        }
        state.state = State.failed;
        state.errorMessage = "Failed to fetch access requests";
      })
      .addCase(addAccessRequest.pending, (state) => {
        state.submitState = State.loading;
        state.errorMessage = null;
      })
      .addCase(addAccessRequest.fulfilled, (state, action) => {
        state.submitState = State.success;
        state.errorMessage = null;
        state.accessRequests = [action.payload, ...state.accessRequests];
      })
      .addCase(addAccessRequest.rejected, (state) => {
        state.submitState = State.failed;
        state.errorMessage = "Failed to create access request";
      });
  },
});

export const { resetAccessRequestState } = accessRequestSlice.actions;
export default accessRequestSlice.reducer;