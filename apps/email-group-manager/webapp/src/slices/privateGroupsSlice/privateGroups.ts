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

import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import { State } from "@root/src/types/types";
import { enqueueSnackbarMessage } from "../commonSlice/common";

interface PrivateGroupsState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  groups: string[];
}

const initialState: PrivateGroupsState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  groups: [],
};

export const getPrivateGroups = createAsyncThunk(
  "privateGroups/getPrivateGroups",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.privateGroups,
      );
      return response.data as string[];
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to fetch private groups",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to fetch private groups");
    }
  },
);

const privateGroupsSlice = createSlice({
  name: "privateGroups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPrivateGroups.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Loading private groups...";
        state.errorMessage = null;
      })
      .addCase(getPrivateGroups.fulfilled, (state, action) => {
        state.state = State.success;
        state.groups = action.payload;
        state.stateMessage = "Private groups loaded successfully";
      })
      .addCase(getPrivateGroups.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      });
  },
});

export default privateGroupsSlice.reducer;
