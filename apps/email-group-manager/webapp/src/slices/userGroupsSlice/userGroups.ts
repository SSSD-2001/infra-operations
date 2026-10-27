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
import { enqueueSnackbarMessage } from "../commonSlice/common";
import { AppConfig } from "@root/src/config/config";
import { State } from "@root/src/types/types";

interface UserGroupsState {
  state: State;
  stateMessage: string | null;
  errorMessage: string | null;
  groups: string[];
}

const initialState: UserGroupsState = {
  state: State.idle,
  stateMessage: null,
  errorMessage: null,
  groups: [],
};

export const getUserGroups = createAsyncThunk(
  "userGroups/getUserGroups",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.userGroups,
      );
      return response.data as string[];
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to fetch user groups",
          type: "error",
        }),
      );
      return rejectWithValue("Failed to fetch user groups");
    }
  },
);

const userGroupsSlice = createSlice({
  name: "userGroups",
  initialState,
  reducers: {
    addNewGroup: (state, action) => {
      state.groups.push(action.payload);
    },
    removeExistingGroup: (state, action) => {
      state.groups = state.groups.filter((group) => group !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserGroups.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching user groups...";
        state.errorMessage = null;
      })
      .addCase(getUserGroups.rejected, (state) => {
        state.state = State.failed;
        state.errorMessage = "Failed to fetch user groups";
      })
      .addCase(getUserGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
        state.state = State.success;
        state.stateMessage = "User groups fetched successfully";
        state.errorMessage = null;
      });
  },
});

export const { addNewGroup, removeExistingGroup } = userGroupsSlice.actions;
export default userGroupsSlice.reducer;
