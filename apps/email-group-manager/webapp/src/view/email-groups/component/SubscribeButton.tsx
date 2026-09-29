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

import { useEffect, useState } from "react";

import { LoadingButton } from "@mui/lab";

import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { subscribeGroup } from "@slices/subscribeSlice/subscribe";
import { unsubscribeGroup } from "@slices/unsubscribeSlice/unsubscribe";
import {
  addNewGroup,
  removeExistingGroup,
} from "@root/src/slices/userGroupsSlice/userGroups";

interface SubscribeButtonProps {
  groupEmail: string;
  isSubscribed: boolean;
}

function SubscribeButton({ groupEmail, isSubscribed }: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSubscribed(isSubscribed);
  }, [isSubscribed]);

  const userEmail = useAppSelector((state) => state.auth.userInfo?.email);
  const dispatch = useAppDispatch();

  const handleButtonClick = async () => {
    if (userEmail) {
      try {
        setLoading(true);
        if (subscribed) {
          await dispatch(
            unsubscribeGroup({ user: userEmail, groupName: groupEmail }),
          ).unwrap(); // Without using unwrap(),
          // rejected actions won't throw an error, so we won't be able to catch them in the catch block.
          dispatch(removeExistingGroup(groupEmail));
        } else {
          await dispatch(
            subscribeGroup({ user: userEmail, groupName: groupEmail }),
          ).unwrap();
          dispatch(addNewGroup(groupEmail));
        }
        setSubscribed(!subscribed);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      variant="outlined"
      color={subscribed ? "error" : "primary"}
      size="small"
      onClick={handleButtonClick}
      loading={loading}
      sx={{ minWidth: 86, whiteSpace: "nowrap", py: 0.35 }}
    >
      {subscribed ? "Unsubscribe" : "Subscribe"}
    </LoadingButton>
  );
}

export default SubscribeButton;
