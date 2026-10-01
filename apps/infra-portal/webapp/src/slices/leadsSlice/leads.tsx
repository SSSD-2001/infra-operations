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

export interface Lead {
  leadId: number;
  leadEmail: string;
  teamName: string;
}

interface LeadsState {
  state: State;
  functionType?: string;
  leads: Lead[] | undefined;
  errorMessage: string | null;
}

const initialState: LeadsState = {
  state: State.idle,
  leads: undefined,
  errorMessage: null,
};

export interface AddLeadPayload {
  leadEmail: string;
  teamName: string;
}

export const fetchLeads = createAsyncThunk<Lead[], void, { rejectValue: string }>(
  "leads/fetchLeads",
  async (_, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
      const response: AxiosResponse<Lead[]> = await APIService.getInstance().get(
        AppConfig.serviceUrls.leads,
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
                ? SnackMessage.error.fetchLeadsMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch leads");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);

export const addLead = createAsyncThunk<void, AddLeadPayload, { rejectValue: string }>(
  "leads/addLeads",
  async (payload: AddLeadPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(AppConfig.serviceUrls.leads, payload);
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.addLeadMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.addLeadMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const updateLead = createAsyncThunk<void, Lead, { rejectValue: string }>(
  "leads/updatelead",
  async (payload: Lead, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().put(
        `${AppConfig.serviceUrls.leads}/${payload.leadId}`,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.updateLeadMessage,
          type: "success",
        }),
      );
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.updateLeadMessage
          : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
      dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      return rejectWithValue(message);
    }
  },
);

export const deleteLead = createAsyncThunk<string, number, { rejectValue: string }>(
  "leads/deleteLead",
  async (leadId: number, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    try {
      const response = await APIService.getInstance().delete(
        `${AppConfig.serviceUrls.leads}/${leadId}`,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: SnackMessage.success.deleteLeadMessage,
          type: "success",
        }),
      );

      return response.data;
    } catch (error) {
      let errorMessage = "Failed to delete repository request";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.deleteLeadMessage
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

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    resetLeadsState(state) {
      state.state = State.idle;
      state.leads = undefined;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.state = State.loading;
        state.functionType = "fetch";
        state.errorMessage = "Fetching leads...";
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.state = State.success;
        state.errorMessage = null;
        state.leads = action.payload;
        state.functionType = undefined;
      })
      .addCase(fetchLeads.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to fetch leads";
      })
      .addCase(addLead.pending, (state) => {
        state.state = State.loading;
        state.functionType = "create";
        state.errorMessage = "Adding lead...";
      })
      .addCase(addLead.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(addLead.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to add lead";
      })
      .addCase(updateLead.pending, (state) => {
        state.state = State.loading;
        state.functionType = "update";
        state.errorMessage = "Updating lead...";
      })
      .addCase(updateLead.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(updateLead.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to update lead";
      })
      .addCase(deleteLead.pending, (state) => {
        state.state = State.loading;
        state.functionType = "delete";
        state.errorMessage = "Deleting lead...";
      })
      .addCase(deleteLead.fulfilled, (state) => {
        state.state = State.success;
        state.functionType = undefined;
        state.errorMessage = null;
      })
      .addCase(deleteLead.rejected, (state) => {
        state.state = State.failed;
        state.functionType = undefined;
        state.errorMessage = "Failed to delete lead";
      });
  },
});

export const { resetLeadsState } = leadsSlice.actions;
export default leadsSlice.reducer;
