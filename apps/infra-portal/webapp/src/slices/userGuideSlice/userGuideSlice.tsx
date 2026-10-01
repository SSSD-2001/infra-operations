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
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios, { HttpStatusCode } from "axios";

import { SnackMessage } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

export const fetchMarkdown = createAsyncThunk<string, string, { rejectValue: string }>(
  "docs/fetchMarkdown",
  async (url: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              response.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.fetchUserGuideMessage
                : `Failed to fetch markdown: ${response.statusText}`,
            type: "error",
          }),
        );
        return rejectWithValue(`Failed to fetch markdown: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("Request canceled");
      }
      if (axios.isAxiosError(error)) {
        dispatch(
          enqueueSnackbarMessage({
            message:
              error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.fetchUserGuideMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
          }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch markdown");
      }
      return rejectWithValue("An unexpected error occurred");
    }
  },
);
