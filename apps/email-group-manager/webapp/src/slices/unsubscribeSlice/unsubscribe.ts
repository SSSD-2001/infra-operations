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

import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { State } from "@root/src/types/types";

interface UnsubscribeState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  isSubscribed: boolean;
}

const initialState: UnsubscribeState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  isSubscribed: false,
};

export const unsubscribeGroup = createAsyncThunk(
  "unsubscribe/unsubscribeGroup",
  async (
    { user, groupName }: { user: string; groupName: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const payload = {
        user,
        groupName: groupName.split("@")[0],
      };
      await APIService.getInstance().post(
        AppConfig.serviceUrls.unsubscribe,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: "Successfully unsubscribed",
          type: "success",
        }),
      );
      return true;
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to unsubscribe from notifications",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to unsubscribe");
    }
  },
);

const unsubscribeSlice = createSlice({
  name: "unsubscribe",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(unsubscribeGroup.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Unsubscribing from notifications...";
        state.errorMessage = null;
      })
      .addCase(unsubscribeGroup.fulfilled, (state) => {
        state.state = State.success;
        state.stateMessage = "Successfully unsubscribed from notifications";
        state.isSubscribed = false;
      })
      .addCase(unsubscribeGroup.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = null;
        state.errorMessage =
          (action.payload as string) ||
          "Failed to unsubscribe from notifications";
      });
  },
});

export default unsubscribeSlice.reducer;
