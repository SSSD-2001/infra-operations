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

export interface RepoTeamLead {
    id: number;
    organizationId: number;
    organizationName: string;
    teamName: string;
    teamSlug: string;
    leadEmail: string | null;
}

export interface SyncRepoTeamLeadsResult {
    addedCount: number;
    deletedCount: number;
}

export interface UpdateRepoTeamLeadPayload {
    id: number;
    leadEmail: string;
}

interface RepoTeamLeadsState {
    state: State;
    functionType?: string;
    repoTeamLeads: RepoTeamLead[] | undefined;
    errorMessage: string | null;
}

const initialState: RepoTeamLeadsState = {
    state: State.idle,
    repoTeamLeads: undefined,
    errorMessage: null,
};

export const fetchRepoTeamLeads = createAsyncThunk<
    RepoTeamLead[],
    void,
    { rejectValue: string }
    >("repoTeamLeads/fetchRepoTeamLeads", async (_, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    try {
        const response: AxiosResponse<RepoTeamLead[]> = await APIService.getInstance().get(
        AppConfig.serviceUrls.repoTeamLeads,
        { cancelToken: newCancelTokenSource.token },
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
                ? SnackMessage.error.fetchRepoTeamLeadsFailedMessage
                : String(error.response?.data?.message || "Unknown error"),
            type: "error",
            }),
        );
        return rejectWithValue(error.response?.data || "Failed to fetch repo team leads");
        }
        return rejectWithValue("An unexpected error occurred");
    }
    });

export const syncRepoTeamLeads = createAsyncThunk<
    SyncRepoTeamLeadsResult,
    void,
    { rejectValue: string }
    >("repoTeamLeads/syncRepoTeamLeads", async (_, { dispatch, rejectWithValue }) => {
    try {
        const response = await APIService.getInstance().post(AppConfig.serviceUrls.syncRepoTeamLeads);
        const addedCount: number = response.data.addedCount ?? 0;
        const deletedCount: number = response.data.deletedCount ?? 0;
        const updatedCount: number = response.data.updatedCount ?? 0;
        const parts: string[] = [];
        if (addedCount > 0) {
            parts.push(`${addedCount} new team${addedCount === 1 ? "" : "s"} added`);
        }
        if (deletedCount > 0) {
            parts.push(`${deletedCount} team${deletedCount === 1 ? "" : "s"} deleted`);
        }
        if (updatedCount > 0) {
            parts.push(`${updatedCount} lead${updatedCount === 1 ? "" : "s"} filled`);
        }
        dispatch(
        enqueueSnackbarMessage({
            message: parts.length > 0 ? parts.join(", ") : "Team leads are up to date",
            type: "success",
        }),
        );
        return response.data;
    }   catch (error) {
            const message = axios.isAxiosError(error)
            ? error.response?.status === HttpStatusCode.InternalServerError
                ? SnackMessage.error.syncRepoTeamLeadsFailedMessage
                : String(error.response?.data?.message || error.message || "Unknown error")
            : "An unexpected error occurred";
            dispatch(enqueueSnackbarMessage({ message, type: "error" }));
        return rejectWithValue(message);
    }
});

export const updateRepoTeamLead = createAsyncThunk<
    void,
    UpdateRepoTeamLeadPayload,
    { rejectValue: string }
    >("repoTeamLeads/updateRepoTeamLead", async (payload, { dispatch, rejectWithValue }) => {
    try {
        await APIService.getInstance().put(`${AppConfig.serviceUrls.repoTeamLeads}/${payload.id}`, {
        leadEmail: payload.leadEmail,
        });
        dispatch(
        enqueueSnackbarMessage({
            message: SnackMessage.success.updateRepoTeamLeadMessage,
            type: "success",
        }),
        );
    } catch (error) {
        const message = axios.isAxiosError(error)
        ? error.response?.status === HttpStatusCode.InternalServerError
            ? SnackMessage.error.updateRepoTeamLeadFailedMessage
            : String(error.response?.data?.message || error.message || "Unknown error")
        : "An unexpected error occurred";
        dispatch(enqueueSnackbarMessage({ message, type: "error" }));
        return rejectWithValue(message);
    }
});

const repoTeamLeadsSlice = createSlice({
    name: "repoTeamLeads",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchRepoTeamLeads.pending, (state) => {
            state.state = State.loading;
            state.functionType = "fetch";
            state.errorMessage = "Fetching repo team leads...";
        })
        .addCase(fetchRepoTeamLeads.fulfilled, (state, action) => {
            state.state = State.success;
            state.errorMessage = null;
            state.repoTeamLeads = action.payload;
            state.functionType = undefined;
        })
        .addCase(fetchRepoTeamLeads.rejected, (state) => {
            state.state = State.failed;
            state.functionType = undefined;
            state.errorMessage = "Failed to fetch repo team leads";
        })
        .addCase(syncRepoTeamLeads.pending, (state) => {
            state.state = State.loading;
            state.functionType = "sync";
            state.errorMessage = "Syncing repo team leads...";
        })
        .addCase(syncRepoTeamLeads.fulfilled, (state) => {
            state.state = State.success;
            state.functionType = undefined;
            state.errorMessage = null;
        })
        .addCase(syncRepoTeamLeads.rejected, (state) => {
            state.state = State.failed;
            state.functionType = undefined;
            state.errorMessage = "Failed to sync repo team leads";
        })
        .addCase(updateRepoTeamLead.pending, (state) => {
            state.state = State.loading;
            state.functionType = "update";
            state.errorMessage = "Updating team lead...";
        })
        .addCase(updateRepoTeamLead.fulfilled, (state) => {
            state.state = State.success;
            state.functionType = undefined;
            state.errorMessage = null;
        })
        .addCase(updateRepoTeamLead.rejected, (state) => {
            state.state = State.failed;
            state.functionType = undefined;
            state.errorMessage = "Failed to update team lead";
        });
    },
});

export default repoTeamLeadsSlice.reducer;