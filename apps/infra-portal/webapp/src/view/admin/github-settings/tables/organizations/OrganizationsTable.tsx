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
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GridColDef } from "@mui/x-data-grid";
import { Field, Form, Formik } from "formik";
import { Pencil, Plus, RefreshCw, Trash2, User } from "lucide-react";
import * as Yup from "yup";

import { useEffect, useState } from "react";

import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import ErrorHandler from "@root/src/component/common/ErrorHandler";
import { SnackMessage } from "@root/src/config/constant";
import { useConfirmationModalContext } from "@root/src/context";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";
import { fetchDefaultTeams } from "@root/src/slices/defaultTeamSlice/defaultTeams";
import {
  Organization,
  addOrganization,
  deleteOrganization,
  fetchOrganizationById,
  fetchOrganizations,
  syncOrganization,
  updateOrganization,
} from "@root/src/slices/organizationsSlice/organizations";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { ConfirmationType, State } from "@root/src/types/types";

import { CardHeader } from "../CardHeader";
import CustomDataGrid from "../CustomDataGrid";

const OrganizationSchema = Yup.object().shape({
  organizationName: Yup.string().required("Organization name is required"),
  organizationVisibility: Yup.string().required("Visibility is required"),
  defaultTeams: Yup.array().of(Yup.number()).min(0),
});

type OrganizationFormValues = {
  organizationName: string;
  organizationVisibility: string;
  enableIssues: boolean;
  defaultTeams: number[];
};

const initialValues: OrganizationFormValues = {
  organizationName: "",
  organizationVisibility: "",
  enableIssues: true,
  defaultTeams: [],
};

