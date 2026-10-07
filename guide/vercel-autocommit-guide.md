# Universal Guide: Automate Vercel Deployments on Collaborator Pushes (Hobby Plan Fix)

> **A foolproof, copy-paste engineering guide to bypass Vercel Hobby plan collaborator deployment restrictions using GitHub Actions auto-commit dispatch.**

---

## 1. Problem Overview

### Why Collaborator Commits Fail on Vercel Hobby Plan
On **Vercel's Hobby (Free) plan**, Vercel strictly enforces account-level deployment access:
- **Only commits authored by the Vercel project owner** trigger automatic builds and deployments.
- When an external team member, student collaborator, or contributor pushes code or merges a pull request, Vercel refuses to deploy and marks the commit with a red cross:
  ```text
  X 0/1 — User does not have permission to deploy on this plan
  ```
- Teams are often prompted to upgrade to **Vercel Pro ($20/user/month)** just so team members can see their changes deployed on preview/production branches.

### The Solution: Owner Auto-Commit Dispatch Pattern
Instead of paying for team seats, a lightweight **GitHub Actions workflow** acts as an automated deployment dispatcher:
1. A collaborator pushes code to `main` or `dev`.
2. Vercel rejects the collaborator's commit.
3. GitHub Actions triggers automatically, detects that code was pushed, and generates an **empty commit (`git commit --allow-empty`)** authored explicitly by the **Project Owner**.
4. The Action pushes this empty commit back to the repository.
5. GitHub's webhook notifies Vercel of a commit authored by the project owner.
6. **Vercel builds and deploys successfully (`✓ 1/1`) without permission errors!**

```
┌────────────────────────────────┐
│  Collaborator pushes code      │
└───────────────┬────────────────┘
                │
                ├──────────────────────────────────────┐
                ▼                                      ▼
┌───────────────────────────────┐      ┌───────────────────────────────┐
│ Vercel rejects commit (X 0/1) │      │ GitHub Action triggers        │
│ "No permission on Hobby plan" │      │ (auto-commit-dispatch.yml)     │
└───────────────────────────────┘      └───────────────┬───────────────┘
                                                       │
                                                       ▼
                                       ┌───────────────────────────────┐
                                       │ Creates empty commit authored │
                                       │ as the PROJECT OWNER          │
                                       └───────────────┬───────────────┘
                                                       │
                                                       ▼
                                       ┌───────────────────────────────┐
                                       │ Pushes commit to branch       │
                                       └───────────────┬───────────────┘
                                                       │
                                                       ▼
                                       ┌───────────────────────────────┐
                                       │ Vercel sees OWNER commit      │
                                       │ Deployment succeeds! (✓ 1/1)  │
                                       └───────────────────────────────┘
```

---

## 2. GitHub Repository Settings (Crucial Prerequisites)

Before adding the workflow file, you **must** configure these settings in your GitHub repository.

### Step 1: Enable Workflow Write Permissions
By default, GitHub restricts `GITHUB_TOKEN` to read-only access. You must grant write access so the action can push the trigger commit:

1. Open your repository on GitHub.
2. Go to **Settings** > **Actions** > **General**.
3. Scroll down to the **Workflow permissions** section.
4. Select **`Read and write permissions`**.
5. *(Optional but recommended)* Check **`Allow GitHub Actions to create and approve pull requests`**.
6. **Click the blue `Save` button.**

