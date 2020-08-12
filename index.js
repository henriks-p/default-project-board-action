const core = require("@actions/core");
const fetch = require("node-fetch");

async function github_query(github_token, query, variables) {
  return fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `bearer ${github_token}`
    }
  }).then(function(response) {
    return response.json();
  });
}

async function run() {
  try {
    const issue = core.getInput("issue");
    const repository = core.getInput("repository");
    const project_id = core.getInput("project");
    const github_token = core.getInput("github_token");
    const owner = repository.split("/")[0];
    const name = repository.split("/")[1];

    console.log(JSON.stringify({
      issue, repository, project_id
    }));

    const get_issue_id = `
    query($owner:String!, $name:String!, $number:Int!){
      repository(owner: $owner, name: $name) {
        issue(number:$number) {
          id
        }
      }
    }`;
    const issue_vars = {
      owner,
      name,
      number: issue
    };

    const issue_resp = await github_query(
      github_token,
      get_issue_id,
      issue_vars
    );
    console.dir(issue_resp, { depth: null });
    const issue_id = issue_resp["data"]["repository"]["issue"]["id"];

    console.log(`Adding issue ${issue} to project ${project_id}`);

    query = `
    mutation($issueId:ID!, $projectId:ID!) {
      updateIssue(input:{id:$issueId, projectIds:[$projectId]}) {
        issue {
          id
        }
      }
    }`;
    variables = { issueId: issue_id, projectId: project_id };

    response = await github_query(github_token, query, variables);
    console.log(response);
    console.log(`Done!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
