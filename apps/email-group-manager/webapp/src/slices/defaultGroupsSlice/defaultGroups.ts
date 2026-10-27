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

interface DefaultGroupsState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  groups: string[];
}

const initialState: DefaultGroupsState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  groups: [],
};

export const getDefaultGroups = createAsyncThunk(
  "defaultGroups/getDefaultGroups",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.defaultGroups,
      );
      return response.data as string[];
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to fetch default groups",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to fetch default groups");
    }
  },
);

const defaultGroupsSlice = createSlice({
  name: "defaultGroups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDefaultGroups.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching default groups...";
      })
      .addCase(getDefaultGroups.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Default groups fetched successfully";
        state.groups = action.payload;
      })
      .addCase(getDefaultGroups.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
      });
  },
});

export default defaultGroupsSlice.reducer;
