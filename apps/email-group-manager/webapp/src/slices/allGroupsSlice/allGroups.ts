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

interface AllGroupsState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  groups: string[];
}

const initialState: AllGroupsState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  groups: [],
};

export const getAllGroups = createAsyncThunk(
  "allGroups/getAllGroups",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.allGroups,
      );
      return response.data as string[];
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to fetch all groups",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to fetch all groups");
    }
  },
);

const allGroupsSlice = createSlice({
  name: "allGroups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllGroups.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Loading groups...";
        state.errorMessage = null;
      })
      .addCase(getAllGroups.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = null;
        state.errorMessage = "Failed to fetch all groups";
      })
      .addCase(getAllGroups.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = null;
        state.errorMessage = null;
        state.groups = action.payload;
      });
  },
});

export default allGroupsSlice.reducer;
