import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { GitHub as GitHubIcon } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Box,
    CircularProgress,
    Link,
    Typography,
    useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
    fetchDefaultRepositoryAccess,
    setDefaultRepositoryAccess,
  } from "@slices/githubOauthAppSlice/githubOauth";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { State } from "@root/src/types/types";
import { resolveGitHubConnectionStatus } from "@utils/githubOAuth";

const POLL_MS = 3000;

export default function DefaultRepositoryAccessSection() {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const jwtGithubUserId = useAppSelector((s) => s.auth.decodedIdToken?.githubUserId);
    const githubUsername = useAppSelector((s) => s.user.userInfo?.githubUsername);
    const status = useAppSelector((s) => s.githubConnect.defaultAccessStatus);
    const organizations = useAppSelector((s) => s.githubConnect.defaultAccessOrganizations);
    const fetchState = useAppSelector((s) => s.githubConnect.defaultAccessFetchState);
    const defaultAccessState = useAppSelector((s) => s.githubConnect.defaultAccessState);
    const grantAttemptedRef = useRef(false);
    const [expandedOrg, setExpandedOrg] = useState<string | false>(false);

    const handleChange =
        (orgName: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpandedOrg(isExpanded ? orgName : false);
        };

    const { isConnected } = resolveGitHubConnectionStatus(null, {
        jwtGithubUserId,
        githubUsername,
    });

    useEffect(() => {
        if (!isConnected) return;
        if (fetchState !== State.success) return;
        if (status !== "not_granted") return;
        if (defaultAccessState === State.loading) return;
        if (grantAttemptedRef.current) return;
      
        grantAttemptedRef.current = true;
      
        void dispatch(setDefaultRepositoryAccess()).then((result) => {
          if (setDefaultRepositoryAccess.fulfilled.match(result)) {
            void dispatch(fetchDefaultRepositoryAccess());
          }
        });
      }, [isConnected, status, defaultAccessState, dispatch]);

    useEffect(() => {
        if (!isConnected) return;
        if (status === "granted" && organizations.length > 0) return;
        if (status === "granting" || defaultAccessState === State.loading) return;
        void dispatch(fetchDefaultRepositoryAccess());
    }, [isConnected, dispatch, status, organizations.length, defaultAccessState]);

    useEffect(() => {
        if (!isConnected || status !== "granting") return;
        if (fetchState === State.loading) return;

        const id = window.setInterval(() => {
            void dispatch(fetchDefaultRepositoryAccess());
        }, POLL_MS);
        return () => window.clearInterval(id);
    }, [isConnected, status, fetchState, dispatch]);

    if (!isConnected) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect with GitHub from the home page to see default repository access.
            </Typography>
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

    if (status === "not_granted") {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Default repository access has not been granted yet.
            </Typography>
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
            {organizations.map((org) => (
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
                            sx={{ width: 28, height: 28, borderRadius: "7px", flexShrink: 0 }}
                        >
                            <GitHubIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography
                            component="span"
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 13,
                                fontWeight: 500,
                                color: theme.palette.customText.primary.p1.active,
                            }}
                        >
                            {org.orgName}
                        </Typography>
                        <Typography
                            component="span"
                            sx={{
                                fontSize: 11,
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
                                sx={{ fontSize: 12, color: theme.palette.customText.primary.p3.active }}
                            >
                                No repositories available for this organization yet.
                            </Typography>
                        ) : (
                            org.repositories.map((repo) => (
                                <Typography key={repo.name} component="div" sx={{ py: 0.5, pl: 5.5 }}>
                                    <Link
                                        href={repo.htmlUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{
                                            fontSize: 12,
                                            fontWeight: 600,
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
        </Box>
    );
}
