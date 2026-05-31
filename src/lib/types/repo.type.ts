export interface RepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
  private: boolean;
  html_url: string;
}
