import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { GitHub as GitHubIcon } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Link,
    Typography,
    alpha,
    useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { fetchDefaultRepositoryAccess,setDefaultRepositoryAccess } from "@slices/githubOauthAppSlice/githubOauth";
import { fetchAccessRequests, AccessRequestState } from "@slices/accessRequestSlice/accessRequest";
import { fetchRepositoryRequests, RequestApprovalState } from "@slices/repositoryRequestSlice/repositoryRequest";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { State } from "@/types/types";
import { resolveGitHubConnectionStatus } from "@utils/githubOAuth";

const POLL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export default function DefaultRepositoryAccessSection() {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const jwtGithubUserId = useAppSelector((s) => s.auth.decodedIdToken?.githubUserId);
    const githubUsername = useAppSelector((s) => s.user.userInfo?.githubUsername);
    const status = useAppSelector((s) => s.githubConnect.defaultAccessStatus);
    const organizations = useAppSelector((s) => s.githubConnect.defaultAccessOrganizations);
    const fetchState = useAppSelector((s) => s.githubConnect.defaultAccessFetchState);
    const defaultAccessState = useAppSelector((s) => s.githubConnect.defaultAccessState);
    const fetchErrorMessage = useAppSelector((s) => s.githubConnect.defaultAccessErrorMessage);
    const grantAttemptedRef = useRef(false);
    const pollAttemptsRef = useRef(0);
    const pollInFlightRef = useRef(false);
    const [pollTimedOut, setPollTimedOut] = useState(false);
    const [expandedOrg, setExpandedOrg] = useState<string | false>(false);
    const accessRequests = useAppSelector((s) => s.accessRequest.accessRequests);
    const workEmail = useAppSelector((s) => s.user.userInfo?.workEmail);
    const creationRequests = useAppSelector((s) => s.repositoryRequest.repositoryRequests?.repositoryRequests) ?? [];
    const defaultOrgNames = new Set(organizations.map((o) => o.orgName));

    const { isConnected } = resolveGitHubConnectionStatus(null, {
        jwtGithubUserId,
        githubUsername,
    });

    useEffect(() => {
        if (!isConnected || !workEmail) return;
        void dispatch(fetchAccessRequests());
        void dispatch(
          fetchRepositoryRequests({
            memberEmail: workEmail,
            limit: 100,
            offset: 0,
          }),
        );
    }, [isConnected, workEmail, dispatch]);

    const handleChange =
        (orgName: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpandedOrg(isExpanded ? orgName : false);
        };

    const [grantFailed, setGrantFailed] = useState(false);

    const approvedAccessByOrg = new Map<string, { name: string; htmlUrl: string }[]>();
    accessRequests
    .filter((r) => r.state === AccessRequestState.APPROVED)
    .forEach((r) => {
        const list = approvedAccessByOrg.get(r.orgName) ?? [];
        if (!list.some((repo) => repo.name === r.repoName)) {
        list.push({
            name: r.repoName,
            htmlUrl: `https://github.com/${r.orgName}/${r.repoName}`,
        });
        }
        approvedAccessByOrg.set(r.orgName, list);
    });

    creationRequests
        .filter((r) => r.state === RequestApprovalState.APPROVED)
        .forEach((r) => {
            const list = approvedAccessByOrg.get(r.organizationName) ?? [];
            if (!list.some((repo) => repo.name === r.repoName)) {
            list.push({
                name: r.repoName,
                htmlUrl: `https://github.com/${r.organizationName}/${r.repoName}`,
            });
            }
            approvedAccessByOrg.set(r.organizationName, list);
        });

    const overviewOrgs = organizations;

    const defaultReposByOrg = new Map(
        organizations.map((org) => [org.orgName, new Set(org.repositories.map((r) => r.name))]),
      );
      
    const extraOrgs = [...approvedAccessByOrg.entries()]
        .map(([orgName, repos]) => ({
          orgName,
          avatarUrl: organizations.find((o) => o.orgName === orgName)?.avatarUrl ?? "",
          repositories: repos.filter((repo) => !defaultReposByOrg.get(orgName)?.has(repo.name)),
        }))
        .filter((org) => org.repositories.length > 0);

    useEffect(() => {
        if (!isConnected) return;
        if (fetchState !== State.success) return;
        if (status !== "not_granted" && status !== "granting") return;
        if (defaultAccessState === State.loading) return;
        if (grantAttemptedRef.current) return;

        grantAttemptedRef.current = true;

        void dispatch(setDefaultRepositoryAccess()).then((result) => {
        if (setDefaultRepositoryAccess.fulfilled.match(result)) {
            setGrantFailed(false);
            void dispatch(fetchDefaultRepositoryAccess());
        } else {
            setGrantFailed(true);
        }
        });
    }, [isConnected, status, fetchState, defaultAccessState, dispatch]);
    
    useEffect(() => {
        if (!isConnected) return;
        if (status === "granted" && organizations.length > 0) return;
        if (status === "granting" || defaultAccessState === State.loading) return;
        void dispatch(fetchDefaultRepositoryAccess());
    }, [isConnected, dispatch, status, organizations.length, defaultAccessState]);

    useEffect(() => {
        if (!isConnected || status !== "granting") {
            pollAttemptsRef.current = 0;
            setPollTimedOut(false);
            return;
        }
        if (pollTimedOut) return;

        const id = window.setInterval(() => {
            if (pollInFlightRef.current) return;
            if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
                setPollTimedOut(true);
                window.clearInterval(id);
                return;
            }
            pollAttemptsRef.current += 1;
            pollInFlightRef.current = true;
            void dispatch(fetchDefaultRepositoryAccess()).finally(() => {
                pollInFlightRef.current = false;
            });
        }, POLL_MS);
        return () => window.clearInterval(id);
    }, [isConnected, status, pollTimedOut, dispatch]);

    if (!isConnected) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect with GitHub from the home page to see default repository access.
            </Typography>
        );
    }

    if (pollTimedOut && status === "granting") {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="error.main">
                    Granting default repository access is taking longer than expected.
                </Typography>
                <Button
                    size="small"
                    onClick={() => {
                        pollAttemptsRef.current = 0;
                        setPollTimedOut(false);
                        void dispatch(fetchDefaultRepositoryAccess());
                    }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (status === "granting" || defaultAccessState === State.loading) {
        return (
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
            Granting default repository access...
            </Typography>
        </Box>
        );
    }
    
    if (
        status === undefined &&
        (fetchState === State.idle || fetchState === State.loading)
    ) {
        return (
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
            Checking default repository access...
            </Typography>
        </Box>
        );
    }

    if (fetchState === State.failed) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="error.main">
                    {fetchErrorMessage || "Unable to load default repository access."}
                </Typography>
                <Button size="small" onClick={() => void dispatch(fetchDefaultRepositoryAccess())}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (status === "not_granted") {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color={grantFailed ? "error.main" : "text.secondary"}>
                    {grantFailed
                        ? "Failed to grant default repository access."
                        : "Default repository access has not been granted yet."}
                </Typography>
                {grantFailed && (
                    <Button
                        size="small"
                        onClick={() => {
                            setGrantFailed(false);
                            void dispatch(setDefaultRepositoryAccess()).then((result) => {
                                if (setDefaultRepositoryAccess.fulfilled.match(result)) {
                                    void dispatch(fetchDefaultRepositoryAccess());
                                } else {
                                    setGrantFailed(true);
                                }
                            });
                        }}
                    >
                        Retry
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                mb: 4,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "14px",
                overflow: "hidden",
            }}
        >
            {overviewOrgs.map((org) => (
                <Accordion
                    key={org.orgName}
                    expanded={expandedOrg === org.orgName}
                    onChange={handleChange(org.orgName)}
                    disableGutters
                    sx={{
                        background: "transparent",
                        boxShadow: "none",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:before": { display: "none" },
                        "&:last-of-type": { borderBottom: "none" },
                        "&.Mui-expanded": { margin: 0 },
                    }}
                >
                    <AccordionSummary
                        expandIcon={
                            <ExpandMoreIcon
                                sx={{ color: theme.palette.customText.primary.p3.active, fontSize: 20 }}
                            />
                        }
                        aria-controls={`${org.orgName}-content`}
                        id={`${org.orgName}-header`}
                        sx={{
                            px: 2.25,
                            py: 0.5,
                            minHeight: 0,
                            "&:hover": { background: theme.palette.action.hover },
                            "& .MuiAccordionSummary-content": {
                                alignItems: "center",
                                my: 1.5,
                                gap: 1.5,
                            },
                        }}
                    >
                        <Avatar
                            src={org.avatarUrl}
                            alt={org.orgName}
                            sx={{ width: 18, height: 18, borderRadius: "4px", flexShrink: 0 }}
                        >
                            <GitHubIcon sx={{ fontSize: 11 }} />
                        </Avatar>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                variant="body2"
                                component="span"
                                noWrap
                                sx={{ color: theme.palette.customText.primary.p1.active }}
                            >
                                {org.orgName}
                            </Typography>
                            {defaultOrgNames.has(org.orgName) && (
                                <Chip
                                    label="Default"
                                    size="small"
                                    sx={{
                                        height: "18px",
                                        borderRadius: "15px",
                                        fontSize: 10,
                                        fontWeight: 500,
                                        fontFamily: "monospace",
                                        background: alpha(theme.palette.neutral["1200"] ?? theme.palette.grey[600], 0.12),
                                        color: theme.palette.customText.primary.p3.active,
                                        border: `1px solid ${alpha(theme.palette.grey[500], 0.35)}`,
                                        flexShrink: 0,
                                        "& .MuiChip-label": {
                                            px: 1.25,
                                            py: 0.5,
                                        },
                                    }}
                                />
                            )}
                        </Box>
                        <Typography
                            variant="body2"
                            component="span"
                            sx={{
                                color: theme.palette.customText.primary.p3.active,
                                flexShrink: 0,
                                mr: 1,
                            }}
                        >
                            {org.repositories.length} connected{" "}
                            {org.repositories.length === 1 ? "repository" : "repositories"}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2.25, pt: 0, pb: 1.5 }}>
                        {org.repositories.length === 0 ? (
                            <Typography
                                variant="body2"
                                sx={{ color: theme.palette.customText.primary.p3.active }}
                            >
                                No repositories available for this organization yet.
                            </Typography>
                        ) : (
                            org.repositories.map((repo) => (
                                <Typography key={repo.name} variant="body2" component="div" sx={{ py: 0.5, pl: 5.5 }}>
                                    <Link
                                        href={repo.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{
                                            color: theme.palette.customText.primary.p1.active,
                                            "&:hover": { color: theme.palette.primary.main },
                                        }}
                                    >
                                        {repo.name}
                                    </Link>
                                </Typography>
                            ))
                        )}
                    </AccordionDetails>
                </Accordion>
            ))}
            {extraOrgs.map((org) => (
                <Accordion
                    key={`extra-${org.orgName}`}
                    expanded={expandedOrg === `extra-${org.orgName}`}
                    onChange={handleChange(`extra-${org.orgName}`)}
                    disableGutters
                    sx={{
                        background: "transparent",
                        boxShadow: "none",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:before": { display: "none" },
                        "&:last-of-type": { borderBottom: "none" },
                        "&.Mui-expanded": { margin: 0 },
                    }}
                >
                    <AccordionSummary
                        expandIcon={
                            <ExpandMoreIcon
                                sx={{ color: theme.palette.customText.primary.p3.active, fontSize: 20 }}
                            />
                        }
                        aria-controls={`extra-${org.orgName}-content`}
                        id={`extra-${org.orgName}-header`}
                        sx={{
                            px: 2.25,
                            py: 0.5,
                            minHeight: 0,
                            "&:hover": { background: theme.palette.action.hover },
                            "& .MuiAccordionSummary-content": {
                                alignItems: "center",
                                my: 1.5,
                                gap: 1.5,
                            },
                        }}
                    >
                        <Avatar
                            src={org.avatarUrl}
                            alt={org.orgName}
                            sx={{ width: 18, height: 18, borderRadius: "4px", flexShrink: 0 }}
                        >
                            <GitHubIcon sx={{ fontSize: 11 }} />
                        </Avatar>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                variant="body2"
                                component="span"
                                noWrap
                                sx={{ color: theme.palette.customText.primary.p1.active }}
                            >
                                {org.orgName}
                            </Typography>
                            <Chip
                                label="Request"
                                size="small"
                                sx={{
                                    height: "18px",
                                    borderRadius: "15px",
                                    fontSize: 10,
                                    fontWeight: 500,
                                    fontFamily: "monospace",
                                    background: alpha(theme.palette.neutral["1200"] ?? theme.palette.grey[600], 0.12),
                                    color: theme.palette.customText.primary.p3.active,
                                    border: `1px solid ${alpha(theme.palette.grey[500], 0.35)}`,
                                    flexShrink: 0,
                                    "& .MuiChip-label": {
                                        px: 1.25,
                                        py: 0.5,
                                    },
                                }}
                            />
                        </Box>
                        <Typography
                            variant="body2"
                            component="span"
                            sx={{
                                color: theme.palette.customText.primary.p3.active,
                                flexShrink: 0,
                                mr: 1,
                            }}
                        >
                            {org.repositories.length} connected{" "}
                            {org.repositories.length === 1 ? "repository" : "repositories"}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2.25, pt: 0, pb: 1.5 }}>
                        {org.repositories.map((repo) => (
                            <Typography key={repo.name} variant="body2" component="div" sx={{ py: 0.5, pl: 5.5 }}>
                                <Link
                                    href={repo.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    underline="hover"
                                    sx={{
                                        color: theme.palette.customText.primary.p1.active,
                                        "&:hover": { color: theme.palette.primary.main },
                                    }}
                                >
                                    {repo.name}
                                </Link>
                            </Typography>
                        ))}
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}
