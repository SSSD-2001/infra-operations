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
import CloseIcon from "@mui/icons-material/Close";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import { IconButton, Stack, TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import * as React from "react";
import { useState } from "react";

import { ConfirmationType } from "@/types/types";

import { ConfirmationModalContext } from "./useDialogContext";

export type InputObj = {
  label: string;
  mandatory: boolean;
  type: "textarea" | "date";
};

export type ConfirmationDialogContextType = {
  showConfirmation: (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: () => void,
    okText?: string,
    cancelText?: string,
    inputObj?: InputObj,
  ) => void;
};

type ConfirmationModalContextProviderProps = {
  children: React.ReactNode;
};

const ConfirmationModalContextProvider: React.FC<ConfirmationModalContextProviderProps> = (
  props,
) => {
  const [show, setShow] = useState(false);
  const [comment, setComment] = React.useState("");

  const onHide = () => setShow(false);

  const [content, setContent] = useState<{
    title: string;
    message: string | React.ReactNode;
    type: ConfirmationType;
    action: (value?: string) => void;
    okText?: string;
    cancelText?: string;
    inputObj?: InputObj;
  }>({
    title: "",
    message: "",
    type: ConfirmationType.send,
    action: () => {},
  });

  const handleShow = (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: (value?: string) => void,
    okText?: string,
    cancelText?: string,
    inputObj?: InputObj,
  ) => {
    setContent({ title, message, type, action, okText, cancelText, inputObj });
    setShow(true);
  };

  const dialogContext: ConfirmationDialogContextType = {
    showConfirmation: handleShow,
  };

  const handleOk = (value?: string) => {
    if (content) {
      content.action(value);
    }
    onHide();
  };

  const Reset = () => {
    setContent({
      title: "",
      message: "",
      type: ConfirmationType.accept,
      action: () => {},
      okText: undefined,
      cancelText: undefined,
    });
    setComment("");
  };

  const handleCancel = () => {
    onHide();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setComment(event.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ConfirmationModalContext.Provider value={dialogContext}>
        {props.children}
        {content && (
          <Dialog
              open={show}
              slotProps={{
                transition: {
                  onExited: Reset,
                },
              }}
              sx={{
                ".MuiDialog-paper": { maxWidth: 520, borderRadius: 3 },
                backdropFilter: "blur(10px)",
              }}
          >
            <DialogTitle
              variant="h5"
              sx={{
                fontWeight: "bold",
                borderBottom: 1,
                borderColor: "divider",
                mb: 1,
                pd: 0,
              }}
            >
              {content?.title}
            </DialogTitle>
            <IconButton
              aria-label="close"
              onClick={handleCancel}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.secondary.dark,
              }}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent sx={{ p: 0, m: 0, paddingX: 2 }}>
              <DialogContentText variant="body2">{content?.message}</DialogContentText>
            </DialogContent>
            {content.inputObj && (
              <TextField
                sx={{ marginX: 2, mt: 2, maxWidth: 350 }}
                value={comment}
                label={content.inputObj?.label}
                type="text"
                size="small"
                multiline
                rows={2}
                maxRows={6}
                onChange={onChange}
              />
            )}
            <DialogActions sx={{ pb: 2, pt: 0, mt: 0, paddingX: 2 }}>
              <Stack flexDirection={"row"} sx={{ mt: 1 }} gap={1}>
                <Button
                  sx={{ borderRadius: 2 }}
                  onClick={handleCancel}
                  variant="outlined"
                  size="small"
                >
                  {content?.cancelText ? content.cancelText : "No"}
                </Button>
                <LoadingButton
                  type="submit"
                  sx={{
                    borderRadius: 2,
                    boxShadow: "none",
                    border: 0.5,
                    borderColor: "divider",
                  }}
                  variant="contained"
                  size="small"
                  disabled={content?.inputObj?.mandatory && comment === ""}
                  onClick={() => (content?.inputObj ? handleOk(comment) : handleOk())}
                  loadingPosition="start"
                  startIcon={
                    content.type === "update" ? (
                      <SaveAltIcon />
                    ) : content.type === "send" ? (
                      <SendIcon />
                    ) : undefined
                  }
                >
                  {content?.okText ? content.okText : "Yes"}
                </LoadingButton>
              </Stack>
            </DialogActions>
          </Dialog>
        )}
      </ConfirmationModalContext.Provider>
    </LocalizationProvider>
  );
};

export default ConfirmationModalContextProvider;
