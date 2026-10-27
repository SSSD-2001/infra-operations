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

import { APIService } from "@root/src/utils/apiService";
import { AppConfig } from "@root/src/config/config";
import { State } from "@root/src/types/types";
import { enqueueSnackbarMessage } from "../commonSlice/common";

interface SubscribeState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  isSubscribed: boolean;
}

const initialState: SubscribeState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  isSubscribed: false,
};

export const subscribeGroup = createAsyncThunk(
  "subscribe/subscribeGroup",
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
        AppConfig.serviceUrls.subscribe,
        payload,
      );
      dispatch(
        enqueueSnackbarMessage({
          message: "Successfully subscribed",
          type: "success",
        }),
      );
      return true;
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to subscribe to notifications",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to subscribe to notifications");
    }
  },
);

const subscribeSlice = createSlice({
  name: "subscribe",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(subscribeGroup.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Subscribing to notifications...";
        state.errorMessage = null;
      })
      .addCase(subscribeGroup.rejected, (state) => {
        state.state = State.failed;
        state.errorMessage = "Failed to subscribe to notifications";
      })
      .addCase(subscribeGroup.fulfilled, (state) => {
        state.state = State.success;
        state.isSubscribed = true;
      });
  },
});

export default subscribeSlice.reducer;
