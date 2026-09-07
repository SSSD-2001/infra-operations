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
import { Search } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { useEffect, useMemo, useState } from "react";

import { State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import {
  AccessPermission,
  AccessRequest,
  AccessRequestState,
  fetchAccessRequests,
} from "@slices/accessRequestSlice/accessRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { formatDateTime } from "@utils/utils";
import CustomDataGrid from "@view/admin/github-settings/tables/CustomDataGrid";

const PERMISSION_LABELS: Record<AccessPermission, string> = {
  pull: "Read",
  triage: "Triage",
  push: "Write",
};

type PermissionFilter = "all" | AccessPermission;

export default function AccessRequestList() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { state, accessRequests, errorMessage } = useAppSelector((s) => s.accessRequest);

  const [searchQuery, setSearchQuery] = useState("");
  const [permissionFilter, setPermissionFilter] = useState<PermissionFilter>("all");

  useEffect(() => {
    void dispatch(fetchAccessRequests());
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accessRequests.filter((row) => {
      const matchesPermission = permissionFilter === "all" || row.permission === permissionFilter;
      const matchesSearch =
        !q ||
        row.repoName.toLowerCase().includes(q) ||
        row.orgName.toLowerCase().includes(q);
      return matchesPermission && matchesSearch;
    });
  }, [accessRequests, permissionFilter, searchQuery]);

  const columns: GridColDef<AccessRequest>[] = [
    { field: "repoName", headerName: "Repository", minWidth: 160, flex: 1.5 },
    { field: "orgName", headerName: "Organization", minWidth: 140, flex: 1.2 },
    {
      field: "permission",
      headerName: "Access",
      minWidth: 100,
      flex: 0.7,
      renderCell: (params) => PERMISSION_LABELS[params.value as AccessPermission] ?? params.value,
    },
    {
      field: "state",
      headerName: "Status",
      minWidth: 110,
      flex: 0.8,
      renderCell: (params) => {
        const value = params.value as AccessRequestState;
        const color =
          value === AccessRequestState.APPROVED
            ? theme.palette.success.main
            : value === AccessRequestState.REJECTED
              ? theme.palette.error.main
              : theme.palette.warning.main;
        return (
          <Chip
            label={value}
            size="small"
            variant="outlined"
            sx={{ borderColor: color, color, fontWeight: 600 }}
          />
        );
      },
    },
    { field: "leadEmail", headerName: "Lead", minWidth: 180, flex: 1.4 },
    {
      field: "timestamp",
      headerName: "Requested on",
      minWidth: 150,
      flex: 1,
      renderCell: (params) => formatDateTime(params.value),
    },
  ];

  const filterChip = (value: PermissionFilter, label: string) => (
    <Chip
      label={label}
      size="small"
      variant={permissionFilter === value ? "filled" : "outlined"}
      color={permissionFilter === value ? "primary" : "default"}
      onClick={() => setPermissionFilter(value)}
    />
  );

  return (
    <Box>
      {state === State.loading && (
        <BackgroundLoader open message="Loading access requests..." />
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 2 }}>
        {filterChip("all", "All")}
        {filterChip("pull", "Read")}
        {filterChip("triage", "Triage")}
        {filterChip("push", "Write")}
        <TextField
          size="small"
          placeholder="Search repo or org"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          sx={{ width: 280, ml: "auto" }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <Search />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      {state === State.failed ? (
        <Typography color="error">{errorMessage || "Failed to load access requests."}</Typography>
      ) : (
        <Box sx={{ width: "100%", height: 420 }}>
          <CustomDataGrid
            columns={columns}
            rows={filteredRows}
            getRowId={(row) => row.id}
            rowHeight={47}
          />
        </Box>
      )}
    </Box>
  );
}