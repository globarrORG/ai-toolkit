import { readFileSync } from 'fs';
import { join } from 'path';

describe('PR title workflow regression checks', () => {
  const automatedPrActionPath = join(__dirname, '../actions/check-automated-pr/action.yml');
  const prTitleWorkflowPath = join(__dirname, '../workflows/ci-check-pr-title.yml');

<<<<<<< HEAD
  it('classifies copilot branches as automated PRs', () => {
    const action = readFileSync(automatedPrActionPath, 'utf-8');

    expect(action).toMatch(/elif \[\[ "\$BRANCH_NAME" == copilot\/\* \]\]; then/);
    expect(action).toContain('IS_AUTOMATED="true"');
    expect(action).toContain('CATEGORY="copilot"');
=======
  it('does not classify copilot branches as automated PRs in the shared detector', () => {
    const action = readFileSync(automatedPrActionPath, 'utf-8');

    expect(action).not.toMatch(/elif \[\[ "\$BRANCH_NAME" == copilot\/\* \]\]; then/);
    expect(action).not.toContain('CATEGORY="copilot"');
>>>>>>> origin/next
  });

  it('skips semantic title validation for copilot branches', () => {
    const workflow = readFileSync(prTitleWorkflowPath, 'utf-8');

    expect(workflow).toContain(
      'PR_HEAD_REF: ${{ github.head_ref || github.event.pull_request.head.ref }}'
    );
    expect(workflow).toContain('branch_name: ${{ env.PR_HEAD_REF }}');
<<<<<<< HEAD
    expect(workflow).toContain(
      "steps.check-automated.outputs.is_automated != 'true' && !startsWith(env.PR_HEAD_REF, 'copilot/')"
    );
    expect(workflow).toContain(
      "steps.check-automated.outputs.is_automated == 'true' || startsWith(env.PR_HEAD_REF, 'copilot/')"
    );
=======
    expect(workflow.replace(/\s+/g, ' ')).toContain(
      "steps.check-automated.outputs.is_automated != 'true' && !startsWith(env.PR_HEAD_REF, 'copilot/')"
    );
    expect(workflow.replace(/\s+/g, ' ')).toContain(
      "steps.check-automated.outputs.is_automated == 'true' || startsWith(env.PR_HEAD_REF, 'copilot/')"
    );
    expect(workflow).toContain(
      "SKIP_REASON: ${{ steps.check-automated.outputs.is_automated == 'true' && steps.check-automated.outputs.skip_reason || 'GitHub Copilot coding agent branch (copilot/* prefix); title is machine-generated from the task description' }}"
    );
>>>>>>> origin/next
  });
});
