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

import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Checkbox,
  Paper,
  Stack,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTheme } from "@mui/material/styles";
import SearchBar from "../component/SearchBar";
import SubscribeButton from "../component/SubscribeButton";
import ErrorHandler from "@component/common/ErrorHandler";
import { useMemo, useState } from "react";
import { State } from "@root/src/types/types";
import NotFound from "./NotFound";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { subscribeGroup } from "@slices/subscribeSlice/subscribe";
import { unsubscribeGroup } from "@slices/unsubscribeSlice/unsubscribe";
import {
  addNewGroup,
  removeExistingGroup,
} from "@root/src/slices/userGroupsSlice/userGroups";

type Props = {
  title: string;
  groups: string[];
  state: State;
  errorMessage: string | null;
  showSubscribe?: boolean;
  userGroups?: string[];
};

function GroupsList({
  title,
  groups,
  state,
  errorMessage,
  showSubscribe = false,
  userGroups = [],
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [bulkSubscribeLoading, setBulkSubscribeLoading] = useState(false);
  const [bulkUnsubscribeLoading, setBulkUnsubscribeLoading] = useState(false);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector((state) => state.auth.userInfo?.email);

  const filteredGroups = groups.filter((group) =>
    group.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns = useMemo(() => {
    const leftColumn: string[] = [];
    const rightColumn: string[] = [];

    filteredGroups.forEach((group, index) => {
      if (index % 2 === 0) {
        leftColumn.push(group);
      } else {
        rightColumn.push(group);
      }
    });

    return [leftColumn, rightColumn];
  }, [filteredGroups]);

  const selectedSubscribedGroups = selectedGroups.filter((group) =>
    userGroups.includes(group),
  );
  const selectedUnsubscribedGroups = selectedGroups.filter(
    (group) => !userGroups.includes(group),
  );

  const toggleGroupSelection = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((item) => item !== group)
        : [...prev, group],
    );
  };

  const clearSelection = () => {
    setSelectedGroups([]);
  };

  const handleBulkSubscribe = async () => {
    if (!userEmail || selectedUnsubscribedGroups.length === 0) {
      return;
    }

    try {
      setBulkSubscribeLoading(true);
      for (const group of selectedUnsubscribedGroups) {
        try {
          await dispatch(
            subscribeGroup({ user: userEmail, groupName: group }),
          ).unwrap();
          dispatch(addNewGroup(group));
        } catch (error) {
          console.error(`Failed to subscribe to ${group}:`, error);
        }
      }
    } finally {
      setBulkSubscribeLoading(false);
    }
  };

  const handleBulkUnsubscribe = async () => {
    if (!userEmail || selectedSubscribedGroups.length === 0) {
      return;
    }

    try {
      setBulkUnsubscribeLoading(true);
      for (const group of selectedSubscribedGroups) {
        try {
          await dispatch(
            unsubscribeGroup({ user: userEmail, groupName: group }),
          ).unwrap();
          dispatch(removeExistingGroup(group));
        } catch (error) {
          console.error(`Failed to unsubscribe from ${group}:`, error);
        }
      }
    } finally {
      setBulkUnsubscribeLoading(false);
    }
  };

  if (state === State.loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (state === State.failed) return <ErrorHandler message={errorMessage} />;

  return (
    <Container maxWidth={false} sx={{ px: { xs: 0, sm: 2 }, pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", lg: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1, maxWidth: { xs: "100%", lg: 520 } }}>
              <SearchBar
                placeholder={`Search ${title}...`}
                onQueryChange={setSearchTerm}
              />
            </Box>

            {showSubscribe && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ width: { xs: "100%", lg: "auto" } }}
                justifyContent="flex-end"
              >
                <LoadingButton
                  variant="outlined"
                  size="small"
                  onClick={clearSelection}
                  disabled={selectedGroups.length === 0}
                  disableElevation
                  sx={{ minWidth: 152, borderRadius: 999 }}
                >
                  Clear selections ({selectedGroups.length})
                </LoadingButton>

                <LoadingButton
                  variant="contained"
                  size="small"
                  onClick={handleBulkSubscribe}
                  loading={bulkSubscribeLoading}
                  disabled={selectedUnsubscribedGroups.length === 0}
                  disableElevation
                  sx={{ minWidth: 132, borderRadius: 999 }}
                >
                  Subscribe ({selectedUnsubscribedGroups.length})
                </LoadingButton>

                <LoadingButton
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleBulkUnsubscribe}
                  loading={bulkUnsubscribeLoading}
                  disabled={selectedSubscribedGroups.length === 0}
                  disableElevation
                  sx={{ minWidth: 140, borderRadius: 999 }}
                >
                  Unsubscribe ({selectedSubscribedGroups.length})
                </LoadingButton>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 0, md: 0 } }}>
          {filteredGroups.length === 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "50vh",
              }}
            >
              <NotFound message={`No ${title} found`} />
            </Box>
          )}

          {filteredGroups.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
              }}
            >
              {columns.map((column, columnIndex) => (
                <Box
                  key={columnIndex}
                  sx={{
                    borderRight:
                      columnIndex === 0
                        ? {
                            xs: "none",
                            md: `1px solid ${theme.palette.divider}`,
                          }
                        : "none",
                  }}
                >
                  {column.map((group, rowIndex) => {
                    const subscribed = userGroups.includes(group);

                    return (
                      <Box
                        key={group}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: showSubscribe
                            ? "auto minmax(0, 1fr) auto"
                            : "minmax(0, 1fr) auto",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 0.6,
                          minHeight: 40,
                          borderBottom:
                            rowIndex === column.length - 1
                              ? "none"
                              : `1px solid ${theme.palette.divider}`,
                          transition: "background-color 0.15s ease",
                          "&:hover": {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        {showSubscribe && (
                          <Checkbox
                            checked={selectedGroups.includes(group)}
                            onChange={() => toggleGroupSelection(group)}
                            size="small"
                            sx={{ p: 0.15 }}
                          />
                        )}

                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {group}
                        </Typography>

                        {showSubscribe && (
                          <SubscribeButton
                            groupEmail={group}
                            isSubscribed={subscribed}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default GroupsList;
