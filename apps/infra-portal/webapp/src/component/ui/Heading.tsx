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
import { Stack, Typography, alpha, useTheme } from "@mui/material";

import ServiceIconBox from "@root/src/component/ui/ServiceIconBox";

interface HeadingProps {
  title: string;
  icon: React.ReactNode;
  description: string;
}

export default function Heading(props: HeadingProps) {
  const theme = useTheme();
  return (
    <Stack spacing={2} mb={4} direction="row" alignItems="center">
      {/* Icon */}
      <ServiceIconBox
        icon={props.icon}
        borderRadius={"18px"}
        boxHeight={60}
        boxWidth={60}
        iconHeight={30}
        iconWidth={30}
        background={alpha(theme.palette.background.paper, 1)}
      />
      {/* Title and Description */}
      <Stack spacing={0.5}>
        {/* title */}
        <Typography
          variant="h5"
          letterSpacing={0.5}
          fontWeight={600}
          color={theme.palette.customText.primary.p1.active}
        >
          {props.title}
        </Typography>
        {/* description */}
        <Typography variant="body2" color={theme.palette.customText.primary.p3.active}>
          {props.description}
        </Typography>
      </Stack>
    </Stack>
  );
}
