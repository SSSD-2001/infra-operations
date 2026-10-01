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
import { Box, Skeleton, useTheme } from "@mui/material";

export function SkeletonRows({
  gridTemplateColumns,
  headers,
}: {
  gridTemplateColumns: string;
  headers: string[];
}) {
  const theme = useTheme();
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "grid",
            gridTemplateColumns: gridTemplateColumns,
            alignItems: "center",
            px: 1.75,
            py: 1.1,
            borderBottom: i < 4 ? `1px solid ${theme.palette.divider}` : "none",
          }}
        >
          {headers.map((header, index) =>
            header === "Actions" ? (
              <Box key={index} sx={{ display: "flex", gap: 0.375, justifyContent: "center" }}>
                <Skeleton variant="rounded" width={26} height={26} sx={{ borderRadius: "6px" }} />
                <Skeleton variant="rounded" width={26} height={26} sx={{ borderRadius: "6px" }} />
              </Box>
            ) : (
              <Skeleton key={index} variant="rounded" width={"80%"} height={12} />
            ),
          )}
        </Box>
      ))}
    </>
  );
}
