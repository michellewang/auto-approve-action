import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

export async function run() {
  try {
    const token = core.getInput("github-token");
    const reviewMessage = core.getInput("review-message");
    const { prNumber, owner, repo } = getInputs();
    await approve(
      token,
      github.context,
      owner,
      repo,
      prNumber,
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

function getInputs(): { prNumber: number; owner: string; repo: string } {
  const prNumber = getPrNumber();
  var repository = core.getInput("repository");
  if (repository !== "") {
    if (core.getInput("pull-request-number") == "") {
      throw new Error(
        "pull-request-number must be specified with repository input"
      );
    }
    var { owner, repo } = parseRepository(repository);
    return { prNumber: prNumber, owner: owner, repo: repo };
  } else {
    return {
      prNumber: prNumber,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };
  }
}

function parseRepository(repository: string): { owner: string; repo: string } {
  const splitRepository = repository.split("/");
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${repository}'. Expected format {owner}/{repo}.`
    );
  }
  return { owner: splitRepository[0], repo: splitRepository[1] };
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
