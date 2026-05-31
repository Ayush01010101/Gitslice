import { CommitInfo } from "./CommitInfo";
export interface RepoInfoBarProps {
  owner: string;
  reponame: string;
  description?: string;
  stars?: number;
  forks?: number;
  defaultBranch?: string;
  isPrivate?: boolean;
  currentCommit?: CommitInfo;
  onDownloadZip?: () => void;
  loading?: boolean;
}
