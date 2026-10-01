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
import { Box, Button, Container, Stack } from "@mui/material";
import Typography from "@mui/material/Typography";

interface PreLoaderProps {
  message?: string | null;
  hideLogo?: boolean;
  action: () => void;
}

const StatusWithAction = (props: PreLoaderProps) => {
  return (
    <Box
      sx={{
        background: "#E7EBF0",
        display: "flex",
        pt: "20vh",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Container maxWidth="md">
        <Box>
          <Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
            <Box>
              {!props.hideLogo && (
                <img
                  alt="logo"
                  width="150"
                  height="auto"
                  src="https://wso2.cachefly.net/wso2/sites/images/brand/downloads/wso2-logo.png"
                />
              )}
            </Box>
            <Box />

            <Box>
              <Typography variant="h5">{props.message}</Typography>
            </Box>
            <Box />

            <Box>
              <Button
                size="large"
                variant="contained"
                style={{ color: "#fff" }}
                color="success"
                onClick={() => props.action()}
              >
                SignIn
              </Button>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default StatusWithAction;
