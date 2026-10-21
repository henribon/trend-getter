const TOKEN_LIFETIME_DAYS = '90';
const MAX_TOKEN_NAME_LENGTH = 40;

export function buildGithubLinks({ serverUrl, apiUrl, repository, branch, workflowFile, configFile }) {
  const repositoryUrl = `${serverUrl}/${repository}`;
  const [owner, name] = repository.split('/');
  const tokenTemplate = new URLSearchParams({
    name: `Trend Getter - ${name}`.slice(0, MAX_TOKEN_NAME_LENGTH),
    description: `Permite que o site ${repository} inicie a busca de trends.`,
    target_name: owner,
    expires_in: TOKEN_LIFETIME_DAYS,
    actions: 'write',
  });
  return {
    repository: repositoryUrl,
    runWorkflow: `${repositoryUrl}/actions/workflows/${workflowFile}`,
    editConfig: `${repositoryUrl}/edit/${branch}/${configFile}`,
    createConfig: `${repositoryUrl}/new/${branch}?filename=${encodeURIComponent(configFile)}`,
    createToken: `${serverUrl}/settings/personal-access-tokens/new?${tokenTemplate}`,
    dispatch: { url: `${apiUrl}/repos/${repository}/actions/workflows/${workflowFile}/dispatches`, ref: branch },
  };
}
