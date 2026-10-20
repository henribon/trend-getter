export function buildGithubLinks({ serverUrl, repository, branch, workflowFile, configFile }) {
  const repositoryUrl = `${serverUrl}/${repository}`;
  return {
    repository: repositoryUrl,
    runWorkflow: `${repositoryUrl}/actions/workflows/${workflowFile}`,
    editConfig: `${repositoryUrl}/edit/${branch}/${configFile}`,
    createConfig: `${repositoryUrl}/new/${branch}?filename=${encodeURIComponent(configFile)}`,
  };
}
