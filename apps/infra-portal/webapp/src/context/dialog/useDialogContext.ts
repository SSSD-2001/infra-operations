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
import { useContext, useState } from "react";
import React from "react";

import type { ConfirmationDialogContextType } from "./DialogContext";

type UseConfirmationDialogShowReturnType = {
  show: boolean;
  setShow: (value: boolean) => void;
  onHide: () => void;
};

export const ConfirmationModalContext = React.createContext<ConfirmationDialogContextType | null>(
  null,
);

const useDialogShow = (): UseConfirmationDialogShowReturnType => {
  const [show, setShow] = useState(false);

  const onHide: () => void = () => {
    setShow(false);
  };

  return { show, setShow, onHide };
};

const useConfirmationModalContext = (): ConfirmationDialogContextType => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error(
      "useConfirmationModalContext must be used within a ConfirmationModalContextProvider",
    );
  }
  return context;
};

export { useDialogShow, useConfirmationModalContext };
