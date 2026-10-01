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
import { Grid } from "@mui/material";

import ComingSoonCard, { ComingSoonCardProps } from "./ServiceCards/ComingSoonCard";

interface InfraProps {
  services: React.ReactNode[];
  comingSoon: ComingSoonCardProps[];
}

export default function InfraServices(props: InfraProps) {
  return (
    <>
      <Grid container spacing={1.5} mb={4}>
        {props.services.map((service, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            {service}
          </Grid>
        ))}
        {props.comingSoon.map((comingSoon, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <ComingSoonCard {...comingSoon} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
