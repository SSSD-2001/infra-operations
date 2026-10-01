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
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

interface ServiceIconBoxProps {
  borderRadius?: number | string;
  boxHeight?: number | string;
  boxWidth?: number | string;
  iconHeight?: number | string;
  iconWidth?: number | string;
  background?: string;
  icon: React.ReactNode;
}

export default function ServiceIconBox(props: ServiceIconBoxProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        width: props.boxWidth || 34,
        height: props.boxHeight || 34,
        borderRadius: props.borderRadius || "9px",
        background: props.background || "transparent",
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box
        component="svg"
        width={props.iconWidth || 18}
        height={props.iconHeight || 18}
        viewBox="0 0 24 24"
        sx={{
          color: theme.palette.text.primary,
          display: "block",
        }}
      >
        {props.icon}
      </Box>
    </Box>
  );
}
