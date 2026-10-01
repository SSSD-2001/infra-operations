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
import { CheckCircle, Search, Visibility } from "@mui/icons-material";
import ApprovalIcon from "@mui/icons-material/Approval";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CancelIcon from "@mui/icons-material/Cancel";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import GavelIcon from "@mui/icons-material/Gavel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { useCallback, useEffect, useState } from "react";

import { ConfirmationType, State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import ErrorHandler from "@component/common/ErrorHandler";
import CommentSection from "@component/common/comment/CommentSection";
import RepoRequestForm from "@component/common/request/RepoRequestForm";
import RepositoryRequestDetails from "@component/common/request/RepositoryRequestDetails";
import { useConfirmationModalContext } from "@context";
import { addComments } from "@slices/commentSlice/comment";
import {
  RepositoryRequest,
  RequestApprovalState,
  approveRepositoryRequest,
  fetchRepositoryRequests,
  rejectRepositoryRequest,
} from "@slices/repositoryRequestSlice/repositoryRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { formatDateTime } from "@utils/utils";
import CustomDataGrid from "@view/admin/github-settings/tables/CustomDataGrid";

interface RequestHistoryTableProps {
  memberEmailProp?: string;
  leadEmailProp?: string;
  adminEmailProp?: string;
}

export default function RequestHistoryTable({
  memberEmailProp,
  leadEmailProp,
  adminEmailProp,
}: RequestHistoryTableProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const repositoryRequest = useAppSelector((state) => state.repositoryRequest);

  const totalRequests = repositoryRequest.repositoryRequests?.totalCount || 0;
  const pendingRequests = repositoryRequest.repositoryRequests?.pendingCount || 0;
  const approvedRequests = repositoryRequest.repositoryRequests?.approvedCount || 0;
  const rejectedRequests = repositoryRequest.repositoryRequests?.rejectedCount || 0;
  const repositoryRequestList = repositoryRequest.repositoryRequests?.repositoryRequests ?? [];

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSearchQuery, setFilteredSearchQuery] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<RepositoryRequest | null>(null);
  const [openRequestViewDialog, setOpenRequestViewDialog] = useState(false);
  const [editRequestData, setEditRequestData] = useState<RepositoryRequest | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [takeDecisionData, setTakeDecisionData] = useState<{ id: number; repoName: string } | null>(
    null,
  );
  const [openTakeDecisionDialog, setOpenTakeDecisionDialog] = useState(false);

  const dialogContext = useConfirmationModalContext();

  const currentUserEmail = memberEmailProp || leadEmailProp || adminEmailProp || "";

  const refetch = useCallback(() => {
    dispatch(
      fetchRepositoryRequests({
        memberEmail: memberEmailProp,
        leadEmail: leadEmailProp,
        limit: pageSize,
        offset: page * pageSize,
        repoName: filteredSearchQuery || undefined,
      }),
    );
  }, [dispatch, filteredSearchQuery, leadEmailProp, memberEmailProp, page, pageSize]);

  useEffect(() => {
    refetch();
  }, [dispatch, page, pageSize, filteredSearchQuery, memberEmailProp, leadEmailProp, refetch]);

  const handleCloseTakeDecisionDialog = () => {
    setOpenTakeDecisionDialog(false);
    setTakeDecisionData(null);
  };

  const handleApproveRequest = (requestId: number) => {
    dialogContext.showConfirmation(
      "Confirm Approval",
      <Typography variant="body1">
        <strong>
          I acknowledge that I have thoroughly reviewed this repository request and confirm that its
          creation complies with WSO2&apos;s engineering and security best practices.
        </strong>
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(approveRepositoryRequest(requestId)).unwrap();
          handleCloseTakeDecisionDialog();
          refetch();
        } catch {
          // Approval failed; keep the dialog open. The thunk surfaces an error snackbar.
        }
      },
      "Approve",
      "Cancel",
    );
  };

  const handleRejectRequest = (requestId: number) => {
    dialogContext.showConfirmation(
      "Reject Request",
      <Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>
            Please note that the repository creation request should be rejected only if the
            requirement is no longer valid and this decision cannot be reversed.
          </strong>
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.customText.primary.p3.active }}>
          Please provide a comment for rejection.
        </Typography>
      </Box>,
      ConfirmationType.accept,
      async (comment?: string) => {
        if (typeof comment === "string" && comment.trim() !== "") {
          try {
            // Save the mandatory rejection comment first; only reject if it succeeds.
            await dispatch(
              addComments({
                requestId: requestId,
                authorEmail: leadEmailProp || adminEmailProp || "",
                commentText: `[REJECTED]-${comment}`,
              }),
            ).unwrap();
            await dispatch(rejectRepositoryRequest(requestId)).unwrap();
            handleCloseTakeDecisionDialog();
            refetch();
          } catch {
            // Comment or rejection failed; do not proceed. The thunk surfaces an error snackbar.
          }
        }
      },
      "Reject",
      "Cancel",
      {
        label: "Rejection Comment",
        mandatory: true,
        type: "textarea",
      },
    );
  };

  const handleViewRequest = (row: RepositoryRequest) => {
    setSelectedRequest(row);
    setOpenRequestViewDialog(true);
  };

  const handleCloseRequestViewDialog = () => {
    setOpenRequestViewDialog(false);
    setSelectedRequest(null);
  };

  const handleEditRequest = (row: RepositoryRequest) => {
    setEditRequestData(row);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditRequestData(null);
  };

  const handleSearch = () => {
    setFilteredSearchQuery(searchQuery);
    setPage(0);
  };

  const isLoading = repositoryRequest.state === State.loading;
  const isFetching = repositoryRequest.functionType === "fetch";
  const isMutating =
    isLoading &&
    ["create", "update", "approve", "reject"].includes(repositoryRequest.functionType || "");

  const statusChip = (label: string, count: number, color: string, icon: React.ReactElement) => (
    <Chip
      icon={icon}
      label={`${label}: ${count}`}
      variant="outlined"
      size="small"
      sx={{
        borderColor: color,
        color,
        borderRadius: 4,
        borderWidth: 1.5,
        background: "transparent",
        fontWeight: 700,
        px: 1.5,
        height: 32,
      }}
    />
  );

  const columns: GridColDef<RepositoryRequest>[] = [
    { field: "id", headerName: "Id", minWidth: 70, flex: 0.6 },
    { field: "repoName", headerName: "Repository Name", minWidth: 180, flex: 2.5 },
    { field: "organizationName", headerName: "GitHub Organization", minWidth: 150, flex: 2 },
    { field: "repoType", headerName: "Visibility", minWidth: 90, flex: 1 },
    { field: "requirement", headerName: "Requirement", minWidth: 200, flex: 3 },
    {
      field: "timestamp",
      headerName: "Created on",
      minWidth: 140,
      flex: 1.5,
      renderCell: (params) => formatDateTime(params.value),
    },
    {
      field: "updatedAt",
      headerName: "Updated on",
      minWidth: 140,
      flex: 1.5,
      renderCell: (params) => formatDateTime(params.value),
    },
    {
      field: "state",
      headerName: "Decision",
      minWidth: 90,
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const state = params.value;
        return (
          <Tooltip
            title={
              state === RequestApprovalState.APPROVED
                ? "Approved"
                : state === RequestApprovalState.REJECTED
                  ? "Rejected"
                  : "Pending"
            }
            arrow
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              {state === RequestApprovalState.APPROVED ? (
                <CheckCircle color="success" />
              ) : state === RequestApprovalState.REJECTED ? (
                <CancelIcon color="error" />
              ) : (
                <ChangeCircleIcon color="warning" />
              )}
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 130,
      flex: 1.2,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Tooltip title="View More" arrow>
            <IconButton color="info" size="small" onClick={() => handleViewRequest(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {memberEmailProp && params.row.state === RequestApprovalState.PENDING && (
            <Tooltip title="Edit Request" arrow>
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleEditRequest(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!memberEmailProp && params.row.state === RequestApprovalState.PENDING && (
            <Tooltip title="Take Decision" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  setTakeDecisionData({ id: params.row.id, repoName: params.row.repoName });
                  setOpenTakeDecisionDialog(true);
                }}
              >
                <GavelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.state === RequestApprovalState.APPROVED && (
            <Tooltip title="Visit Repository" arrow>
              <IconButton
                color="success"
                size="small"
                onClick={() =>
                  window.open(
                    `https://github.com/${params.row.organizationName}/${params.row.repoName}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (repositoryRequest.state === State.failed && !repositoryRequest.repositoryRequests) {
    return <ErrorHandler message="Failed to fetch requests." />;
  }

  const cardBackground =
    theme.palette.mode === "dark"
      ? theme.palette.surface.primary.active
      : theme.palette.neutral["white"];

  const dialogPaperSx = {
    background: cardBackground,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "16px",
  };

  return (
    <Box sx={{ mt: 3 }}>
      <BackgroundLoader
        open={repositoryRequest.submitState === State.loading || isMutating}
        message={repositoryRequest.errorMessage}
      />

      <Box
        sx={{
          background: cardBackground,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {statusChip(
            "Total",
            totalRequests,
            theme.palette.info.main,
            <ListAltIcon color="info" />,
          )}
          {statusChip(
            "Pending",
            pendingRequests,
            theme.palette.warning.main,
            <ChangeCircleIcon color="warning" />,
          )}
          {statusChip(
            "Approved",
            approvedRequests,
            theme.palette.success.main,
            <CheckCircle color="success" />,
          )}
          {statusChip(
            "Rejected",
            rejectedRequests,
            theme.palette.error.main,
            <CancelIcon color="error" />,
          )}
          <TextField
            label="Search by Repository Name"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            autoComplete="off"
            spellCheck={false}
            sx={{ width: 280, ml: "auto", "& .MuiInputBase-root": { pr: 0 } }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} sx={{ borderRadius: 0 }}>
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ width: "100%", height: 560 }}>
          <CustomDataGrid
            columns={columns}
            rows={isLoading ? [] : repositoryRequestList}
            rowCount={totalRequests}
            paginationMode="server"
            getRowId={(row) => row.id}
            rowHeight={47}
            paginationModel={{ pageSize, page }}
            onPaginationModelChange={(model) => {
              setPageSize(model.pageSize);
              setPage(model.page);
            }}
            loading={isLoading && isFetching}
          />
        </Box>
      </Box>

      {/* View dialog */}
      <Dialog
        open={openRequestViewDialog}
        onClose={handleCloseRequestViewDialog}
        maxWidth={false}
        slotProps={{
          paper: {
            sx: {
              ...dialogPaperSx,
              width: { xs: "95%", md: "90vw" },
              height: { xs: "90%", md: "80vh" },
              m: "auto",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {selectedRequest && (
              <>
                <Chip
                  icon={
                    <ApprovalIcon
                      color={
                        selectedRequest.state === RequestApprovalState.APPROVED
                          ? "success"
                          : selectedRequest.state === RequestApprovalState.REJECTED
                            ? "error"
                            : "warning"
                      }
                    />
                  }
                  label={selectedRequest.state}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor:
                      selectedRequest.state === RequestApprovalState.APPROVED
                        ? theme.palette.success.main
                        : selectedRequest.state === RequestApprovalState.REJECTED
                          ? theme.palette.error.main
                          : theme.palette.warning.main,
                    color:
                      selectedRequest.state === RequestApprovalState.APPROVED
                        ? theme.palette.success.main
                        : selectedRequest.state === RequestApprovalState.REJECTED
                          ? theme.palette.error.main
                          : theme.palette.warning.main,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    fontWeight: 700,
                    height: 32,
                  }}
                />
                <Chip
                  icon={<CalendarMonthIcon color="info" />}
                  label={`Created: ${formatDateTime(selectedRequest.timestamp)}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    fontWeight: 700,
                    height: 32,
                  }}
                />
                <Chip
                  icon={<CalendarMonthIcon color="info" />}
                  label={`Updated: ${formatDateTime(selectedRequest.updatedAt)}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    fontWeight: 700,
                    height: 32,
                  }}
                />
              </>
            )}
          </Box>
          <IconButton onClick={handleCloseRequestViewDialog} color="primary" aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1.5 }}>
          <Grid container spacing={1.5} sx={{ height: "100%" }}>
            <Grid size={{ xs: 12, md: 7.5 }} sx={{ height: "100%" }}>
              <Box
                sx={{
                  height: { xs: "auto", md: "100%" },
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "16px",
                  background: cardBackground,
                  display: "flex",
                  flexDirection: "column",
                  p: 1,
                }}
              >
                <RepositoryRequestDetails request={selectedRequest} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4.5 }} sx={{ height: "100%" }}>
              <Box
                sx={{
                  height: { xs: 400, md: "100%" },
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "16px",
                  background: cardBackground,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {selectedRequest && (
                  <CommentSection
                    requestId={selectedRequest.id}
                    currentUserEmail={currentUserEmail}
                    requestState={selectedRequest.state}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 600,
          }}
        >
          Edit Repository Request
          <IconButton aria-label="close" onClick={handleCloseEditDialog} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overflowY: "auto", maxHeight: { xs: "85vh", md: "80vh" } }}>
          {editRequestData && (
            <Box sx={{ pt: 1 }}>
              <RepoRequestForm
                mode="edit"
                initialValues={editRequestData}
                onUpdateSuccess={() => {
                  handleCloseEditDialog();
                  refetch();
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Take decision dialog */}
      <Dialog
        open={openTakeDecisionDialog}
        onClose={handleCloseTakeDecisionDialog}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          Take Decision
          <IconButton aria-label="close" onClick={handleCloseTakeDecisionDialog} color="primary">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", gap: 2, py: 3 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => takeDecisionData && handleApproveRequest(takeDecisionData.id)}
            sx={{ minWidth: 120 }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => takeDecisionData && handleRejectRequest(takeDecisionData.id)}
            sx={{ minWidth: 120 }}
          >
            Reject
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
