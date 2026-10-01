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
  Popover,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GridColDef } from "@mui/x-data-grid";
import { Field, Form, Formik } from "formik";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import * as Yup from "yup";

import { useEffect, useState } from "react";

import { ConfirmationType, State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import ErrorHandler from "@component/common/ErrorHandler";
import { useConfirmationModalContext } from "@root/src/context";
import {
  AddLeadPayload,
  Lead,
  addLead,
  deleteLead,
  fetchLeads,
  updateLead,
} from "@root/src/slices/leadsSlice/leads";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";

import { CardHeader } from "../CardHeader";
import CustomDataGrid from "../CustomDataGrid";

const LeadSchema = Yup.object().shape({
  leadEmail: Yup.string()
    .email("Invalid email")
    .matches(/^[A-Za-z0-9._%+-]+@wso2\.com$/, "Email must be a wso2.com address")
    .required("Required"),
  teamName: Yup.string().required("Required"),
});

export default function FunctionalLeads({ gridArea }: { gridArea?: string }) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const leadsState = useAppSelector((state) => state.leads);
  const dialogContext = useConfirmationModalContext();
  const [editTarget, setEditTarget] = useState<Lead | undefined>();
  const [addAnchorEl, setAddAnchorEl] = useState<HTMLElement | null>(null);

  const leads = leadsState.leads ?? [];

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const handleDeleteLead = (leadId: number, leadEmail: string) => {
    dialogContext.showConfirmation(
      "Delete Lead",
      <Typography variant="body1">
        Are you sure you want to delete the lead <strong>{leadEmail}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(deleteLead(leadId));
          dispatch(fetchLeads());
        } catch {
          /* empty */
        }
      },
      "Delete",
      "Cancel",
    );
  };

  const handleAddLead = (
    values: { leadEmail: string; teamName: string },
    resetForm: () => void,
  ) => {
    dialogContext.showConfirmation(
      "Add New Lead",
      <Typography variant="body1">
        Are you sure you want to add <strong>{values.leadEmail}</strong> of team{" "}
        <strong>{values.teamName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(
            addLead({
              leadEmail: values.leadEmail,
              teamName: values.teamName,
            }),
          );
          dispatch(fetchLeads());
          setAddAnchorEl(null);
          resetForm();
        } catch {
          // Error state handled by Redux slice and UI
        }
      },
      "Add",
      "Cancel",
    );
  };

  const handleEdit = (updated: Lead) => {
    dialogContext.showConfirmation(
      "Edit Default Team",
      <Typography variant="body2">
        Save changes to <strong>{editTarget?.teamName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        setEditTarget(undefined);
        await dispatch(updateLead(updated));
        dispatch(fetchLeads());
      },
      "Save",
      "Cancel",
    );
  };

  const columns: GridColDef[] = [
    {
      field: "leadId",
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
      field: "leadEmail",
      headerName: "Lead Email",
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
      field: "actions",
      headerName: "Actions",
      width: 100,
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
          <Tooltip title="Delete" arrow>
            <IconButton
              size="small"
              onClick={() => handleDeleteLead(params.row.leadId, params.row.leadEmail)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: "6px",
                color: theme.palette.customText.primary.p3.active,
                "&:hover": {
                  color: theme.palette.error.main,
                  background: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <Trash2 size={13} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const isLoading = leadsState.state === State.loading;
  const isFetching = leadsState.functionType === "fetch";
  const isMutating = isLoading && !isFetching && !!leadsState.leads;

  if (leadsState.state === State.failed) {
    return <ErrorHandler message="Failed to fetch leads." />;
  }

  return (
    <Box sx={{ gridArea }}>
      <BackgroundLoader open={isMutating} message={leadsState.errorMessage} />
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
          itemCount={leads.length}
          iconColor={theme.palette.info.main}
          title={"Functional Leads"}
          itemType={"functional lead"}
          action={
            <IconButton
              size="small"
              onClick={(e) => setAddAnchorEl(e.currentTarget)}
              sx={{
                borderRadius: "7px",
                background: theme.palette.primary.main,
                color: "#fff",
                "&:hover": { background: theme.palette.primary.dark },
              }}
            >
              <Plus size={14} />
            </IconButton>
          }
        />

        <Box sx={{ width: "100%", height: 400 }}>
          <CustomDataGrid
            rows={leads}
            columns={columns}
            getRowId={(row) => row.leadId}
            loading={isFetching}
          />
        </Box>
      </Box>

      {/* Add lead popover */}
      <Popover
        open={Boolean(addAnchorEl)}
        anchorEl={addAnchorEl}
        onClose={() => setAddAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              width: 340,
              borderRadius: "16px",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "0 4px 20px rgba(0,0,0,0.1)",
              mt: 0.5,
              p: 2,
            },
          },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Add Functional Lead</Typography>
        <Formik
          initialValues={{ teamName: "", leadEmail: "" } satisfies AddLeadPayload}
          validationSchema={LeadSchema}
          onSubmit={(values, { resetForm }) => handleAddLead(values, resetForm)}
        >
          {({ errors, touched }) => (
            <Form>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Field
                  as={TextField}
                  name="leadEmail"
                  label="Lead Email"
                  size="small"
                  fullWidth
                  error={touched.leadEmail && !!errors.leadEmail}
                  helperText={touched.leadEmail && errors.leadEmail}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "7px" } }}
                />
                <Field
                  as={TextField}
                  name="teamName"
                  label="Team Name"
                  size="small"
                  fullWidth
                  error={touched.teamName && !!errors.teamName}
                  helperText={touched.teamName && errors.teamName}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "7px" } }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton
                    type="submit"
                    sx={{
                      borderRadius: "8px",
                      px: 1.5,
                      fontSize: 13,
                      background: theme.palette.primary.main,
                      color: "#fff",
                      "&:hover": { background: theme.palette.primary.dark },
                    }}
                  >
                    Add
                  </IconButton>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Popover>

      {/* Edit dialog */}
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
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>
          Edit Functional Lead
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Formik
            enableReinitialize
            initialValues={{
              leadEmail: editTarget?.leadEmail ?? "",
              teamName: editTarget?.teamName ?? "",
            }}
            validationSchema={LeadSchema}
            onSubmit={(values) => {
              if (editTarget && values.teamName && values.leadEmail) {
                handleEdit({
                  leadId: editTarget.leadId,
                  teamName: values.teamName,
                  leadEmail: values.leadEmail,
                });
              }
            }}
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
                  <Field
                    as={TextField}
                    name="teamName"
                    label="Team name"
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "7px" },
                    }}
                    error={touched.teamName && !!errors.teamName}
                    helperText={touched.teamName && errors.teamName}
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
