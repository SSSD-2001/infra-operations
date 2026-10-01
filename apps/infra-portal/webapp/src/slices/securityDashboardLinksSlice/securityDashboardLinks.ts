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

interface SecurityDashboardLinksState {
  state: State;
  links: SecurityDashboardLinks;
  error: string | null;
}

const initialState: SecurityDashboardLinksState = {
  state: State.idle,
  links: {
    deviceComplianceLink: "",
    softwareComplianceLink: "",
    securityScoreLink: "",
  },
  error: null,
};

interface SecurityDashboardLinks {
  deviceComplianceLink: string;
  softwareComplianceLink: string;
  securityScoreLink: string;
}

export const fetchSecurityDashboardLinks = createAsyncThunk<
  SecurityDashboardLinks,
  void,
  { rejectValue: string }
>(
  "securityDashboardLinks/fetchSecurityDashboardLinks",
  async (_, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.securityDashboardLinks,
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
                ? SnackMessage.error.fetchSecurityDashboardLinksMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch security dashboard links");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

const securityDashboardLinksSlice = createSlice({
  name: "securityDashboardLinks",
  initialState,
  reducers: {
    resetSecurityDashboardLinksState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecurityDashboardLinks.pending, (state) => {
        state.state = State.loading;
        state.error = null;
      })
      .addCase(fetchSecurityDashboardLinks.fulfilled, (state, action) => {
        state.state = State.success;
        state.links = action.payload;
      })
      .addCase(fetchSecurityDashboardLinks.rejected, (state, action) => {
        state.state = State.failed;
        state.error = action.payload || "Failed to fetch security dashboard links";
      });
  },
});

export const { resetSecurityDashboardLinksState } = securityDashboardLinksSlice.actions;
export default securityDashboardLinksSlice.reducer;