export default function OrganizationsTable({ gridArea }: { gridArea?: string }) {
  const dispatch = useAppDispatch();
  const organizationsState = useAppSelector((state) => state.organizations);
  const defaultTeamsState = useAppSelector((state) => state.defaultTeams);
  const dialogContext = useConfirmationModalContext();
  const [openEditOrganizationDialog, setOpenEditOrganizationDialog] = useState(false);
  const [addAnchorEl, setAddAnchorEl] = useState<HTMLElement | null>(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization>();
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchOrganizations());
    dispatch(fetchDefaultTeams());
  }, [dispatch]);

  const organizations = organizationsState.organizations ?? [];

  useEffect(() => {
    if (currentOrganizationId !== null) {
      dispatch(fetchOrganizationById(currentOrganizationId)).then((action) => {
        if (fetchOrganizationById.fulfilled.match(action)) {
          setCurrentOrganization(action.payload);
        }
      });
    }
  }, [currentOrganizationId, dispatch]);

  const handleDeleteOrganization = (organizationId: number, organizationName: string) => {
    dialogContext.showConfirmation(
      "Delete Organization",
      <Typography variant="body1">
        Are you sure you want to delete the organization <strong>{organizationName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(deleteOrganization(organizationId));
          dispatch(fetchOrganizations());
        } catch {
          // Handled in thunk
        }
      },
      "Delete",
      "Cancel",
    );
  };

  const handleAddOrganization = (values: OrganizationFormValues, resetForm: () => void) => {
    const selectedVisibility = values.organizationVisibility;
    dialogContext.showConfirmation(
      "Add New Organization",
      <Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Are you sure you want to add <strong>{values.organizationName}</strong>?
        </Typography>
        {values.organizationVisibility === "Private" && (
          <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
            This organization may be on the GitHub Free plan. If so, its visibility will be changed
            to <strong>Public</strong> during sync.
          </Alert>
        )}
      </Box>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(
            addOrganization({
              organizationName: values.organizationName,
              organizationVisibility: values.organizationVisibility,
              enableIssues: values.enableIssues,
              teamIds: values.defaultTeams || [],
            }),
          );
          const orgs: Organization[] = (await dispatch(fetchOrganizations()).unwrap()) ?? [];
          const syncedOrg = orgs?.find((org) => org.organizationName === values.organizationName);
          if (
            syncedOrg &&
            syncedOrg.organizationPlan === "Free" &&
            selectedVisibility === "Private" &&
            syncedOrg.organizationVisibility === "Public"
          ) {
            dispatch(
              enqueueSnackbarMessage({
                message: SnackMessage.success.syncedOrganizationMessage,
                type: "success",
              }),
            );
          }
          resetForm();
          setAddAnchorEl(null);
        } catch {
          // Handled in thunk
        }
      },
      "Add",
      "Cancel",
    );
  };

  const handleCloseEditOrganizationDialog = () => {
    setOpenEditOrganizationDialog(false);
    setCurrentOrganizationId(null);
  };

  const handleEditOrganization = (
    currentOrganization: Organization,
    editOrganizationData: OrganizationFormValues,
    resetForm: () => void,
  ) => {
    if (
      currentOrganization?.organizationPlan === "Free" &&
      editOrganizationData.organizationVisibility === "Private"
    ) {
      dialogContext.showConfirmation(
        "Invalid Visibility",
        <Typography variant="body1">
          This organization is on the GitHub Free plan. Visibility cannot be set to{" "}
          <strong>Private</strong>. Please select <strong>Public</strong> or upgrade the plan.
        </Typography>,
        ConfirmationType.accept,
        () => {},
        "OK",
      );
      return;
    }

    dialogContext.showConfirmation(
      "Edit Organization",
      <Typography variant="body1">
        Are you sure you want to edit <strong>{currentOrganization?.organizationName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        handleCloseEditOrganizationDialog();
        console.log("invoked edit");
        if (!currentOrganization) {
          console.error("No organization selected for editing.");
          return;
        }
        try {
          await dispatch(
            updateOrganization({
              organizationId: currentOrganization.organizationId,
              organizationName: editOrganizationData.organizationName,
              organizationVisibility: editOrganizationData.organizationVisibility,
              enableIssues: editOrganizationData.enableIssues,
              teamIds: editOrganizationData.defaultTeams || [],
            }),
          );
          dispatch(fetchOrganizations());
          resetForm();
        } catch {
          // Handled in thunk
        }
      },
      "Edit",
      "Cancel",
    );
  };

  const handleSyncOrganization = (organizationName: string) => {
    (async () => {
      try {
        await dispatch(syncOrganization({ organizationName }));
        dispatch(fetchOrganizations());
      } catch {
        // Handled in thunk
      }
    })();
  };

  const isLoading = organizationsState.state === State.loading;
  const isFetching = organizationsState.functionType === "fetch";
  const isMutating = isLoading && !isFetching && !!organizationsState.organizations;

  const columns: GridColDef[] = [
    {
      field: "organizationId",
      headerName: "ID",
      width: 60,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 10,
            color: theme.palette.customText.primary.p3.active,
          }}
        >
          #{params.value}
        </Typography>
      ),
    },
    {
      field: "organizationName",
      headerName: "Organization Name",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "organizationVisibility",
      headerName: "Visibility",
      width: 100,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "organizationPlan",
      headerName: "Plan",
      width: 80,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "defaultTeams",
      headerName: "Default Teams",
      flex: 1.5,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {params.value || "No default teams"}
        </Typography>
      ),
    },
    {
      field: "enableIssues",
      headerName: "Allow Issues",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 12,
            color: theme.palette.customText.primary.p1.active,
          }}
        >
          {params.value ? "Yes" : "No"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
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
              onClick={() => {
                setCurrentOrganizationId(params.row.organizationId);
                setOpenEditOrganizationDialog(true);
              }}
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
              onClick={() =>
                handleDeleteOrganization(params.row.organizationId, params.row.organizationName)
              }
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
          <Tooltip title="Sync" arrow>
            <IconButton
              size="small"
              onClick={() => handleSyncOrganization(params.row.organizationName)}
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
              <RefreshCw size={13} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (organizationsState.state === State.failed) {
    return <ErrorHandler message={organizationsState.errorMessage} />;
  }

  return (
    <Box sx={{ gridArea }}>
      <BackgroundLoader open={isMutating} message={organizationsState.errorMessage} />

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
          itemCount={organizations.length}
          iconColor={theme.palette.info.main}
          title="Organizations"
          itemType="organization"
          action={
            <Tooltip title="Add organization" arrow>
              <IconButton
                onClick={(e) => setAddAnchorEl(e.currentTarget)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "7px",
                  background: theme.palette.warning.main,
                  color: "#fff",
                  "&:hover": { background: theme.palette.warning.dark },
                }}
              >
                <Plus size={14} />
              </IconButton>
            </Tooltip>
          }
        />

        <Box sx={{ width: "100%", height: 400 }}>
          <CustomDataGrid
            rows={organizations}
            columns={columns}
            getRowId={(row) => row.organizationId}
            loading={isFetching}
          />
        </Box>
      </Box>

      {/* ── Add Organization Popover ── */}
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
              width: 400,
              borderRadius: "16px",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "0 4px 20px rgba(0,0,0,0.12)",
              mt: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Add Organization</Typography>
        </Box>
        <Box sx={{ px: 2.5, pt: 1, pb: 2.5 }}>
          <Formik
            initialValues={initialValues}
            validationSchema={OrganizationSchema}
            onSubmit={(values, { resetForm }) => handleAddOrganization(values, resetForm)}
          >
            {({ errors, touched, values, setFieldValue, handleChange }) => (
              <Form>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
                  <TextField
                    name="organizationName"
                    label="Organization Name"
                    size="small"
                    fullWidth
                    value={values.organizationName}
                    onChange={handleChange}
                    error={touched.organizationName && !!errors.organizationName}
                    helperText={touched.organizationName && errors.organizationName}
                  />

                  <FormControl
                    size="small"
                    fullWidth
                    error={touched.organizationVisibility && !!errors.organizationVisibility}
                  >
                    <InputLabel id="add-visibility-label">Visibility</InputLabel>
                    <Select
                      labelId="add-visibility-label"
                      name="organizationVisibility"
                      label="Visibility"
                      value={values.organizationVisibility}
                      onChange={handleChange}
                    >
                      <MenuItem value="Public">Public</MenuItem>
                      <MenuItem value="Private">Private</MenuItem>
                    </Select>
                    {touched.organizationVisibility && errors.organizationVisibility && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.25, ml: 0.5 }}>
                        {errors.organizationVisibility}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel id="add-teams-label">Default Teams</InputLabel>
                    <Select
                      labelId="add-teams-label"
                      name="defaultTeams"
                      label="Default Teams"
                      multiple
                      value={values.defaultTeams ?? []}
                      onChange={handleChange}
                      renderValue={(selected: number[]) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected
                            .map((id) =>
                              defaultTeamsState.defaultTeams?.find((t) => t.teamId === id),
                            )
                            .filter(Boolean)
                            .map((team) => (
                              <Chip key={team!.teamId} label={team!.teamName} size="small" />
                            ))}
                        </Box>
                      )}
                    >
                      {defaultTeamsState.defaultTeams?.map((team) => (
                        <MenuItem key={team.teamId} value={team.teamId}>
                          {team.teamName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel id="add-issues-label">Allow Issues</InputLabel>
                    <Select
                      labelId="add-issues-label"
                      value={values.enableIssues ? "true" : "false"}
                      name="enableIssues"
                      label="Allow Issues"
                      onChange={(e) =>
                        setFieldValue(
                          "enableIssues",
                          (e.target as unknown as { value: string }).value === "true",
                        )
                      }
                    >
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 0.5 }}>
                    <IconButton
                      onClick={() => setAddAnchorEl(null)}
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
                      Add
                    </IconButton>
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Popover>

      {/* ── Edit Organization Dialog ── */}
      <Dialog
        open={openEditOrganizationDialog}
        onClose={handleCloseEditOrganizationDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>Edit Organization</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Formik
            enableReinitialize
            initialValues={{
              organizationName: currentOrganization?.organizationName ?? "",
              organizationVisibility: currentOrganization?.organizationVisibility ?? "",
              enableIssues:
                currentOrganization?.enableIssues === true ||
                currentOrganization?.enableIssues === 1,
              defaultTeams:
                currentOrganization?.teamIds
                  ?.split(",")
                  .filter(Boolean)
                  .map((id: string) => parseInt(id)) ?? ([] as number[]),
            }}
            validationSchema={OrganizationSchema}
            onSubmit={(values, { resetForm }) => {
              if (currentOrganization) {
                handleEditOrganization(currentOrganization, values, resetForm);
              }
            }}
          >
            {({ errors, touched, values, setFieldValue, handleChange, handleSubmit }) => {
              const isFreePlan = currentOrganization?.organizationPlan === "Free";
              return (
                <Form onSubmit={handleSubmit}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      pt: 0.5,
                      minWidth: 380,
                    }}
                  >
                    <Field
                      as={TextField}
                      name="organizationName"
                      label="Organization name"
                      size="small"
                      fullWidth
                      error={touched.organizationName && !!errors.organizationName}
                      helperText={touched.organizationName && errors.organizationName}
                    />

                    {isFreePlan && (
                      <Alert severity="info" variant="outlined">
                        This organization is on the GitHub Free plan — only <strong>Public</strong>{" "}
                        visibility is allowed.
                      </Alert>
                    )}

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <FormControl
                        size="small"
                        fullWidth
                        error={touched.organizationVisibility && !!errors.organizationVisibility}
                      >
                        <InputLabel id="edit-visibility-label">Visibility</InputLabel>
                        <Field
                          as={Select}
                          labelId="edit-visibility-label"
                          name="organizationVisibility"
                          label="Visibility"
                          value={values.organizationVisibility}
                          onChange={handleChange}
                        >
                          <MenuItem value="Public">Public</MenuItem>
                          <MenuItem value="Private" disabled={isFreePlan}>
                            Private{isFreePlan ? " (not allowed on Free plan)" : ""}
                          </MenuItem>
                        </Field>
                        {touched.organizationVisibility && errors.organizationVisibility && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.25, ml: 0.5 }}>
                            {errors.organizationVisibility}
                          </Typography>
                        )}
                      </FormControl>

                      <FormControl size="small" fullWidth>
                        <InputLabel id="edit-issues-label">Allow Issues</InputLabel>
                        <Select
                          labelId="edit-issues-label"
                          value={values.enableIssues}
                          name="enableIssues"
                          label="Allow Issues"
                          onChange={(e) =>
                            setFieldValue(
                              "enableIssues",
                              (e.target as unknown as { value: string }).value === "true",
                            )
                          }
                        >
                          <MenuItem value="true">Yes</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <FormControl size="small" fullWidth>
                      <InputLabel id="edit-teams-label">Default Teams</InputLabel>
                      <Select
                        labelId="edit-teams-label"
                        multiple
                        value={values.defaultTeams}
                        onChange={(e) => setFieldValue("defaultTeams", e.target.value)}
                        renderValue={(selected: number[]) => (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {selected
                              .map((id) =>
                                defaultTeamsState.defaultTeams?.find((t) => t.teamId === id),
                              )
                              .filter(Boolean)
                              .map((team) => (
                                <Chip key={team!.teamId} label={team!.teamName} size="small" />
                              ))}
                          </Box>
                        )}
                        label="Default Teams"
                      >
                        {defaultTeamsState.defaultTeams?.map((team) => (
                          <MenuItem key={team.teamId} value={team.teamId}>
                            {team.teamName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <IconButton
                        onClick={handleCloseEditOrganizationDialog}
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
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
