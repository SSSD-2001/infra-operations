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

import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.background.paper, 0.96),
  border: `1px solid ${theme.palette.divider}`,
  transition: "0.2s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  "&:hover": {
    backgroundColor: alpha(theme.palette.background.paper, 1),
    borderColor: theme.palette.action.active,
  },
  "&:focus-within": {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
  },
  width: "100%",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 1.5),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1.15, 1.5, 1.15, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: "14px",
    lineHeight: 1.4,
    "&::placeholder": {
      color: theme.palette.text.secondary,
      opacity: 0.8,
    },
  },
}));

export default function SearchBar({
  placeholder = "Search…",
  onQueryChange,
}: {
  placeholder?: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <Search>
        <SearchIconWrapper>
          <SearchIcon fontSize="small" />
        </SearchIconWrapper>

        <StyledInputBase
          placeholder={placeholder}
          inputProps={{ "aria-label": "search" }}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </Search>
    </Box>
  );
}
