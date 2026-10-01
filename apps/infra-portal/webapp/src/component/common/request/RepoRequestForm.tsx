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
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  createFilterOptions,
  useTheme,
} from "@mui/material";
import { useFormik } from "formik";
import { Link } from "react-router-dom";
import * as yup from "yup";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmationType, State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import { CICD_CONFIGURATION_ENABLE, GITHUB_DESCRIPTION_MAX } from "@config/config";
import { BRANCH_PROTECTION_TYPES, JENKINS_JOB_TYPES } from "@config/constant";
import { useConfirmationModalContext } from "@context";
import { fetchEmployees } from "@slices/employeeSlice/employee";
import { fetchLeads } from "@slices/leadsSlice/leads";
import {
  Organization,
  fetchOrganizationById,
  fetchOrganizations,
} from "@slices/organizationsSlice/organizations";
import {
  AddRepositoryRequestPayload,
  RepositoryRequest,
  RequestApprovalState,
  addRepositoryRequests,
  updateRepositoryRequest,
} from "@slices/repositoryRequestSlice/repositoryRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { fetchTeams, resetTeamsState } from "@slices/teamsSlice/teams";
import { fetchTopics } from "@slices/topicsSlice/topics";
import { getUserInfo } from "@slices/userSlice/user";
import {
  descriptionValidation,
  emailListValidation,
  repoNameValidation,
  sanitizeDescription,
  sanitizeEmails,
  sanitizeRepoName,
  sanitizeTopics,
  sanitizeUrl,
  topicsValidation,
  urlValidation,
} from "@utils/utils";

const validationSchema = yup.object({
  // Step 0: General Details
  email: yup.string().trim().required("Member Email is required."),
  leadEmail: yup
    .string()
    .trim()
    .required("Lead Email is required.")
    .email("Lead Email must be a valid email."),
  requirement: yup.string().trim().required("Requirement is required."),
  ccList: emailListValidation,

  // Step 1: Repository Details
  organizationId: yup
    .number()
    .typeError("Organization is required.")
    .moreThan(0, "Organization is required."),
  repoName: repoNameValidation,
  repoType: yup.string().trim().required("Repository Type is required."),
  enableIssues: yup.string().trim().oneOf(["Yes", "No"]).required("Enable Issues is required."),
  description: descriptionValidation,
  topics: topicsValidation,
  websiteUrl: urlValidation,

  // Step 2: Security Details
  prProtection: yup.string().trim().required("PR Protection is required."),
  teams: yup.string().trim().required("Teams are required."),
  enableTriageWso2All: yup.string().when("organizationVisibility", {
    is: (visibility: string) => visibility === "Private",
    then: (schema) => schema.required("Enable Triage WSO2 All is required."),
  }),
  enableTriageWso2AllInterns: yup.string().when("organizationVisibility", {
    is: (visibility: string) => visibility === "Private",
    then: (schema) => schema.required("Enable Triage WSO2 All Interns is required."),
  }),
  disableTriageReason: yup.string().when(["enableTriageWso2All", "enableTriageWso2AllInterns"], {
    is: (enableTriageWso2All: string, enableTriageWso2AllInterns: string) =>
      enableTriageWso2All !== "Yes" || enableTriageWso2AllInterns !== "Yes",
    then: (schema) =>
      schema
        .required("Disable Triage Reason is required.")
        .notOneOf(["N/A"], "Please provide a reason for disabling triage access."),
  }),

  // Step 3: CI/CD Details
  cicdRequirement: yup.string().trim(),
  jenkinsJobType: yup.string().when("cicdRequirement", {
    is: "Jenkins",
    then: (schema) =>
      schema
        .required("Jenkins Job Type is required.")
        .notOneOf(["N/A"], "Jenkins Job Type is required."),
  }),
  azureDevopsOrg: yup.string().when("cicdRequirement", {
    is: "Azure",
    then: (schema) =>
      schema
        .required("Azure DevOps Organization is required.")
        .notOneOf(["N/A"], "Azure DevOps Organization is required."),
  }),
  azureDevopsProject: yup.string().when("cicdRequirement", {
    is: "Azure",
    then: (schema) =>
      schema
        .required("Azure DevOps Project is required.")
        .notOneOf(["N/A"], "Azure DevOps Project is required."),
  }),
});

const tooltipPopperProps = {
  sx: {
    "& .MuiTooltip-tooltip": {
      maxWidth: "200px",
      fontSize: "0.55rem",
    },
  },
};

