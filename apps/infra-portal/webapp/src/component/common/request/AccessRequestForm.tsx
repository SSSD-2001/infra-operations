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
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useEffect, useMemo, useState } from "react";
import { ConfirmationType, State } from "@/types/types";
import BackgroundLoader from "@component/common/BackgroundLoader";
import { useConfirmationModalContext } from "@context";
import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";
import { AccessPermission, addAccessRequest } from "@slices/accessRequestSlice/accessRequest";
import { fetchEmployees } from "@slices/employeeSlice/employee";
import { fetchRepoTeamLeads } from "@slices/repoTeamLeadsSlice/repoTeamLeads";
import { fetchOrganizations } from "@slices/organizationsSlice/organizations";
import { fetchAccessRequests, AccessRequestState } from "@slices/accessRequestSlice/accessRequest";
import { fetchDefaultRepositoryAccess } from "@slices/githubOauthAppSlice/githubOauth";
import { fetchRepositoryRequests, RequestApprovalState } from "@slices/repositoryRequestSlice/repositoryRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { resolveGitHubConnectionStatus } from "@utils/githubOAuth";
import { repoNameValidation, sanitizeEmails, sanitizeRepoName } from "@utils/utils";
  
    const validationSchema = yup.object({
        leadEmail: yup
        .string()
        .trim()
        .required("Lead Email is required.")
        .email("Lead Email must be a valid email."),
        ccList: yup
        .string()
        .trim()
        .test("valid-emails", "All emails must be valid.", (value) => {
            if (!value) return true;
            return value
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean)
            .every((email) => yup.string().email().isValidSync(email));
        }),
        organizationId: yup
        .number()
        .typeError("Organization is required.")
        .moreThan(0, "Organization is required."),
        orgName: yup.string().trim().required("Organization is required."),
        repoName: repoNameValidation,
        permission: yup
        .string()
        .oneOf(["pull", "triage", "push"], "Permission is required.")
        .required("Permission is required."),
        justification: yup.string().trim().required("Justification is required."),
    });
    
    export default function AccessRequestForm() {
        const dispatch = useAppDispatch();
        const navigate = useNavigate();
        const dialogContext = useConfirmationModalContext();
    
        const jwtGithubUserId = useAppSelector((s) => s.auth.decodedIdToken?.githubUserId);
        const githubUsername = useAppSelector((s) => s.user.userInfo?.githubUsername);
        const defaultAccessStatus = useAppSelector((s) => s.githubConnect.defaultAccessStatus);
        const organizationsState = useAppSelector((s) => s.organizations);
        const employeesState = useAppSelector((state) => state.employee.employees);
        const repoTeamLeads = useAppSelector((s) => s.repoTeamLeads.repoTeamLeads) ?? [];
        const repoTeamLeadsState = useAppSelector((s) => s.repoTeamLeads.state);
        const submitState = useAppSelector((s) => s.accessRequest.submitState);
        const defaultAccessOrganizations = useAppSelector((s) => s.githubConnect.defaultAccessOrganizations);
        const accessRequests = useAppSelector((s) => s.accessRequest.accessRequests);
        const workEmail = useAppSelector((s) => s.user.userInfo?.workEmail);
        const creationRequests = useAppSelector((s) => s.repositoryRequest.repositoryRequests?.repositoryRequests) ?? [];
        const [orgRepos, setOrgRepos] = useState<string[]>([]);
        const [orgReposLoading, setOrgReposLoading] = useState(false);

        const { isConnected } = resolveGitHubConnectionStatus(null, {
            jwtGithubUserId,
            githubUsername,
        });
  
        useEffect(() => {
            dispatch(fetchOrganizations());
            dispatch(fetchRepoTeamLeads());
            dispatch(fetchEmployees());
            dispatch(fetchDefaultRepositoryAccess());
            dispatch(fetchAccessRequests());
            if (workEmail) {
                void dispatch(fetchRepositoryRequests({ memberEmail: workEmail, limit: 100, offset: 0 }));
              }
        }, [dispatch]);
  
    const formik = useFormik({
        initialValues: {
            leadEmail: "",
            ccList: "",
            organizationId: 0,
            orgName: "",
            repoName: "",
            permission: "pull" as AccessPermission,
            justification: "",
        },
        validationSchema,
        onSubmit: (values) => {
        const payload = {
            leadEmail: values.leadEmail.trim(),
            ccList: sanitizeEmails(values.ccList),
            organizationId: values.organizationId,
            orgName: values.orgName,
            repoName: sanitizeRepoName(values.repoName),
            permission: values.permission,
            justification: values.justification.trim(),
        };
  
        const permissionLabel =
        payload.permission === "pull"
            ? "Read"
            : payload.permission === "push"
            ? "Write"
            : "Triage";

            dialogContext.showConfirmation(
                "Confirm Access Request",
                (
            <>
            <Typography component="span" display="block" variant="body2">
                Submit access to{" "}
                <strong>
                {payload.orgName}/{payload.repoName}
                </strong>{" "}
                with <strong>{permissionLabel}</strong> permission?
            </Typography>
            <Typography component="span" display="block" variant="body2" sx={{ mt: 1 }}>
                You can track this request from My repository access.
            </Typography>
            </>
        ),
        ConfirmationType.accept,
        async () => {
            try {
            await dispatch(addAccessRequest(payload)).unwrap();
            formik.resetForm();
            navigate("/github/repository-access-requests");
            } catch {
            }
        },
        "Continue",
        "Cancel",
        );
      },
    })

    const alreadyHasAccessRepos = useMemo(() => {
        const orgName = formik.values.orgName;
        const names = new Set<string>();
        if (!orgName) return names;
      
        accessRequests
            .filter(
                (r) =>
                r.orgName === orgName &&
                (r.state === AccessRequestState.APPROVED || r.state === AccessRequestState.PENDING),
            )
            .forEach((r) => names.add(r.repoName));

        creationRequests
            .filter(
                (r) =>
                r.organizationName === orgName &&
                (r.state === RequestApprovalState.APPROVED || r.state === RequestApprovalState.PENDING),
            )
            .forEach((r) => names.add(r.repoName));
    
        defaultAccessOrganizations
            .find((org) => org.orgName === orgName)
            ?.repositories.forEach((repo) => names.add(repo.name));
      
        return names;
        }, [accessRequests, creationRequests, defaultAccessOrganizations, formik.values.orgName]);

    useEffect(() => {
        const organizationId = formik.values.organizationId;
        if (!organizationId) {
          setOrgRepos([]);
          return;
        }
        let cancelled = false;
        setOrgReposLoading(true);
        APIService.getInstance()
            .get(AppConfig.serviceUrls.githubOrgRepos(organizationId))
            .then((response) => {
                if (!cancelled) {
                setOrgRepos(
                    (response.data as { name: string }[]).map((repo) => repo.name),
                );
                }
            })
            .catch(() => {
                if (!cancelled) {
                setOrgRepos([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                setOrgReposLoading(false);
                }
            });
            return () => {
            cancelled = true;
            };
        }, [formik.values.organizationId]);
    ;
  
    if (!isConnected) {
      return (
        <Alert severity="info">
          Connect your GitHub account on the GitHub Integration page before requesting repository
          access.
        </Alert>
      );
    }
  
    if (defaultAccessStatus !== "granted") {
        return (
            <Alert
            severity="warning"
            >
            Default repository access must be granted before you can request access to an existing repo.
            </Alert>
        );
    }

    const orgLeads = Array.from(
        new Set(
            repoTeamLeads
                .filter((lead) => lead.organizationId === formik.values.organizationId && lead.leadEmail)
                .map((lead) => lead.leadEmail as string),
        ),
    );

    return (
        <Box component="form" onSubmit={formik.handleSubmit}>
            {submitState === State.loading && (
                <BackgroundLoader open message="Submitting access request..." />
            )}
        <FormControl
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            error={formik.touched.organizationId && !!formik.errors.organizationId}
        >
            <InputLabel>Organization</InputLabel>
            <Select
                label="Organization"
                name="organizationId"
                value={formik.values.organizationId || ""}
                onChange={(event) => {
                const selectedId = Number(event.target.value);
                const selectedOrg = (organizationsState.organizations ?? []).find(
                    (org) => org.organizationId === selectedId,
                );
                    formik.setFieldValue("organizationId", selectedId);
                    formik.setFieldValue("orgName", selectedOrg?.organizationName || "");
                    formik.setFieldValue("repoName", "");
                    formik.setFieldValue("leadEmail", "");
                }}
            >
                {organizationsState.state === State.loading ? (
                <MenuItem disabled>Loading...</MenuItem>
                ) : (organizationsState.organizations ?? []).length > 0 ? (
                organizationsState.organizations!.map((org) => (
                    <MenuItem key={org.organizationId} value={org.organizationId}>
                    {org.organizationName}
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
  
        <Autocomplete
            options={orgRepos}
            loading={orgReposLoading}
            disabled={!formik.values.organizationId}
            value={formik.values.repoName || null}
            getOptionDisabled={(option) => alreadyHasAccessRepos.has(option)}
            onChange={(_, value) => {
            if (value && alreadyHasAccessRepos.has(value)) return;
            formik.setFieldValue("repoName", value ?? "");
            }}
            onBlur={() => formik.setFieldTouched("repoName", true)}
            renderInput={(params) => (
                <TextField
                {...params}
                size="small"
                sx={{ mb: 2 }}
                label="Repository name"
                error={formik.touched.repoName && !!formik.errors.repoName}
                helperText={
                    (formik.touched.repoName && formik.errors.repoName) ||
                    (!formik.values.organizationId
                    ? "Select an organization first"
                    : "Type to search repositories in this org")
                }
                />
            )}
        />
  
        <FormControl component="fieldset" sx={{ mb: 2 }} error={!!formik.errors.permission}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
                Permission
            </Typography>
            <RadioGroup
                row
                name="permission"
                value={formik.values.permission}
                onChange={formik.handleChange}
            >
                <FormControlLabel value="pull" control={<Radio size="small" />} label="Read" />
                <FormControlLabel value="triage" control={<Radio size="small" />} label="Triage" />
                <FormControlLabel value="push" control={<Radio size="small" />} label="Write" />
            </RadioGroup>
        </FormControl>
  
        <TextField
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                label="Justification"
                name="justification"
                multiline
                minRows={3}
                value={formik.values.justification}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.justification && !!formik.errors.justification}
                helperText={formik.touched.justification && formik.errors.justification}
        />
        <FormControl
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            error={formik.touched.leadEmail && !!formik.errors.leadEmail}
        >
            <InputLabel>Lead Email</InputLabel>
            <Select
                label="Lead Email"
                name="leadEmail"
                value={formik.values.leadEmail}
                onChange={formik.handleChange}
                disabled={repoTeamLeadsState === State.loading || !formik.values.organizationId}
            >
                {repoTeamLeadsState === State.loading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                ) : !formik.values.organizationId ? (
                    <MenuItem disabled>Select an organization first</MenuItem>
                ) : orgLeads.length > 0 ? (
                    orgLeads.map((email) => (
                        <MenuItem key={email} value={email}>
                            {email}
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
  
        <Autocomplete
            multiple
            freeSolo
            options={
                Array.isArray(employeesState)
                ? employeesState.map((employee) => employee.workEmail)
                : []
            }
            filterOptions={(options, params) => {
                const filtered = options.filter((option) =>
                option.toLowerCase().includes(params.inputValue.toLowerCase()),
                );
                if (params.inputValue !== "" && !options.includes(params.inputValue)) {
                filtered.push(params.inputValue);
                }
                return filtered;
            }}
            value={
                formik.values.ccList
                ? formik.values.ccList.split(",").map((email) => email.trim()).filter(Boolean)
                : []
            }
            onChange={(_, newValue) => {
                const unique = Array.from(new Set(newValue.map((email) => email.trim()).filter(Boolean)));
                formik.setFieldValue("ccList", unique.join(","));
            }}
            renderInput={(params) => (
                <TextField
                {...params}
                size="small"
                sx={{ mb: 3 }}
                label="CC list (optional)"
                error={formik.touched.ccList && !!formik.errors.ccList}
                helperText={
                    (formik.touched.ccList && formik.errors.ccList) ||
                    "Select employees or type an email"
                }
                />
            )}
        />
  
        <Button type="submit" variant="contained" disabled={submitState === State.loading}>
            Submit request
        </Button>
      </Box>
    );
  }