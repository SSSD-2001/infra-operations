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
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Tooltip,
    Typography,
    alpha,
  } from "@mui/material";
  import { useTheme } from "@mui/material/styles";
  import { GridColDef } from "@mui/x-data-grid";
  import { Field, Form, Formik } from "formik";
  import { Pencil, RefreshCw, User } from "lucide-react";
  import * as Yup from "yup";
  
  import { useEffect, useState } from "react";
  
  import { ConfirmationType, State } from "@/types/types";
  import BackgroundLoader from "@component/common/BackgroundLoader";
  import ErrorHandler from "@component/common/ErrorHandler";
  import { useConfirmationModalContext } from "@root/src/context";
  import {
    RepoTeamLead,
    fetchRepoTeamLeads,
    syncRepoTeamLeads,
    updateRepoTeamLead,
  } from "@root/src/slices/repoTeamLeadsSlice/repoTeamLeads";
  import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
  
  import { CardHeader } from "../CardHeader";
  import CustomDataGrid from "../CustomDataGrid";
  
  const LeadSchema = Yup.object().shape({
    leadEmail: Yup.string().email("Invalid email").required("Required"),
  });
  
  export default function RepoTeamLeadsTable({ gridArea }: { gridArea?: string }) {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const repoTeamLeadsState = useAppSelector((state) => state.repoTeamLeads);
    const dialogContext = useConfirmationModalContext();
    const [editTarget, setEditTarget] = useState<RepoTeamLead | undefined>();
  
    const rows = repoTeamLeadsState.repoTeamLeads ?? [];
  
    useEffect(() => {
      dispatch(fetchRepoTeamLeads());
    }, [dispatch]);
  
    const handleSync = async () => {
      try {
        await dispatch(syncRepoTeamLeads()).unwrap();
        dispatch(fetchRepoTeamLeads());
      } catch {
      }
    };
  
    const handleEdit = (leadEmail: string) => {
      if (!editTarget) {
        return;
      }
      dialogContext.showConfirmation(
        "Edit Team Lead",
        <Typography variant="body2">
          Save lead for <strong>{editTarget.teamName}</strong>?
        </Typography>,
        ConfirmationType.accept,
        async () => {
          const id = editTarget.id;
          setEditTarget(undefined);
          await dispatch(updateRepoTeamLead({ id, leadEmail }));
          dispatch(fetchRepoTeamLeads());
        },
        "Save",
        "Cancel",
      );
    };
  
    const columns: GridColDef[] = [
      {
        field: "id",
        headerName: "ID",
        width: 60,
        renderCell: (params) => (
          <Typography
            sx={{
              fontSize: 10,
              fontFamily: "monospace",
              color: theme.palette.customText.primary.p3.active,
            }}
          >
            #{params.value}
          </Typography>
        ),
      },
      {
        field: "organizationName",
        headerName: "Organization",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              fontSize: 12,
              fontFamily: "monospace",
              color: theme.palette.customText.primary.p1.active,
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: "teamName",
        headerName: "Team",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              fontSize: 12,
              fontFamily: "monospace",
              color: theme.palette.customText.primary.p1.active,
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: "leadEmail",
        headerName: "Lead",
        flex: 1,
        renderCell: (params) => (
          <Typography
            sx={{
              fontSize: 12,
              fontFamily: "monospace",
              color: theme.palette.customText.primary.p1.active,
            }}
          >
            {params.value ?? "—"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 80,
        sortable: false,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              gap: 0.375,
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Tooltip title="Edit" arrow>
              <IconButton
                size="small"
                onClick={() => setEditTarget(params.row)}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                  color: theme.palette.customText.primary.p3.active,
                  "&:hover": {
                    color: theme.palette.warning.main,
                    background: alpha(theme.palette.warning.main, 0.1),
                  },
                }}
              >
                <Pencil size={13} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ];
  
    const isLoading = repoTeamLeadsState.state === State.loading;
    const isFetching = repoTeamLeadsState.functionType === "fetch";
    const isMutating = isLoading && !isFetching && !!repoTeamLeadsState.repoTeamLeads;
  
    if (repoTeamLeadsState.state === State.failed && !repoTeamLeadsState.repoTeamLeads?.length) {
      return <ErrorHandler message="Failed to fetch repo team leads." />;
    }
  
    return (
      <Box sx={{ gridArea, minWidth: 0, overflow: "hidden" }}>
        <BackgroundLoader open={isMutating} message={repoTeamLeadsState.errorMessage} />
        <Box
          sx={{
            background:
              theme.palette.mode === "dark"
                ? theme.palette.surface.primary.active
                : theme.palette.neutral["white"],
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 1px 3px rgba(0,0,0,0.3)"
                : "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <CardHeader
            icon={<User size={15} />}
            itemCount={rows.length}
            iconColor={theme.palette.info.main}
            title={"Repo Team Leads"}
            itemType={"team"}
            action={
              <Tooltip title="Sync from GitHub" arrow>
                <IconButton
                  disabled={repoTeamLeadsState.functionType === "sync"}
                  onClick={() => handleSync()}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "7px",
                    background: theme.palette.warning.main,
                    color: "#fff",
                    "&:hover": { background: theme.palette.warning.dark },
                  }}
                >
                  <RefreshCw size={14} />
                </IconButton>
              </Tooltip>
            }
          />
  
          <Box sx={{ width: "100%", height: 400 }}>
            <CustomDataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              loading={isFetching}
            />
          </Box>
        </Box>
  
        <Dialog
          open={!!editTarget}
          onClose={() => setEditTarget(undefined)}
          PaperProps={{
            sx: {
              borderRadius: "16px",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "0 4px 20px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>Edit Team Lead</DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <Formik
              enableReinitialize
              initialValues={{
                leadEmail: editTarget?.leadEmail ?? "",
              }}
              validationSchema={LeadSchema}
              onSubmit={(values) => handleEdit(values.leadEmail)}
            >
              {({ errors, touched }) => (
                <Form>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5, minWidth: 360 }}
                  >
                    <Field
                      as={TextField}
                      name="leadEmail"
                      label="Lead Email"
                      size="small"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "7px" },
                      }}
                      error={touched.leadEmail && !!errors.leadEmail}
                      helperText={touched.leadEmail && errors.leadEmail}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                      <IconButton
                        onClick={() => setEditTarget(undefined)}
                        sx={{
                          borderRadius: "8px",
                          px: 1.5,
                          fontSize: 13,
                          color: theme.palette.customText.primary.p3.active,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        Cancel
                      </IconButton>
                      <IconButton
                        type="submit"
                        sx={{
                          borderRadius: "8px",
                          px: 1.5,
                          fontSize: 13,
                          background: theme.palette.warning.main,
                          color: "#fff",
                          "&:hover": { background: theme.palette.warning.dark },
                        }}
                      >
                        Save
                      </IconButton>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }