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

import { Box } from "@mui/material";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import MarkdownPreview from "@uiw/react-markdown-preview";
import ErrorHandler from "@root/src/component/common/ErrorHandler";

function UserGuide() {
  const theme = useTheme();
  const [markdownContent, setMarkdownContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const imageStyle = {
    maxWidth: "80%",
    height: "auto",
    display: "block",
    margin: "0 auto",
  } as const;

  useEffect(() => {
    const controller = new AbortController();

    fetch("/README.md", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch README.md: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        setMarkdownContent(text);
        setError(null);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error("Error fetching README.md file:", err);
        setError("Unable to load the user guide. Please try again later.");
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <Box sx={{ padding: theme.spacing(3) }}>
        <ErrorHandler message={error} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          paddingX: 2,
          paddingY: 2,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <MarkdownPreview
            source={markdownContent}
            style={{
              backgroundColor: theme.palette.background.default,
              padding: theme.spacing(10),
              color: theme.palette.text.primary,
            }}
            rehypeRewrite={(node, index, parent) => {
              if (
                node.type === "element" &&
                node.tagName === "a" &&
                parent?.type === "element" &&
                /^h(1|2|3|4|5|6)/.test(parent.tagName)
              ) {
                parent.children = parent.children.slice(1);
              }
            }}
            components={{
              img: ({ ...props }) => <img {...props} style={imageStyle} />,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default UserGuide;