![Workflow Permissions](https://docs.github.com/assets/cb-37330/images/help/settings/actions-workflow-permissions-read-and-write.png)

---

### Step 2: Configure Owner Repository Secrets (Recommended)
To ensure the commit is always attributed to your account, configure your GitHub username and email:

1. Go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Add the following two secrets:

| Secret Name | Value Example | Description |
|:---|:---|:---|
| `COMMIT_USER_NAME` | `YourGitHubUsername` | Your GitHub handle (owner of the Vercel project). |
| `COMMIT_USER_EMAIL` | `your-email@gmail.com` | **Must be the primary email** registered with your GitHub and Vercel account. |

> [!TIP]
> **One-Command Setup via GitHub CLI (`gh`)**:
> If you have `gh` CLI installed, run this in your terminal:
> ```bash
> gh secret set COMMIT_USER_NAME -b "YourGitHubUsername"
> gh secret set COMMIT_USER_EMAIL -b "your-email@example.com"
> ```

---

### Step 3: Branch Protection Rules (If Applicable)
If your repository has branch protection enabled on `main`:
- Navigate to **Settings** > **Branches** > Your branch rule.
- If **"Require a pull request before merging"** is active:
  - Add `github-actions[bot]` to **"Allow specified actors to bypass required pull requests"**.
  - Or uncheck **"Do not allow bypassing the above settings"** for repository administrators.

---

## 3. Production-Ready Workflow File

Create the following file in your repository at:  
`.github/workflows/auto-commit-dispatch.yml`

```yaml
# ==============================================================================
# Vercel Auto-Commit Deploy Dispatcher
#
# Solves Vercel Hobby Plan deployment restriction where non-owner collaborator
# commits are blocked. Automatically generates an empty trigger commit authored
# by the repository/Vercel project owner whenever any collaborator pushes code.
# ==============================================================================

name: Vercel Auto Commit Deploy

on:
  push:
    branches:
      - main
      - dev
  workflow_dispatch: # Allows manual trigger from GitHub Actions UI

permissions:
  contents: write

jobs:
  make-vercel-trigger-commit:
    name: Trigger Vercel Deployment via Owner Commit
    runs-on: ubuntu-latest
    # Prevent infinite loops: only run for human commits and ignore existing trigger commits
    if: ${{ !contains(github.actor, '[bot]') && !contains(github.event.head_commit.message, 'trigger vercel deployment') }}
    steps:
      - name: Checkout repository branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.ref_name }}
          token: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Configure Git identity (Project Owner)
        run: |
          # 1. Check for Repository Secrets
          NAME="${{ secrets.COMMIT_USER_NAME }}"
          EMAIL="${{ secrets.COMMIT_USER_EMAIL }}"

          # 2. Auto-detect repository owner if secrets are not set
          if [ -z "$NAME" ]; then
            NAME="${{ github.repository_owner }}"
          fi

          if [ -z "$EMAIL" ]; then
            # Uses GitHub's verified noreply email for the repository owner
            EMAIL="${{ github.repository_owner }}@users.noreply.github.com"
          fi

          echo "Configuring commit identity as: $NAME <$EMAIL>"
          git config user.name "$NAME"
          git config user.email "$EMAIL"

      - name: Create empty trigger commit
        run: |
          # Rebase to absorb concurrent pushes before committing
          git pull --rebase origin ${{ github.ref_name }} || true
          git commit --allow-empty -m "chore(${{ github.ref_name }}): trigger vercel deployment"

      - name: Push trigger commit to GitHub
        run: |
          git push origin HEAD:${{ github.ref_name }}
```

---

## 4. How the Auto-Detection & Fallback System Works

The workflow uses a 3-tier identity resolution strategy so it works for anyone:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Check Repository Secrets:                                │
│    Does COMMIT_USER_NAME and COMMIT_USER_EMAIL exist?       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
             YES│                             │NO
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│ Use exact Secret values:      │ │ Auto-Detect Repo Owner:   │
│ • NAME = Secrets.NAME         │ │ • NAME = repository_owner │
│ • EMAIL = Secrets.EMAIL       │ │ • EMAIL = owner@noreply   │
└───────────────────────────────┘ └───────────────────────────┘
```

1. **Tier 1 (Explicit Secrets)**: If `COMMIT_USER_NAME` and `COMMIT_USER_EMAIL` are configured in GitHub Secrets, they take priority.
2. **Tier 2 (Auto-Detection)**: If secrets are omitted, the workflow automatically uses `${{ github.repository_owner }}` and `${{ github.repository_owner }}@users.noreply.github.com`.
3. **Tier 3 (Hardcoded Fallback)**: You can optionally replace `NAME="YourName"` and `EMAIL="your-email@example.com"` directly in lines 39–45 of the YAML if you prefer zero-secret setup.

---

## 5. Verifying the Setup

### Test 1: Push a Change as a Collaborator
1. Have a collaborator clone the repo and push a change:
   ```bash
   git commit -m "feat: update component"
   git push origin main
   ```
2. In GitHub, look at **Commits**:
   - The collaborator's commit will show a red cross (`X 0/1`) from Vercel.
   - 5–10 seconds later, a new commit will appear directly above it:
     ```text
     chore(main): trigger vercel deployment
     YourOwnerUsername committed just now · ✓ 1/1
     ```
3. Visit your **Vercel Dashboard**:
   - The deployment status will change from Failed to **Ready (Production)**.

### Test 2: Manual Trigger via GitHub Actions UI
1. Go to the **Actions** tab on your GitHub repository.
2. Select **Vercel Auto Commit Deploy** from the left sidebar.
3. Click **Run workflow** > Select branch (`main`) > Click **Run workflow**.
4. Within 10 seconds, a fresh Vercel build will be triggered.

---

## 6. Troubleshooting & Gotchas Checklist

| Issue / Error | Root Cause | Solution |
|:---|:---|:---|
| **`Permission to repo denied to github-actions[bot]` (HTTP 403)** | Workflow permissions are still set to "Read-only". | Go to **Settings > Actions > General > Workflow permissions**, select **Read and write permissions**, and click **Save**. |
| **Trigger commit appears, but Vercel still shows red cross (`X 0/1`)** | The email configured in `COMMIT_USER_EMAIL` is not verified on your GitHub or Vercel account. | Go to GitHub **Settings > Emails** and verify that the exact email matches your Vercel login email. |
| **Workflow creates endless commits (Infinite Loop)** | The bot and message check was removed from the YAML. | Ensure line 23 contains: `if: ${{ !contains(github.actor, '[bot]') && !contains(github.event.head_commit.message, 'trigger vercel deployment') }}`. |
| **`Protected branch hook declined` error on push** | Branch protection rules on `main` prevent bots from pushing. | In **Settings > Branches**, add `github-actions[bot]` to the pull request bypass list. |
| **Vercel cancels previous builds** | Multiple commits pushed within a few seconds. | Normal behavior. Vercel automatically cancels outdated builds to deploy the latest commit. |

---

## 7. Summary Cheat-Sheet (Zero to Deployed in 2 Minutes)

1. **Enable Write Permissions**: `Repo Settings > Actions > General > Read and write permissions > Save`.
2. **Add Secrets**:
   ```bash
   gh secret set COMMIT_USER_NAME -b "<your-github-username>"
   gh secret set COMMIT_USER_EMAIL -b "<your-vercel-email>"
   ```
3. **Add Workflow**: Save `.github/workflows/auto-commit-dispatch.yml`.
4. **Push & Enjoy**: All future collaborator commits will now auto-deploy to Vercel for free!
