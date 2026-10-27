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
import { Pencil, Plus, Trash2, User } from "lucide-react";
import * as Yup from "yup";

import { useEffect, useState } from "react";

import { ConfirmationType, State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import ErrorHandler from "@component/common/ErrorHandler";
import { useConfirmationModalContext } from "@root/src/context";
import {
  DefaultTeam,
  addDefaultTeam,
  deleteDefaultTeam,
  fetchDefaultTeams,
  updateDefaultTeam,
} from "@slices/defaultTeamSlice/defaultTeams";
import { useAppDispatch, useAppSelector } from "@slices/store";

import { CardHeader } from "../CardHeader";
import CustomDataGrid from "../CustomDataGrid";

const DefaultTeamSchema = Yup.object().shape({
  teamName: Yup.string().required("Required"),
  permissionLevel: Yup.string().required("Required"),
});

export default function DefaultTeamTable({ gridArea }: { gridArea?: string }) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const defaultTeamsState = useAppSelector((state) => state.defaultTeams);
  const dialogContext = useConfirmationModalContext();

  const [editTarget, setEditTarget] = useState<DefaultTeam | undefined>();
  const [addAnchorEl, setAddAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchDefaultTeams());
  }, [dispatch]);

  const isLoading = defaultTeamsState.state === State.loading;
  const isFetching = defaultTeamsState.functionType === "fetch";
  const isMutating = isLoading && !isFetching;

  const handleDelete = (teamId: number, teamName: string) => {
    dialogContext.showConfirmation(
      "Delete Default Team",
      <Typography variant="body2">
        Are you sure you want to delete <strong>{teamName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        await dispatch(deleteDefaultTeam(teamId));
        dispatch(fetchDefaultTeams());
      },
      "Delete",
      "Cancel",
    );
  };

  const handleAddDefaultTeam = (
    values: { teamName: string; permissionLevel: string },
    resetForm: () => void,
  ) => {
    dialogContext.showConfirmation(
      "Add Default Team",
      <Typography variant="body2">
        Add <strong>{values.teamName}</strong> with <strong>{values.permissionLevel}</strong>{" "}
        permission?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        await dispatch(
          addDefaultTeam({ teamName: values.teamName, permissionLevel: values.permissionLevel }),
        );
        dispatch(fetchDefaultTeams());
        setAddAnchorEl(null);
        resetForm();
      },
      "Add",
      "Cancel",
    );
  };

  const handleEdit = (updated: DefaultTeam) => {
    dialogContext.showConfirmation(
      "Edit Default Team",
      <Typography variant="body2">
        Save changes to <strong>{editTarget?.teamName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        setEditTarget(undefined);
        await dispatch(updateDefaultTeam(updated));
        dispatch(fetchDefaultTeams());
      },
      "Save",
      "Cancel",
    );
  };

  function PermissionPill({ level }: { level: string }) {
    let color = theme.palette.primary.main;
    let bg = alpha(theme.palette.primary.main, 0.12);

    switch (level) {
      case "push":
        color = theme.palette.warning.main;
        bg = alpha(theme.palette.warning.main, 0.12);
        break;
      case "pull":
        color = theme.palette.info.main;
        bg = alpha(theme.palette.info.main, 0.12);
        break;
      case "triage":
        color = theme.palette.warning.dark;
        bg = alpha(theme.palette.warning.dark, 0.12);
        break;
      case "admin":
        color = theme.palette.error.main;
        bg = alpha(theme.palette.error.main, 0.12);
        break;
    }

    return (
      <Box
        sx={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "monospace",
          px: 0.75,
          py: 0.2,
          borderRadius: "4px",
          background: bg,
          color,
          width: "fit-content",
        }}
      >
        {level}
      </Box>
    );
  }

  const columns: GridColDef[] = [
    {
      field: "teamId",
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
      field: "teamName",
      headerName: "Team Name",
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
      field: "permissionLevel",
      headerName: "Permission",
      width: 120,
      renderCell: (params) => <PermissionPill level={params.value} />,
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
              onClick={() => handleDelete(params.row.teamId, params.row.teamName)}
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

  if (defaultTeamsState.state === State.failed && !defaultTeamsState.defaultTeams) {
    return <ErrorHandler message="Failed to fetch default teams." />;
  }

  const teams = defaultTeamsState.defaultTeams ?? [];

  const PERMISSION_LEVELS = ["push", "pull", "triage", "admin"] satisfies readonly string[];

  return (
    <Box sx={{ gridArea }}>
      <BackgroundLoader open={isMutating} message={defaultTeamsState.errorMessage} />

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
          itemCount={teams.length}
          iconColor={theme.palette.warning.main}
          title={"Default Teams"}
          itemType={"team"}
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
            rows={teams}
            columns={columns}
            getRowId={(row) => row.teamId}
            loading={isFetching}
          />
        </Box>
      </Box>

      {/* Add team popover */}
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
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Add Default Team</Typography>
        <Formik
          initialValues={{ teamName: "", permissionLevel: "" }}
          validationSchema={DefaultTeamSchema}
          onSubmit={(values, { resetForm }) => handleAddDefaultTeam(values, resetForm)}
        >
          {({ errors, touched, values, handleChange }) => (
            <Form>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                <FormControl
                  size="small"
                  fullWidth
                  error={touched.permissionLevel && !!errors.permissionLevel}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "7px" } }}
                >
                  <InputLabel>Permission Level</InputLabel>
                  <Select
                    name="permissionLevel"
                    label="Permission Level"
                    value={values.permissionLevel}
                    onChange={handleChange}
                  >
                    {PERMISSION_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                  {touched.permissionLevel && errors.permissionLevel && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.25, ml: 0.5 }}>
                      {errors.permissionLevel}
                    </Typography>
                  )}
                </FormControl>
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
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>Edit Default Team</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Formik
            enableReinitialize
            initialValues={{
              teamName: editTarget?.teamName ?? "",
              permissionLevel: editTarget?.permissionLevel ?? "",
            }}
            validationSchema={DefaultTeamSchema}
            onSubmit={(values) => {
              if (editTarget && values.teamName && values.permissionLevel) {
                handleEdit({
                  teamId: editTarget.teamId,
                  teamName: values.teamName,
                  permissionLevel: values.permissionLevel,
                });
              }
            }}
          >
            {({ errors, touched, values, handleChange }) => (
              <Form>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5, minWidth: 360 }}
                >
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
                  <FormControl
                    size="small"
                    error={touched.permissionLevel && !!errors.permissionLevel}
                    sx={{ flex: 1, minWidth: 100, maxWidth: 250, mr: 2 }}
                  >
                    <InputLabel
                      sx={{
                        color: (theme) =>
                          touched.permissionLevel && !!errors.permissionLevel
                            ? theme.palette.error.main
                            : theme.palette.customText.primary.p3.active,
                      }}
                    >
                      Permission Level
                    </InputLabel>
                    <Field
                      as={Select}
                      name="permissionLevel"
                      label="Permission Level"
                      value={values.permissionLevel}
                      onChange={handleChange}
                    >
                      {PERMISSION_LEVELS.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.permissionLevel && errors.permissionLevel && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.25, ml: 0.5 }}>
                        {errors.permissionLevel}
                      </Typography>
                    )}
                  </FormControl>
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
