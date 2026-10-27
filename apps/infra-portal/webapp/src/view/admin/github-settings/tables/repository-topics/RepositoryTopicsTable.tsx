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

import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import ErrorHandler from "@root/src/component/common/ErrorHandler";
import { useConfirmationModalContext } from "@root/src/context";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import {
  AddTopicPayload,
  Topic,
  addTopic,
  deleteTopic,
  fetchTopics,
  updateTopic,
} from "@root/src/slices/topicsSlice/topics";
import { ConfirmationType, State } from "@root/src/types/types";

import { CardHeader } from "../CardHeader";
import CustomDataGrid from "../CustomDataGrid";

const TopicSchema = Yup.object().shape({
  topicName: Yup.string().required("Topic name is required"),
});

export default function RepositoryTopicsTable({ gridArea }: { gridArea?: string }) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const topicsState = useAppSelector((state) => state.topics);
  const dialogContext = useConfirmationModalContext();
  const [editTarget, setEditTarget] = useState<Topic | undefined>();
  const [addAnchorEl, setAddAnchorEl] = useState<HTMLElement | null>(null);

  const topics = topicsState.topics || [];

  useEffect(() => {
    dispatch(fetchTopics());
  }, [dispatch]);

  const handleDeleteTopic = (topicId: number, topicName: string) => {
    dialogContext.showConfirmation(
      "Delete Topic",
      <Typography variant="body1">
        Are you sure you want to delete the topic <strong>{topicName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(deleteTopic(topicId));
          dispatch(fetchTopics());
        } catch {
          /* empty */
        }
      },
      "Delete",
      "Cancel",
    );
  };

  const handleAddTopic = (values: { topicName: string }, resetForm: () => void) => {
    dialogContext.showConfirmation(
      "Add New Topic",
      <Typography variant="body1">
        Are you sure you want to add <strong>{values.topicName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(addTopic({ topicName: values.topicName }));
          dispatch(fetchTopics());
          setAddAnchorEl(null);
          resetForm();
        } catch {
          // no-op; slice will handle error state
        }
      },
      "Add",
      "Cancel",
    );
  };

  const handleEdit = (updated: Topic) => {
    dialogContext.showConfirmation(
      "Edit Topic",
      <Typography variant="body1">
        Are you sure you want to edit <strong>{editTarget?.topicName}</strong>?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        setEditTarget(undefined);
        await dispatch(updateTopic(updated));
        dispatch(fetchTopics());
      },
      "Edit",
      "Cancel",
    );
  };

  const columns: GridColDef[] = [
    {
      field: "topicId",
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
      field: "topicName",
      headerName: "Topic Name",
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
              onClick={() => handleDeleteTopic(params.row.topicId, params.row.topicName)}
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

  const isLoading = topicsState.state === State.loading;
  const isFetching = topicsState.functionType === "fetch";
  const isMutating = isLoading && !isFetching && !!topicsState.topics;

  if (topicsState.state === State.failed) {
    return <ErrorHandler message="Failed to fetch topics." />;
  }

  return (
    <Box sx={{ gridArea }}>
      <BackgroundLoader open={isMutating} message={topicsState.errorMessage} />
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
          itemCount={topics.length}
          iconColor={theme.palette.success.main}
          title={"Repository Topics"}
          itemType={"topic"}
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
            rows={topics}
            columns={columns}
            getRowId={(row) => row.topicId}
            loading={isFetching}
          />
        </Box>
      </Box>

      {/* Add topic popover */}
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
              width: 300,
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
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Add Topic</Typography>
        <Formik
          initialValues={{ topicName: "" } satisfies AddTopicPayload}
          validationSchema={TopicSchema}
          onSubmit={(values, { resetForm }) => handleAddTopic(values, resetForm)}
        >
          {({ errors, touched }) => (
            <Form>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Field
                  as={TextField}
                  name="topicName"
                  label="Topic Name"
                  size="small"
                  fullWidth
                  error={touched.topicName && !!errors.topicName}
                  helperText={touched.topicName && errors.topicName}
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
            initialValues={
              {
                topicName: editTarget?.topicName ?? "",
              } satisfies Partial<Topic>
            }
            validationSchema={TopicSchema}
            onSubmit={(values) => {
              if (editTarget && values.topicName !== editTarget.topicName) {
                handleEdit({
                  topicId: editTarget.topicId,
                  topicName: values.topicName,
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
                    name="topicName"
                    label="Topic"
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "7px" },
                    }}
                    error={touched.topicName && !!errors.topicName}
                    helperText={touched.topicName && errors.topicName}
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
