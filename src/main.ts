import * as core from "@actions/core";
import * as github from "@actions/github";
import { approve } from "./approve";

export async function run() {
  try {
    const token = core.getInput("github-token");
    const reviewMessage = core.getInput("review-message");
    await approve(
      token,
      github.context,
      prNumber(),
      getRepository(),
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

function getRepository(): { owner: string, repo: string } {

  // modified from https://github.com/actions/checkout/blob/24cb9080177205b6e8c946b17badbe402adc938f/src/input-helper.ts#L21
  const qualifiedRepository =
    core.getInput('repository') ||
    `${github.context.repo.owner}/${github.context.repo.repo}`
  core.debug(`qualified repository = '${qualifiedRepository}'`)

  const splitRepository = qualifiedRepository.split('/')
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${qualifiedRepository}'. Expected format {owner}/{repo}.`
    )
  }
  return { owner: splitRepository[0], repo:  splitRepository[1] };
}

function prNumber(): number {
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
