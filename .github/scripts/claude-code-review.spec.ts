import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

type WorkflowStep = {
  name?: string;
  id?: string;
  if?: string;
  run?: string;
  [key: string]: unknown;
};

type WorkflowDocument = {
  jobs: {
    triage: {
      steps: WorkflowStep[];
    };
  };
};

type ActionDocument = {
  runs: {
    steps: WorkflowStep[];
  };
};

describe('Claude Code Review workflow regression checks', () => {
  const installActionPath = join(__dirname, '../actions/install_review_cli/action.yml');
  const reviewWorkflowPath = join(__dirname, '../workflows/claude-code-review.yml');

  const readYaml = <T>(path: string): T => parse(readFileSync(path, 'utf-8')) as T;

  it('keeps triage green when review-cli installation is unavailable', () => {
    const workflow = readYaml<WorkflowDocument>(reviewWorkflowPath);
    const steps = workflow.jobs.triage.steps;
    const installStep = steps.find((step) => step.id === 'install-review-cli');
    const noteUnavailableStep = steps.find(
      (step) => step.name === 'Note that review-cli install failed'
    );

    expect(installStep).toBeDefined();
    expect(installStep?.if).toBe("env.HAS_REVIEW_CLI_TOKEN == 'true'");
    expect(installStep?.['continue-on-error']).toBe(true);
    expect(installStep?.uses).toBe('./.review-tooling/.github/actions/install_review_cli');

    expect(noteUnavailableStep).toBeDefined();
    expect(noteUnavailableStep?.if).toContain("env.HAS_REVIEW_CLI_TOKEN == 'true'");
    expect(noteUnavailableStep?.if).toContain("steps.install-review-cli.outcome != 'success'");
  });

  it('treats GitHub Packages access failures as a skip in the installer action', () => {
    const action = readYaml<ActionDocument>(installActionPath);
    const installStep = action.runs.steps.find((step) => step.id === 'install');
    const script = installStep?.run ?? '';

    expect(installStep).toBeDefined();
    expect(script).toContain('bun_add_log="$install_dir/bun-add.log"');
    expect(script).toContain(
      'if bun add "@uniswap/review-cli@${REVIEW_CLI_VERSION}" 2>&1 | tee "$bun_add_log"; then'
    );
    expect(script).toContain('package_dir="$install_dir/node_modules/@uniswap/review-cli"');
    expect(script).toContain('bin_path="$install_dir/node_modules/.bin/review-cli"');
    expect(script).toMatch(
      /else[\s\S]*grep -Eq 'error: GET https:\/\/npm\\.pkg\\.github\\.com\/@uniswap%2freview-cli - 40\[13\]' "\$bun_add_log"[\s\S]*echo "::warning::Unable to access @uniswap\/review-cli from GitHub Packages; continuing without AI review\."[\s\S]*exit 0[\s\S]*echo "::error::Unable to access @uniswap\/review-cli from GitHub Packages\."[\s\S]*exit 1[\s\S]*fi/
    );
    expect(script).toMatch(
      /if \[ ! -d "\$package_dir" \]; then[\s\S]*grep -Eq 'error: GET https:\/\/npm\\.pkg\\.github\\.com\/@uniswap%2freview-cli - 40\[13\]' "\$bun_add_log"[\s\S]*echo "::warning::Unable to access @uniswap\/review-cli from GitHub Packages; continuing without AI review\."[\s\S]*exit 0[\s\S]*echo "::error::Unable to access @uniswap\/review-cli from GitHub Packages\."[\s\S]*exit 1[\s\S]*fi/
    );
    expect(script).toMatch(
      /if grep -Eq 'error: GET https:\/\/npm\\.pkg\\.github\\.com\/@uniswap%2freview-cli - 40\[13\]' "\$bun_add_log"; then[\s\S]*echo "::warning::Unable to access @uniswap\/review-cli from GitHub Packages; continuing without AI review\."[\s\S]*exit 0[\s\S]*fi/
    );
    expect(script).toMatch(
      /if \[ ! -x "\$bin_path" \]; then[\s\S]*echo "::error::bun add installed \$package_dir but \$bin_path is missing or not executable"[\s\S]*exit 1/
    );
    expect(script).toContain(
      'echo "::error::bun add installed $package_dir but $bin_path is missing or not executable"'
    );
  });
});
