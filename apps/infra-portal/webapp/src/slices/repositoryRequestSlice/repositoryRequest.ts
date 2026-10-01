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
import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosResponse, HttpStatusCode } from "axios";

import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";

interface RepositoryRequestState {
  state: State;
  errorMessage: string | null;
  repositoryRequests: RepositoryRequests;
  submitState: State;
  functionType?: string;
}

const initialState: RepositoryRequestState = {
  state: State.idle,
  submitState: State.idle,
  errorMessage: null,
  repositoryRequests: {
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    repositoryRequests: [],
  },
  functionType: undefined,
};

interface RepositoryRequests {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  repositoryRequests: RepositoryRequest[];
}

export interface RepositoryRequest {
  id: number;
  email: string;
  leadEmail: string;
  requirement: string;
  ccList: string;
  repoName: string;
  organizationName: string;
  organizationId: number;
  organizationVisibility: string;
  repoType: string;
  description: string;
  enableIssues: string;
  websiteUrl?: string;
  topics: string;
  prProtection: string;
  teams: string;
  enableTriageWso2All: string;
  enableTriageWso2AllInterns: string;
  disableTriageReason: string;
  cicdRequirement: string;
  jenkinsJobType?: string;
  jenkinsGroupId?: string;
  azureDevopsOrg?: string;
  azureDevopsProject?: string;
  timestamp: string;
  state: RequestApprovalState;
  updatedAt: string;
}

export enum RequestApprovalState {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export interface AddRepositoryRequestPayload {
  email: string;
  leadEmail: string;
  requirement: string;
  ccList: string;
  repoName: string;
  organizationId: number;
  repoType: string;
  description: string;
  enableIssues: string;
  websiteUrl?: string;
  topics: string;
  prProtection: string;
  teams: string;
  enableTriageWso2All: string;
  enableTriageWso2AllInterns: string;
  disableTriageReason: string;
  cicdRequirement: string;
  jenkinsJobType?: string;
  jenkinsGroupId?: string;
  azureDevopsOrg?: string;
  azureDevopsProject?: string;
}

export interface RepositoryRequestFilter {
  memberEmail?: string | undefined;
  leadEmail?: string | undefined;
  approvalState?: RequestApprovalState;
  limit?: number;
  offset?: number;
  repoName?: string;
}

export const fetchRepositoryRequests = createAsyncThunk<
  RepositoryRequests,
  RepositoryRequestFilter,
  { rejectValue: string }
>(
  "repositoryRequest/fetchRepositoryRequests",
  async (filterPayload: RepositoryRequestFilter, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response: AxiosResponse<RepositoryRequests> = await APIService.getInstance().get(
        AppConfig.serviceUrls.repositoryRequests,
        {
          cancelToken: newCancelTokenSource.token,
          params: { ...filterPayload },
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
                ? SnackMessage.error.fetchRepositoryRequestsMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch repository requests");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const addRepositoryRequests = createAsyncThunk<
  void,
  AddRepositoryRequestPayload,
  { rejectValue: string }
>(
  "repositoryRequest/addRepositoryRequests",
  async (payload: AddRepositoryRequestPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.repositoryRequests,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.addRepositoryRequests,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.addRepositoryRequests
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const rejectRepositoryRequest = createAsyncThunk<void, number, { rejectValue: string }>(
  "repositoryRequest/rejectRepositoryRequest",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().patch(
        `${AppConfig.serviceUrls.repositoryRequests}/${id}/reject`,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.rejectRepositoryRequest,
          type: "success",
        }),
      );

      return response.data;
    } catch (error) {
      let errorMessage = "Failed to reject repository request";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.rejectRepositoryRequest
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

export const updateRepositoryRequest = createAsyncThunk<
  void,
  Partial<RepositoryRequest>,
  { rejectValue: string }
>(
  "repositoryRequest/updateRepositoryRequest",
  async (payload: Partial<RepositoryRequest>, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().patch(
        `${AppConfig.serviceUrls.repositoryRequests}/${payload.id}`,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.updateRepositoryRequest,
          type: "success",
        }),
      );

      return response.data;
    } catch (error) {
      let errorMessage = "Failed to update repository request";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.updateRepositoryRequest
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

export const approveRepositoryRequest = createAsyncThunk<void, number, { rejectValue: string }>(
  "repositoryRequest/approveRepositoryRequest",
  async (id: number, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().patch(
        `${AppConfig.serviceUrls.repositoryRequests}/${id}/approve`,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.approveRepositoryRequest,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      let errorMessage = "Failed to approve repository request";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.approveRepositoryRequest
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

const RepositoryRequestSlice = createSlice({
  name: "repositoryRequest",
  initialState,
  reducers: {
    resetRepositoryRequestState(state) {
      state.state = State.idle;
      state.submitState = State.idle;
      state.repositoryRequests = {
        totalCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        repositoryRequests: [],
      };
      state.errorMessage = null;
      state.functionType = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepositoryRequests.pending, (state) => {
        state.state = State.loading;
        state.functionType = "fetch";
        state.errorMessage = "Fetching repositoryRequests...";
      })
      .addCase(fetchRepositoryRequests.fulfilled, (state, action) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
        state.repositoryRequests = action.payload;
      })
      .addCase(fetchRepositoryRequests.rejected, (state, action) => {
        if (action.payload === "Request canceled") {
          if (!state.repositoryRequests) {
            state.state = State.idle;
            state.errorMessage = null;
          }
          return;
        }
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to fetch!";
      })
      .addCase(addRepositoryRequests.pending, (state) => {
        state.state = State.loading;
        state.functionType = "create";
        state.errorMessage = "Creating repositoryRequests...";
      })
      .addCase(addRepositoryRequests.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(addRepositoryRequests.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to create!";
      })
      .addCase(rejectRepositoryRequest.pending, (state) => {
        state.state = State.loading;
        state.functionType = "reject";
        state.errorMessage = "Rejecting repositoryRequests...";
      })
      .addCase(rejectRepositoryRequest.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(rejectRepositoryRequest.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to reject!";
      })
      .addCase(updateRepositoryRequest.pending, (state) => {
        state.state = State.loading;
        state.functionType = "update";
        state.errorMessage = "Updating repositoryRequests...";
      })
      .addCase(updateRepositoryRequest.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(updateRepositoryRequest.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to update!";
      })
      .addCase(approveRepositoryRequest.pending, (state) => {
        state.submitState = State.loading;
        state.functionType = "approve";
        state.errorMessage = "Approving repositoryRequests...";
      })
      .addCase(approveRepositoryRequest.fulfilled, (state) => {
        state.submitState = State.idle;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(approveRepositoryRequest.rejected, (state) => {
        state.submitState = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to approve!";
      });
  },
});

export const { resetRepositoryRequestState } = RepositoryRequestSlice.actions;
export default RepositoryRequestSlice.reducer;
