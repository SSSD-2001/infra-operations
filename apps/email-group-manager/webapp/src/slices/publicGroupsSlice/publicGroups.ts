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

interface PublicGroupsState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  groups: string[];
}

const initialState: PublicGroupsState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  groups: [],
};

export const getPublicGroups = createAsyncThunk(
  "publicGroups/getPublicGroups",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.publicGroups,
      );
      return response.data as string[];
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to fetch public groups",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to fetch public groups");
    }
  },
);

const publicGroupsSlice = createSlice({
  name: "publicGroups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPublicGroups.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching public groups...";
      })
      .addCase(getPublicGroups.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Public groups fetched successfully";
        state.groups = action.payload;
      })
      .addCase(getPublicGroups.rejected, (state, action) => {
        state.state = State.failed;
        state.errorMessage = action.payload as string;
      });
  },
});

export default publicGroupsSlice.reducer;
