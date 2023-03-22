import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

export async function run() {
  try {
    const token = core.getInput("github-token");
    const reviewMessage = core.getInput("review-message");
    const { prNumber, repository } = getInputs();
    await approve(
      token,
      github.context,
      prNumber,
      repository,
      reviewMessage || undefined
    );
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error");
    }
  }
}

function getInputs(): { prNumber: number, repository: { owner: string, repo: string } } {
  var qualifiedRepository = core.getInput('repository');
  if (qualifiedRepository) {
    if (core.getInput("pull-request-number") !== "") {
      throw new Error("pull-request-number must be specified with repository input")
    }
  } else {
    qualifiedRepository = `${github.context.repo.owner}/${github.context.repo.repo}`;
  }

  const splitRepository = qualifiedRepository.split('/');
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${qualifiedRepository}'. Expected format {owner}/{repo}.`
    )
  }
  const repository = { owner: splitRepository[0], repo:  splitRepository[1] };
  return { prNumber: getPrNumber(), repository: repository };
}

function getPrNumber(): number {
  if (core.getInput("pull-request-number") !== "") {
    const prNumber = parseInt(core.getInput("pull-request-number"), 10);
    if (Number.isNaN(prNumber)) {
      throw new Error("Invalid `pull-request-number` value");
    }
    return prNumber;
  }

  if (!github.context.payload.pull_request) {
    throw new Error(
      "This action must be run using a `pull_request` event or " +
        "have an explicit `pull-request-number` provided"
    );
  }
  return github.context.payload.pull_request.number;
}

if (require.main === module) {
  run();
}
