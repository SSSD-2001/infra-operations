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
import { alpha, useTheme } from "@mui/material";
import { DataGrid, DataGridProps, GridValidRowModel } from "@mui/x-data-grid";

export default function CustomDataGrid<R extends GridValidRowModel>(props: DataGridProps<R>) {
  const theme = useTheme();

  return (
    <DataGrid
      {...props}
      density="compact"
      disableRowSelectionOnClick
      initialState={{
        pagination: {
          paginationModel: { pageSize: 10 },
        },
        ...props.initialState,
      }}
      pageSizeOptions={[10, 20, 50]}
      sx={{
        border: "none",
        borderRadius: 0,
        background:
          theme.palette.mode === "dark"
            ? theme.palette.neutral["1800"]
            : theme.palette.common.white,
        "& .MuiDataGrid-columnHeaders": {
          background: "transparent !important",
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-columnHeader": {
          background:
            theme.palette.mode === "dark"
              ? theme.palette.neutral["1800"]
              : theme.palette.common.white,
        },
        "& .MuiDataGrid-columnHeaderTitle": {
          fontSize: 11,
          textTransform: "Capitalize",
          letterSpacing: "0.05em",
          color: theme.palette.customText.primary.p2.active,
        },
        "& .MuiDataGrid-cell": {
          border: "none",
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-row": {
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-filler": {
          display: "none",
        },
        "& ::-webkit-scrollbar": {
          width: "6px",
          height: "6px",
        },
        "& ::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "& ::-webkit-scrollbar-thumb": {
          background: alpha(theme.palette.divider, 0.5),
          borderRadius: "3px",
        },
        "& ::-webkit-scrollbar-thumb:hover": {
          background: alpha(theme.palette.divider, 0.7),
        },
        ...props.sx,
      }}
    />
  );
}
