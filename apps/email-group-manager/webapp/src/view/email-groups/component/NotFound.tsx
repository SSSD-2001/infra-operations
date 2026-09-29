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

import { Box, Typography } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";

const NotFound = ({ message = "No results found" }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="60vh"
      textAlign="center"
      px={2}
    >
      <SearchOffIcon sx={{ fontSize: 80, color: "gray", mb: 2 }} />

      <Typography variant="h5" gutterBottom color="text.primary">
        {message}
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Try adjusting your search to find what you're looking for.
      </Typography>
    </Box>
  );
};

export default NotFound;
