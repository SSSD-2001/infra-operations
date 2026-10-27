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

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { getPublicGroups } from "@root/src/slices/publicGroupsSlice/publicGroups";
import GroupsList from "../component/GroupsList";

function PublicGroups() {
  const dispatch = useAppDispatch();

  const { groups, state, errorMessage } = useAppSelector(
    (state) => state.publicGroups,
  );

  const userGroups = useAppSelector((state) => state.userGroups.groups);

  useEffect(() => {
    dispatch(getPublicGroups());
  }, [dispatch]);

  return (
    <GroupsList
      title="public groups"
      groups={groups}
      state={state}
      errorMessage={errorMessage}
      showSubscribe
      userGroups={userGroups}
    />
  );
}

export default PublicGroups;
