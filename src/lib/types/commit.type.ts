export interface Commit {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
}