const defaultValues: RepositoryRequest = {
  id: 0,
  email: "",
  leadEmail: "",
  requirement: "",
  ccList: "",
  repoName: "",
  organizationName: "",
  organizationId: 0,
  organizationVisibility: "",
  repoType: "Public",
  description: "",
  enableIssues: "No",
  websiteUrl: "",
  topics: "",
  prProtection: "",
  teams: "",
  enableTriageWso2All: "Yes",
  enableTriageWso2AllInterns: "Yes",
  disableTriageReason: "N/A",
  cicdRequirement: "Not Applicable",
  jenkinsJobType: "N/A",
  jenkinsGroupId: "N/A",
  azureDevopsOrg: "N/A",
  azureDevopsProject: "N/A",
  timestamp: "",
  state: RequestApprovalState.PENDING,
  updatedAt: "",
};

interface RepoRequestFormProps {
  mode: "create" | "edit";
  initialValues?: RepositoryRequest;
  onUpdateSuccess?: () => void;
}

export default function RepoRequestForm({
  mode,
  initialValues,
  onUpdateSuccess,
}: RepoRequestFormProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const teamsState = useAppSelector((state) => state.teams);
  const repositoryRequestsState = useAppSelector((state) => state.repositoryRequest);
  const organizationsState = useAppSelector((state) => state.organizations);
  const topicsState = useAppSelector((state) => state.topics);
  const leadsState = useAppSelector((state) => state.leads);
  const userInfo = useAppSelector((state) => state.user.userInfo);
  const employeesState = useAppSelector((state) => state.employee.employees);

  const dialogContext = useConfirmationModalContext();

  const [currentStep, setCurrentStep] = useState(0);
  const [organizationName, setOrganizationName] = useState<string>(
    initialValues?.organizationName ?? "",
  );
  const [organizationPlan, setOrganizationPlan] = useState<string>();
  const [enableIssues, setEnableIssues] = useState<boolean>();

  const steps = ["General Details", "Repository Details", "Access Details", "CI/CD Details"];
  const prevOrgRef = useRef<string | undefined>(undefined);
  const filter = createFilterOptions<string>();

  const handleOrganizationChange = useCallback(
    async (selectedOrganizationId: number) => {
      if (selectedOrganizationId > 0) {
        try {
          const org: Organization = await dispatch(
            fetchOrganizationById(selectedOrganizationId),
          ).unwrap();
          setOrganizationName(org.organizationName);
          setOrganizationPlan(org.organizationPlan);
        } catch {
          setOrganizationName("Organization not found");
          setOrganizationPlan(undefined);
        }
      }
    },
    [dispatch],
  );

  const sortOrganizations = (organizations: Organization[]): Organization[] => {
    const organizationPriorityOrder = [
      "wso2",
      "wso2-extensions",
      "wso2-enterprise",
      "ballerina-platform",
    ];
    return [...organizations].sort((a, b) => {
      const indexA = organizationPriorityOrder.indexOf(a.organizationName);
      const indexB = organizationPriorityOrder.indexOf(b.organizationName);
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.organizationName.localeCompare(b.organizationName);
    });
  };

  const sortedOrganizations = useMemo(
    () => sortOrganizations(organizationsState.organizations ?? []),
    [organizationsState.organizations],
  );

  useEffect(() => {
    dispatch(getUserInfo());
    dispatch(fetchOrganizations());
    dispatch(fetchTopics());
    dispatch(fetchLeads());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const formik = useFormik<RepositoryRequest>({
    initialValues: {
      ...defaultValues,
      email: userInfo?.workEmail || "",
      ...(initialValues ?? {}),
    },
    enableReinitialize: true,
    validationSchema: validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      const sanitizedValues: RepositoryRequest = {
        ...values,
        ccList: sanitizeEmails(values.ccList),
        repoName: sanitizeRepoName(values.repoName),
        description: sanitizeDescription(values.description),
        topics: sanitizeTopics(values.topics),
        requirement: values.requirement.trim(),
        websiteUrl: sanitizeUrl(values.websiteUrl),
      };
      const {
        id: _id,
        organizationName: _organizationName,
        organizationVisibility: _organizationVisibility,
        updatedAt: _updatedAt,
        timestamp: _timestamp,
        state: _state,
        ...submitValues
      } = sanitizedValues;
      void _id;
      void _organizationName;
      void _organizationVisibility;
      void _updatedAt;
      void _timestamp;
      void _state;

      if (mode === "create") {
        handleCreateRequest(submitValues as AddRepositoryRequestPayload, resetForm);
      } else if (initialValues) {
        handleUpdateRequest(initialValues, submitValues as AddRepositoryRequestPayload);
      }
    },
  });

  const handleCreateRequest = (formData: AddRepositoryRequestPayload, resetForm: () => void) => {
    dialogContext.showConfirmation(
      "Confirm Repository Request",
      <Box>
        <Typography variant="body1">
          <strong>Are you sure you want to create this request?</strong>
        </Typography>
        <Typography variant="body2">
          {`${formData.repoName} - ${organizationName} - ${formData.repoType}`}
        </Typography>
      </Box>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(addRepositoryRequests(formData)).unwrap();
          resetForm();
          setCurrentStep(0);
        } catch {
          // Creation failed; keep the form state so the user can retry.
        }
      },
      "Confirm",
      "Cancel",
    );
  };

  const getUpdatedFields = (
    oldData: RepositoryRequest,
    newData: AddRepositoryRequestPayload,
  ): Partial<AddRepositoryRequestPayload> => {
    const updatedFields: Partial<AddRepositoryRequestPayload> = {};
    (Object.keys(newData) as (keyof AddRepositoryRequestPayload)[]).forEach((key) => {
      const newValue = newData[key];
      const oldValue = oldData[key as keyof RepositoryRequest];
      if (newValue !== oldValue && newValue !== undefined) {
        // @ts-expect-error index assignment across the shared key set
        updatedFields[key] = newValue;
      }
    });
    return updatedFields;
  };

  const handleUpdateRequest = (
    editRequestData: RepositoryRequest,
    updatedData: AddRepositoryRequestPayload,
  ) => {
    const updatedFields = getUpdatedFields(editRequestData, updatedData);

    if (Object.keys(updatedFields).length === 0) {
      dialogContext.showConfirmation(
        "No Changes Detected",
        <Typography variant="body1">No changes were made to the repository request.</Typography>,
        ConfirmationType.accept,
        () => {},
        "OK",
      );
      return;
    }

    dialogContext.showConfirmation(
      "Confirm Update",
      <Typography variant="body1">
        Are you sure you want to update this repository request?
      </Typography>,
      ConfirmationType.accept,
      async () => {
        try {
          await dispatch(
            updateRepositoryRequest({
              id: editRequestData.id,
              ...updatedFields,
              state: RequestApprovalState.PENDING,
            }),
          ).unwrap();
          onUpdateSuccess?.();
        } catch {
          // Update failed; keep the dialog open so the user can retry.
        }
      },
      "Yes",
      "No",
    );
  };

  const handleBack = () => setCurrentStep((prevStep) => prevStep - 1);

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0:
        return ["email", "leadEmail", "requirement", "ccList"];
      case 1:
        return [
          "organizationId",
          "repoName",
          "repoType",
          "description",
          "enableIssues",
          "topics",
          "websiteUrl",
        ];
      case 2:
        return [
          "teams",
          "enableTriageWso2All",
          "enableTriageWso2AllInterns",
          "disableTriageReason",
        ];
      case 3:
        return CICD_CONFIGURATION_ENABLE
          ? [
              "cicdRequirement",
              "jenkinsJobType",
              "jenkinsGroupId",
              "azureDevopsOrg",
              "azureDevopsProject",
            ]
          : [];
      default:
        return [];
    }
  };

  const validateStep = async () => {
    const stepFields = getStepFields(currentStep);
    const touchedFields = stepFields.reduce(
      (acc, field) => {
        acc[field] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    formik.setTouched(touchedFields, true);
    const errors = await formik.validateForm();
    return stepFields.some((field) => errors[field as keyof AddRepositoryRequestPayload]);
  };

  const handleNext = async () => {
    const hasErrors = await validateStep();
    if (!hasErrors) {
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };

  useEffect(() => {
    if (formik.values.cicdRequirement === "Jenkins") {
      formik.setFieldValue("azureDevopsOrg", "N/A", false);
      formik.setFieldValue("azureDevopsProject", "N/A", false);
    } else if (formik.values.cicdRequirement === "Azure") {
      formik.setFieldValue("jenkinsJobType", "N/A", false);
      formik.setFieldValue("jenkinsGroupId", "N/A", false);
    } else if (formik.values.cicdRequirement === "Not Applicable") {
      formik.setFieldValue("jenkinsJobType", "N/A", false);
      formik.setFieldValue("jenkinsGroupId", "N/A", false);
      formik.setFieldValue("azureDevopsOrg", "N/A", false);
      formik.setFieldValue("azureDevopsProject", "N/A", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.cicdRequirement]);

  // Keep disableTriageReason in sync with whether it is required, so the placeholder
  // "N/A" never satisfies the required check when the user must actually provide a reason.
  useEffect(() => {
    const reasonRequired =
      formik.values.enableTriageWso2All === "No" ||
      formik.values.enableTriageWso2AllInterns === "No";
    if (reasonRequired) {
      if (formik.values.disableTriageReason === "N/A") {
        formik.setFieldValue("disableTriageReason", "", false);
      }
    } else if (!formik.values.disableTriageReason?.trim()) {
      formik.setFieldValue("disableTriageReason", "N/A", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.enableTriageWso2All, formik.values.enableTriageWso2AllInterns]);

  useEffect(() => {
    if (
      prevOrgRef.current !== undefined &&
      formik.values.organizationName &&
      formik.values.organizationName !== prevOrgRef.current
    ) {
      formik.setFieldValue("teams", "", false);
    }
    if (formik.values.organizationName) {
      dispatch(fetchTeams(formik.values.organizationName));
    }
    if (formik.values.organizationVisibility === "Private") {
      formik.setFieldValue("repoType", "Private", false);
    } else if (formik.values.organizationVisibility === "Public") {
      formik.setFieldValue("repoType", "Public", false);
    }
    if (organizationPlan === "Free") {
      formik.setFieldValue("repoType", "Public", false);
    }
    prevOrgRef.current = formik.values.organizationName;
    handleOrganizationChange(formik.values.organizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formik.values.organizationName,
    formik.values.organizationId,
    dispatch,
    organizationPlan,
    formik.values.organizationVisibility,
  ]);

  const repoTypeRestriction = useMemo(() => {
    if (organizationPlan === "Free") {
      return {
        type: "public",
        message:
          "This organization is on the GitHub Free plan — only Public repositories are permitted.",
      };
    }
    if (formik.values.organizationVisibility === "Public") {
      return {
        type: "public",
        message: "This organization is Public — only Public repositories are allowed.",
      };
    }
    if (formik.values.organizationVisibility === "Private") {
      return {
        type: "private",
        message: "This organization is Private — only Private repositories are allowed.",
      };
    }
    return null;
  }, [organizationPlan, formik.values.organizationVisibility]);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth size="small" variant="outlined">
                <Tooltip
                  title="Email address of the member requesting the repository."
                  arrow
                  placement="bottom-start"
                  slotProps={{ popper: tooltipPopperProps }}
                >
                  <TextField
                    label="Member Email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { sx: { zIndex: 1 }, required: true } }}
                    disabled
                    error={!!formik.errors.email}
                    helperText={formik.errors.email}
                  />
                </Tooltip>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Tooltip
                title={
                  <span>
                    Please{" "}
                    <Link
                      to="/help"
                      style={{ textDecoration: "underline", color: theme.palette.common.white }}
                    >
                      click here
                    </Link>{" "}
                    to check functional heads.
                  </span>
                }
                arrow
                placement="bottom-start"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <FormControl
                  fullWidth
                  size="small"
                  variant="outlined"
                  error={formik.touched.leadEmail && !!formik.errors.leadEmail}
                >
                  <InputLabel>Lead Email</InputLabel>
                  <Select
                    label="Lead Email"
                    name="leadEmail"
                    value={formik.values.leadEmail}
                    onChange={formik.handleChange}
                    disabled={leadsState.state === State.loading}
                  >
                    {leadsState.state === State.loading ? (
                      <MenuItem disabled>Loading...</MenuItem>
                    ) : Array.isArray(leadsState.leads) && leadsState.leads.length > 0 ? (
                      leadsState.leads.map((lead) => (
                        <MenuItem key={lead.leadId} value={lead.leadEmail}>
                          {lead.leadEmail} - {lead.teamName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No leads available</MenuItem>
                    )}
                  </Select>
                  {formik.touched.leadEmail && formik.errors.leadEmail && (
                    <FormHelperText>{formik.errors.leadEmail}</FormHelperText>
                  )}
                </FormControl>
              </Tooltip>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small" variant="outlined">
                <Tooltip
                  title="Purpose of requesting this repo"
                  arrow
                  placement="bottom-start"
                  slotProps={{ popper: tooltipPopperProps }}
                >
                  <TextField
                    label="Requirement"
                    name="requirement"
                    value={formik.values.requirement}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    onChange={formik.handleChange}
                    multiline
                    rows={3}
                    required
                    fullWidth
                    size="small"
                    error={formik.touched.requirement && !!formik.errors.requirement}
                    helperText={formik.touched.requirement && formik.errors.requirement}
                  />
                </Tooltip>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small" variant="outlined">
                <Tooltip
                  title="Comma separated list of emails/groups which you want to inform about the request"
                  arrow
                  placement="bottom-start"
                  slotProps={{ popper: tooltipPopperProps }}
                >
                  <Autocomplete
                    freeSolo
                    multiple
                    options={
                      Array.isArray(employeesState)
                        ? employeesState.map((employee) => employee.workEmail)
                        : []
                    }
                    filterOptions={(options, params) => {
                      const filtered = options.filter(
                        (option) =>
                          option.toLowerCase().indexOf(params.inputValue.toLowerCase()) !== -1,
                      );
                      if (params.inputValue !== "" && !options.includes(params.inputValue)) {
                        filtered.push(params.inputValue);
                      }
                      return filtered;
                    }}
                    value={formik.values.ccList ? formik.values.ccList.split(",") : []}
                    onChange={(_, newValue) => {
                      const unique = Array.from(new Set(newValue));
                      formik.setFieldValue("ccList", unique.join(","));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="CC List"
                        variant="outlined"
                        size="small"
                        error={formik.touched.ccList && !!formik.errors.ccList}
                        helperText={formik.touched.ccList && formik.errors.ccList}
                        required
                      />
                    )}
                  />
                </Tooltip>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid container size={12} spacing={0.5} alignItems="flex-start">
              <Grid size={5}>
                <Tooltip
                  title="Select a GitHub organization. Changing this will clear the teams selection"
                  arrow
                  placement="bottom-start"
                  slotProps={{ popper: tooltipPopperProps }}
                >
                  <FormControl
                    required
                    fullWidth
                    size="small"
                    variant="outlined"
                    error={formik.touched.organizationId && !!formik.errors.organizationId}
                  >
                    <InputLabel>Organization</InputLabel>
                    <Select
                      name="organizationId"
                      value={formik.values.organizationId}
                      onChange={async (event) => {
                        const selectedOrgId = event.target.value;
                        const selectedOrg = (organizationsState.organizations ?? []).find(
                          (org) => org.organizationId === selectedOrgId,
                        );
                        formik.setFieldValue(
                          "organizationName",
                          selectedOrg?.organizationName || "",
                        );
                        formik.setFieldValue("organizationId", selectedOrg?.organizationId || 0);
                        formik.setFieldValue(
                          "organizationVisibility",
                          selectedOrg?.organizationVisibility || "",
                        );
                        formik.setFieldValue(
                          "prProtection",
                          !selectedOrg?.enableIssues
                            ? BRANCH_PROTECTION_TYPES.Ballerina_library
                            : BRANCH_PROTECTION_TYPES.Default,
                        );
                        formik.setFieldValue("enableIssues", "No");
                        setEnableIssues((selectedOrg?.enableIssues as number) === 1);
                        setOrganizationPlan(selectedOrg?.organizationPlan);
                        if (selectedOrg?.organizationName) {
                          dispatch(resetTeamsState());
                          dispatch(fetchTeams(selectedOrg.organizationName));
                        }
                      }}
                      label="Organization"
                    >
                      {organizationsState.state === State.loading ? (
                        <MenuItem disabled>Loading...</MenuItem>
                      ) : Array.isArray(organizationsState.organizations) &&
                        organizationsState.organizations.length > 0 ? (
                        sortedOrganizations.map((org) => (
                          <MenuItem key={org.organizationId} value={org.organizationId}>
                            {org.organizationName} - {org.organizationVisibility}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No organizations available</MenuItem>
                      )}
                    </Select>
                    {formik.touched.organizationId && formik.errors.organizationId && (
                      <FormHelperText>{formik.errors.organizationId}</FormHelperText>
                    )}
                  </FormControl>
                </Tooltip>
              </Grid>
              <Grid size="auto" sx={{ textAlign: "center", mx: 0.5, pt: "16px" }}>
                <Typography variant="h6" sx={{ fontSize: "1.6rem" }}>
                  /
                </Typography>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth size="small" variant="outlined">
                  <Tooltip
                    title={
                      <span>
                        Please{" "}
                        <Link
                          to="/help"
                          style={{
                            textDecoration: "underline",
                            color: theme.palette.common.white,
                          }}
                        >
                          click here
                        </Link>{" "}
                        for the repository naming conventions.
                      </span>
                    }
                    arrow
                    placement="bottom-start"
                    slotProps={{ popper: tooltipPopperProps }}
                  >
                    <TextField
                      label="Repository Name"
                      name="repoName"
                      value={formik.values.repoName}
                      onChange={formik.handleChange}
                      required
                      fullWidth
                      size="small"
                      error={formik.touched.repoName && !!formik.errors.repoName}
                      helperText={formik.touched.repoName && formik.errors.repoName}
                    />
                  </Tooltip>
                </FormControl>
              </Grid>
            </Grid>
            <Grid size={12}>
              <Tooltip
                title={
                  enableIssues
                    ? "Enable Issues for the repository"
                    : "Issues cannot be enabled for this organization"
                }
                arrow
                placement="left"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <Typography variant="body1" gutterBottom>
                  Enable Issues
                </Typography>
              </Tooltip>
              <FormControlLabel
                value={formik.values.enableIssues}
                sx={{ ml: 1 }}
                control={
                  <Checkbox
                    name="enableIssues"
                    checked={formik.values.enableIssues === "Yes"}
                    disabled={
                      organizationsState.organizations?.filter(
                        (org) => org.organizationId === formik.values.organizationId,
                      )[0]?.enableIssues === 0
                    }
                    onChange={(event) => {
                      formik.setFieldValue("enableIssues", event.target.checked ? "Yes" : "No");
                    }}
                  />
                }
                label="Enable Issues"
              />
              {formik.touched.enableIssues && formik.errors.enableIssues && (
                <FormHelperText>{formik.errors.enableIssues}</FormHelperText>
              )}
            </Grid>
            <Grid size={12}>
              <Tooltip
                title="Select a repository visibility type"
                arrow
                placement="left"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <Typography variant="body1" gutterBottom>
                  Repository Type
                </Typography>
              </Tooltip>
              {repoTypeRestriction && (
                <Alert severity="warning" variant="outlined" sx={{ mb: 1 }} aria-live="polite">
                  {repoTypeRestriction.message}{" "}
                  {repoTypeRestriction.type === "public" && formik.values.repoType !== "Public" && (
                    <Typography component="span">
                      Repository type has been set to <strong>Public</strong>.
                    </Typography>
                  )}
                  {repoTypeRestriction.type === "private" &&
                    formik.values.repoType !== "Private" && (
                      <Typography component="span">
                        Repository type has been set to <strong>Private</strong>.
                      </Typography>
                    )}
                </Alert>
              )}
              <RadioGroup
                row
                name="repoType"
                value={formik.values.repoType}
                onChange={formik.handleChange}
              >
                <FormControlLabel
                  sx={{ ml: 1 }}
                  value="Private"
                  control={<Radio />}
                  label="Private"
                  disabled={
                    organizationPlan === "Free" || formik.values.organizationVisibility === "Public"
                  }
                />
                <FormControlLabel
                  value="Public"
                  control={<Radio />}
                  label="Public"
                  disabled={formik.values.organizationVisibility === "Private"}
                />
              </RadioGroup>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small" variant="outlined">
                <Tooltip
                  title="Short description to add to the repository's ABOUT section in GitHub"
                  arrow
                  placement="bottom-start"
                  slotProps={{ popper: tooltipPopperProps }}
                >
                  <TextField
                    label="Description"
                    name="description"
                    value={formik.values.description}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    onChange={formik.handleChange}
                    multiline
                    minRows={1}
                    maxRows={5}
                    required
                    fullWidth
                    size="small"
                    sx={{
                      "& textarea": {
                        transition: "height 0.15s ease-in-out",
                        resize: "none",
                      },
                    }}
                    helperText={
                      formik.touched.description && formik.errors.description
                        ? `${formik.values.description.length}/${GITHUB_DESCRIPTION_MAX} characters. ${formik.errors.description}`
                        : `${formik.values.description.length}/${GITHUB_DESCRIPTION_MAX} characters`
                    }
                    error={formik.touched.description && !!formik.errors.description}
                  />
                </Tooltip>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Tooltip
                title="List topics to classify the repo depending on intended purpose, subject area, affinity groups, or other important qualities. ex: ballerina, api-management"
                arrow
                placement="bottom-start"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <Autocomplete
                  freeSolo
                  multiple
                  options={
                    Array.isArray(topicsState.topics)
                      ? topicsState.topics.map((topic) => topic.topicName)
                      : []
                  }
                  filterOptions={(options, params) => {
                    const filtered = options.filter(
                      (option) =>
                        option.toLowerCase().indexOf(params.inputValue.toLowerCase()) !== -1,
                    );
                    if (params.inputValue !== "" && !options.includes(params.inputValue)) {
                      filtered.push(params.inputValue);
                    }
                    return filtered;
                  }}
                  value={formik.values.topics ? formik.values.topics.split(",") : []}
                  onChange={(_, newValue) => {
                    formik.setFieldValue("topics", sanitizeTopics(newValue));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Topics"
                      variant="outlined"
                      size="small"
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text");
                        if (text.includes(",")) {
                          e.preventDefault();
                          const existing = formik.values.topics
                            ? formik.values.topics.split(",")
                            : [];
                          const merged = sanitizeTopics([...existing, ...text.split(",")]);
                          formik.setFieldValue("topics", merged);
                        }
                      }}
                      error={formik.touched.topics && !!formik.errors.topics}
                      helperText={formik.touched.topics && formik.errors.topics}
                      required
                    />
                  )}
                />
              </Tooltip>
            </Grid>
            <Grid size={12}>
              <Tooltip
                title="Provide a URL with more information about the repository to be added to the ABOUT section in GitHub."
                arrow
                placement="bottom-start"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <TextField
                  label="Website URL"
                  name="websiteUrl"
                  value={formik.values.websiteUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  size="small"
                  error={formik.touched.websiteUrl && !!formik.errors.websiteUrl}
                  helperText={formik.touched.websiteUrl && formik.errors.websiteUrl}
                />
              </Tooltip>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Tooltip
                title="Select Internal Committer Teams which require write access"
                arrow
                placement="bottom-start"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <Autocomplete
                  multiple
                  options={teamsState.teams || []}
                  value={formik.values.teams ? formik.values.teams.split(",") : []}
                  onChange={(_, newValue) => {
                    formik.setFieldValue("teams", newValue.join(","));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Give write access to"
                      variant="outlined"
                      size="small"
                      error={formik.touched.teams && !!formik.errors.teams}
                      helperText={formik.touched.teams && formik.errors.teams}
                      required
                    />
                  )}
                />
              </Tooltip>
            </Grid>

            {formik.values.repoType === "Private" && (
              <>
                <Grid size={12}>
                  <Tooltip
                    title="Select if triage access is required for all wso2 employees"
                    arrow
                    placement="left"
                    slotProps={{ popper: tooltipPopperProps }}
                  >
                    <Typography variant="body1" gutterBottom>
                      Enable triage access to wso2-all group
                    </Typography>
                  </Tooltip>
                  <RadioGroup
                    row
                    name="enableTriageWso2All"
                    value={formik.values.enableTriageWso2All}
                    sx={{ ml: 2 }}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
                <Grid size={12}>
                  <Tooltip
                    title="Select if triage access is required for all wso2 interns"
                    arrow
                    placement="left"
                    slotProps={{ popper: tooltipPopperProps }}
                  >
                    <Typography variant="body1" gutterBottom>
                      Enable triage access to wso2-all-interns group
                    </Typography>
                  </Tooltip>
                  <RadioGroup
                    row
                    name="enableTriageWso2AllInterns"
                    value={formik.values.enableTriageWso2AllInterns}
                    sx={{ ml: 2 }}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
                {(formik.values.enableTriageWso2All === "No" ||
                  formik.values.enableTriageWso2AllInterns === "No") && (
                  <Grid size={12}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <Tooltip
                        title="Please explain why we should NOT grant readonly access to all wso2 employees / interns. If NO is selected for either one of the above questions, please give reason for selections"
                        arrow
                        placement="bottom-start"
                        slotProps={{ popper: tooltipPopperProps }}
                      >
                        <TextField
                          label="Reason to select 'No' for any of the above options"
                          name="disableTriageReason"
                          value={formik.values.disableTriageReason}
                          onChange={formik.handleChange}
                          multiline
                          rows={3}
                          required
                          fullWidth
                          size="small"
                          error={
                            formik.touched.disableTriageReason &&
                            !!formik.errors.disableTriageReason
                          }
                          helperText={
                            formik.touched.disableTriageReason && formik.errors.disableTriageReason
                          }
                        />
                      </Tooltip>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        );
      case 3:
        if (!CICD_CONFIGURATION_ENABLE) {
          return (
            <Grid container spacing={2}>
              <Grid size={12}>
                <Alert severity="info">
                  CI/CD automation is <strong>coming soon</strong>. This step will be enabled once
                  the feature is available.
                </Alert>
              </Grid>
            </Grid>
          );
        }
        return (
          <Grid container spacing={2}>
            <Grid size={12}>
              <Tooltip
                title="Teams can opt for a Jenkins job to deploy to nexus or for an Azure pipeline to deploy to azure"
                arrow
                placement="bottom-start"
                slotProps={{ popper: tooltipPopperProps }}
              >
                <FormControl
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{ overflow: "visible" }}
                  error={formik.touched.cicdRequirement && !!formik.errors.cicdRequirement}
                  required
                >
                  <InputLabel sx={{ zIndex: 1 }}>CI/CD Configuration</InputLabel>
                  <Select
                    name="cicdRequirement"
                    value={formik.values.cicdRequirement}
                    onChange={formik.handleChange}
                    label="CI/CD Configuration"
                  >
                    <MenuItem value="Not Applicable">Not Applicable</MenuItem>
                    <MenuItem value="Jenkins">Jenkins</MenuItem>
                    <MenuItem value="Azure">Azure</MenuItem>
                  </Select>
                  {formik.touched.cicdRequirement && formik.errors.cicdRequirement && (
                    <FormHelperText>{formik.errors.cicdRequirement}</FormHelperText>
                  )}
                </FormControl>
              </Tooltip>
            </Grid>

            {formik.values.cicdRequirement === "Jenkins" && (
              <>
                <Grid size={12}>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Tooltip
                      title="State the type of configuration needed in the Jenkins job (product-*, carbon-*, identity-*, apim-*, esb-*, Other)"
                      arrow
                      placement="bottom-start"
                      slotProps={{ popper: tooltipPopperProps }}
                    >
                      <Autocomplete
                        freeSolo
                        clearOnEscape
                        options={[...new Set(JENKINS_JOB_TYPES)]}
                        filterOptions={(options, params) => {
                          const filtered = filter(options, params);
                          const { inputValue } = params;
                          if (inputValue !== "" && !options.includes(inputValue)) {
                            filtered.push(`Add "${inputValue}"`);
                          }
                          return filtered;
                        }}
                        value={formik.values.jenkinsJobType || ""}
                        inputValue={formik.values.jenkinsJobType || ""}
                        onInputChange={(_, newInputValue) => {
                          formik.setFieldValue("jenkinsJobType", newInputValue);
                        }}
                        onChange={(_, newValue) => {
                          let finalValue = newValue;
                          if (typeof newValue === "string" && newValue.startsWith('Add "')) {
                            finalValue = newValue.slice(5, -1);
                          }
                          formik.setFieldValue("jenkinsJobType", finalValue || "");
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Jenkins Job Type"
                            name="jenkinsJobType"
                            slotProps={{ inputLabel: { required: true } }}
                            fullWidth
                            size="small"
                            error={formik.touched.jenkinsJobType && !!formik.errors.jenkinsJobType}
                            helperText={
                              formik.touched.jenkinsJobType && formik.errors.jenkinsJobType
                            }
                          />
                        )}
                      />
                    </Tooltip>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Tooltip
                      title="Please state the group id if a public nexus staging target and staging profile is needed"
                      arrow
                      placement="bottom-start"
                      slotProps={{ popper: tooltipPopperProps }}
                    >
                      <TextField
                        label="Jenkins Group ID"
                        name="jenkinsGroupId"
                        value={formik.values.jenkinsGroupId}
                        onChange={formik.handleChange}
                        fullWidth
                        size="small"
                        error={formik.touched.jenkinsGroupId && !!formik.errors.jenkinsGroupId}
                        helperText={formik.touched.jenkinsGroupId && formik.errors.jenkinsGroupId}
                      />
                    </Tooltip>
                  </FormControl>
                </Grid>
              </>
            )}

            {formik.values.cicdRequirement === "Azure" && (
              <>
                <Grid size={12}>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Tooltip
                      title="To enable Azure pipelines app, then please state the DevOps Organization name in Azure"
                      arrow
                      placement="bottom-start"
                      slotProps={{ popper: tooltipPopperProps }}
                    >
                      <TextField
                        label="Azure DevOps Organization"
                        name="azureDevopsOrg"
                        value={formik.values.azureDevopsOrg}
                        onChange={formik.handleChange}
                        slotProps={{ inputLabel: { required: true } }}
                        fullWidth
                        size="small"
                        error={formik.touched.azureDevopsOrg && !!formik.errors.azureDevopsOrg}
                        helperText={formik.touched.azureDevopsOrg && formik.errors.azureDevopsOrg}
                      />
                    </Tooltip>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth size="small" variant="outlined">
                    <Tooltip
                      title="To enable Azure pipelines app, then please state the DevOps project name in Azure"
                      arrow
                      placement="bottom-start"
                      slotProps={{ popper: tooltipPopperProps }}
                    >
                      <TextField
                        label="Azure DevOps Project"
                        name="azureDevopsProject"
                        value={formik.values.azureDevopsProject}
                        onChange={formik.handleChange}
                        slotProps={{ inputLabel: { required: true } }}
                        fullWidth
                        size="small"
                        error={
                          formik.touched.azureDevopsProject && !!formik.errors.azureDevopsProject
                        }
                        helperText={
                          formik.touched.azureDevopsProject && formik.errors.azureDevopsProject
                        }
                      />
                    </Tooltip>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <BackgroundLoader
        open={
          teamsState.state === State.loading ||
          organizationsState.state === State.loading ||
          topicsState.state === State.loading ||
          repositoryRequestsState.state === State.loading
        }
        message={
          teamsState.errorMessage ||
          organizationsState.errorMessage ||
          topicsState.errorMessage ||
          repositoryRequestsState.errorMessage
        }
      />

      <Stepper activeStep={currentStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ mt: 3, mb: 3 }}>{renderStepContent(currentStep)}</Box>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            type="button"
            disabled={currentStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext} variant="contained">
              Next
            </Button>
          ) : (
            <Button type="submit" variant="contained" color="primary">
              {mode === "edit" ? "Update" : "Submit"}
            </Button>
          )}
        </Box>
      </form>
    </Box>
  );
}
