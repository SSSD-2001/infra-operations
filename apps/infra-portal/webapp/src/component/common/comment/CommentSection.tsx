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
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";

import { useEffect, useRef, useState } from "react";

import { State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import CommentCard from "@component/common/comment/CommentCard";
import { addComments, fetchComments, resetCommentsState } from "@slices/commentSlice/comment";
import { RequestApprovalState } from "@slices/repositoryRequestSlice/repositoryRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";

interface CommentSectionProps {
  requestId: number;
  currentUserEmail: string;
  requestState: string;
}

export default function CommentSection({
  requestId,
  currentUserEmail,
  requestState,
}: CommentSectionProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { state, comments, errorMessage } = useAppSelector((state) => state.comments);
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchComments(requestId));
    return () => {
      dispatch(resetCommentsState());
    };
  }, [dispatch, requestId]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await dispatch(
        addComments({
          requestId: requestId,
          authorEmail: currentUserEmail,
          commentText: commentText,
        }),
      ).unwrap();
      setCommentText("");
      dispatch(fetchComments(requestId));
    } catch {
      // Keep the draft so the user can retry; the thunk already surfaces an error snackbar.
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 1,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }} textAlign="center">
        Comments
      </Typography>
      <BackgroundLoader open={state === State.loading} message={errorMessage} />
      <Box sx={{ flex: 1, overflowY: "auto", mb: 2, pr: 1, minHeight: 0 }}>
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard
              key={comment.commentId}
              authorEmail={comment.authorEmail}
              commentText={comment.commentText}
              createdAt={comment.createdAt}
            />
          ))
        ) : (
          <Typography sx={{ color: theme.palette.customText.primary.p3.active }}>
            No comments yet.
          </Typography>
        )}
        <div ref={commentsEndRef} />
      </Box>
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            theme.palette.mode === "dark"
              ? theme.palette.surface.primary.active
              : theme.palette.neutral["white"],
          p: 1,
          zIndex: 1,
          borderRadius: "12px",
        }}
      >
        {requestState === RequestApprovalState.PENDING && (
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <TextField
              label="Add a comment"
              multiline
              minRows={2}
              fullWidth
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              variant="outlined"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ mb: 0.5, minWidth: 80 }}
              onClick={handleAddComment}
              disabled={!commentText.trim()}
            >
              Post
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
